use reqwest::Client;
use serde::Deserialize;
use tauri::{AppHandle, Emitter, State};

use crate::state::AppState;

#[derive(Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[tauri::command]
pub fn chat_send(
    app: AppHandle,
    state: State<'_, AppState>,
    url: String,
    model: String,
    messages: Vec<ChatMessage>,
) {
    // Abort any in-flight stream before starting a new one
    {
        let mut handle = state.chat_handle.lock().unwrap();
        if let Some(h) = handle.take() {
            h.abort();
        }
    }

    let app_clone = app.clone();
    let handle = tauri::async_runtime::spawn(async move {
        if let Err(e) = stream_chat(app_clone.clone(), url, model, messages).await {
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
        // Emit done so the renderer clears its streaming state
        let _ = app.emit("chat:done", ());
    }
}

async fn stream_chat(
    app: AppHandle,
    url: String,
    model: String,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
    let endpoint = format!("{}/v1/chat/completions", url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model,
        "messages": messages.iter().map(|m| serde_json::json!({
            "role": m.role,
            "content": m.content,
        })).collect::<Vec<_>>(),
        "stream": true,
    });

    let mut response = Client::new()
        .post(&endpoint)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status(), response.status().canonical_reason().unwrap_or("")));
    }

    let mut buffer = String::new();

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        loop {
            match buffer.find('\n') {
                None => break,
                Some(pos) => {
                    let line = buffer[..pos].trim().to_string();
                    buffer = buffer[pos + 1..].to_string();

                    let Some(data) = line.strip_prefix("data: ") else {
                        continue;
                    };

                    if data == "[DONE]" {
                        let _ = app.emit("chat:done", ());
                        return Ok(());
                    }

                    if let Ok(obj) = serde_json::from_str::<serde_json::Value>(data) {
                        // Delta text content
                        if let Some(content) = obj["choices"][0]["delta"]["content"].as_str() {
                            if !content.is_empty() {
                                let _ = app.emit("chat:chunk", content);
                            }
                        }

                        // Usage (present in the last chunk for some providers)
                        if let Some(usage) = obj.get("usage").filter(|u| !u.is_null()) {
                            let prompt = usage["prompt_tokens"].as_u64().unwrap_or(0);
                            let completion = usage["completion_tokens"].as_u64().unwrap_or(0);
                            if prompt > 0 || completion > 0 {
                                let _ = app.emit("chat:usage", serde_json::json!({
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

    // Stream ended without an explicit [DONE] line
    let _ = app.emit("chat:done", ());
    Ok(())
}
