use reqwest::Client;
use serde::Deserialize;
use tauri::{AppHandle, Emitter, State};

use crate::state::AppState;

#[derive(Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

// ── Chat ─────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn chat_send(
    app: AppHandle,
    state: State<'_, AppState>,
    url: String,
    model: String,
    messages: Vec<ChatMessage>,
) {
    {
        let mut handle = state.chat_handle.lock().unwrap();
        if let Some(h) = handle.take() { h.abort(); }
    }
    let app_clone = app.clone();
    let handle = tauri::async_runtime::spawn(async move {
        if let Err(e) = stream_completion(app_clone.clone(), url, model, messages, "chat").await {
            let _ = app_clone.emit("chat:error", e);
            let _ = app_clone.emit("chat:done", ());
        }
    });
    *state.chat_handle.lock().unwrap() = Some(handle);
}

#[tauri::command]
pub fn chat_abort(app: AppHandle, state: State<'_, AppState>) {
    let mut handle = state.chat_handle.lock().unwrap();
    if let Some(h) = handle.take() {
        h.abort();
        let _ = app.emit("chat:done", ());
    }
}

// ── Transform ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn transform_send(
    app: AppHandle,
    state: State<'_, AppState>,
    url: String,
    model: String,
    messages: Vec<ChatMessage>,
) {
    {
        let mut handle = state.transform_handle.lock().unwrap();
        if let Some(h) = handle.take() { h.abort(); }
    }
    let app_clone = app.clone();
    let handle = tauri::async_runtime::spawn(async move {
        if let Err(e) = stream_completion(app_clone.clone(), url, model, messages, "transform").await {
            let _ = app_clone.emit("transform:error", e);
            let _ = app_clone.emit("transform:done", ());
        }
    });
    *state.transform_handle.lock().unwrap() = Some(handle);
}

#[tauri::command]
pub fn transform_abort(app: AppHandle, state: State<'_, AppState>) {
    let mut handle = state.transform_handle.lock().unwrap();
    if let Some(h) = handle.take() {
        h.abort();
        let _ = app.emit("transform:done", ());
    }
}

// ── Shared streaming helper ───────────────────────────────────────────────────

async fn stream_completion(
    app: AppHandle,
    url: String,
    model: String,
    messages: Vec<ChatMessage>,
    prefix: &str,
) -> Result<(), String> {
    let endpoint = format!("{}/v1/chat/completions", url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model,
        "messages": messages.iter().map(|m| serde_json::json!({
            "role": m.role,
            "content": m.content,
        })).collect::<Vec<_>>(),
        "stream": true,
        "stream_options": { "include_usage": true },
    });

    let mut response = Client::new()
        .post(&endpoint)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status(),
            response.status().canonical_reason().unwrap_or("")));
    }

    let chunk_event = format!("{}:chunk", prefix);
    let done_event  = format!("{}:done",  prefix);
    let usage_event = format!("{}:usage", prefix);

    let mut buffer = String::new();

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        loop {
            match buffer.find('\n') {
                None => break,
                Some(pos) => {
                    let line = buffer[..pos].trim().to_string();
                    buffer = buffer[pos + 1..].to_string();

                    let Some(data) = line.strip_prefix("data: ") else { continue };

                    if data == "[DONE]" {
                        let _ = app.emit(&done_event, ());
                        return Ok(());
                    }

                    if let Ok(obj) = serde_json::from_str::<serde_json::Value>(data) {
                        if let Some(content) = obj["choices"][0]["delta"]["content"].as_str() {
                            if !content.is_empty() {
                                let _ = app.emit(&chunk_event, content);
                            }
                        }
                        if let Some(usage) = obj.get("usage").filter(|u| !u.is_null()) {
                            let prompt     = usage["prompt_tokens"].as_u64().unwrap_or(0);
                            let completion = usage["completion_tokens"].as_u64().unwrap_or(0);
                            if prompt > 0 || completion > 0 {
                                let _ = app.emit(&usage_event, serde_json::json!({
                                    "promptTokens": prompt,
                                    "completionTokens": completion,
                                }));
                            }
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit(&done_event, ());
    Ok(())
}
