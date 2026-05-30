use tauri::{Runtime, Window};

#[tauri::command]
pub fn set_window_title<R: Runtime>(window: Window<R>, title: String) -> Result<(), String> {
    window.set_title(&title).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_focus_mode<R: Runtime>(window: Window<R>, enabled: bool) -> Result<(), String> {
    // With decorations:false, there's no native menu bar to toggle.
    // Just toggle fullscreen for focus mode.
    window.set_fullscreen(enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn window_control<R: Runtime>(window: Window<R>, action: String) -> Result<(), String> {
    match action.as_str() {
        "minimize" => window.minimize().map_err(|e| e.to_string()),
        "maximize" => {
            if window.is_maximized().unwrap_or(false) {
                window.unmaximize().map_err(|e| e.to_string())
            } else {
                window.maximize().map_err(|e| e.to_string())
            }
        }
        "close" => window.close().map_err(|e| e.to_string()),
        _ => Err(format!("Unknown window action: {}", action)),
    }
}
