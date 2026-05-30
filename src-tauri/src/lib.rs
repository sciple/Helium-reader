mod commands;
mod error;
mod menu;
mod models;
mod paths;
mod sandbox;
mod state;

use state::AppState;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .manage(AppState::default())
        .menu(|app| menu::build_menu(app))
        .on_menu_event(|app, event| {
            let id = event.id().as_ref().to_string();

            // Context menu items: resolve the pending oneshot
            if id.starts_with("ctx:") {
                let state = app.state::<AppState>();
                let mut pending = state.ctx_pending.lock().unwrap();
                if let Some(tx) = pending.take() {
                    let _ = tx.send(Some(id));
                }
                return;
            }

            // App menu items: emit as Tauri events so the renderer shim can listen
            let _ = app.emit(&id, ());
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat::chat_send,
            commands::chat::chat_abort,
            commands::chat::transform_send,
            commands::chat::transform_abort,
            commands::fs::read_directory,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::create_directory,
            commands::fs::create_file,
            commands::fs::rename_file,
            commands::dialog::open_folder_dialog,
            commands::dialog::save_as_dialog,
            commands::dialog::confirm_discard,
            commands::window::set_window_title,
            commands::window::set_focus_mode,
            commands::window::window_control,
            commands::watcher::watch_folder,
            commands::watcher::unwatch_folder,
            commands::context_menu::show_file_context_menu,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
