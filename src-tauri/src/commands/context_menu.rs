use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    AppHandle, Manager, Runtime, State, Window,
};
use tokio::sync::oneshot;

use crate::{paths::from_forward_slashes, state::AppState};

#[tauri::command]
pub async fn show_file_context_menu<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    state: State<'_, AppState>,
    path: String,
) -> Result<Option<String>, String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;

    let (tx, rx) = oneshot::channel::<Option<String>>();

    // Replace any stale pending sender
    {
        let mut pending = state.ctx_pending.lock().unwrap();
        if let Some(old_tx) = pending.take() {
            let _ = old_tx.send(None);
        }
        *pending = Some(tx);
    }

    let menu = MenuBuilder::new(&app)
        .item(&MenuItemBuilder::with_id("ctx:rename", "Rename").build(&app).map_err(|e| e.to_string())?)
        .item(&MenuItemBuilder::with_id("ctx:delete", "Delete").build(&app).map_err(|e| e.to_string())?)
        .separator()
        .item(&MenuItemBuilder::with_id("ctx:reveal", "Show in File Explorer").build(&app).map_err(|e| e.to_string())?)
        .build()
        .map_err(|e| e.to_string())?;

    menu.popup(window).map_err(|e| e.to_string())?;

    // Await the selection (resolved by on_menu_event in lib.rs)
    let choice = rx.await.unwrap_or(None);

    // Handle side effects for delete and reveal
    if let Some(ref action) = choice {
        match action.as_str() {
            "ctx:delete" => {
                trash::delete(&native).map_err(|e| e.to_string())?;
                return Ok(None);
            }
            "ctx:reveal" => {
                // Use opener plugin to reveal in file explorer
                let _ = app.opener().reveal_item_in_dir(&native);
                return Ok(None);
            }
            _ => {}
        }
    }

    Ok(choice.and_then(|c| if c == "ctx:rename" { Some("rename".to_string()) } else { None }))
}
