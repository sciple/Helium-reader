use tauri::{AppHandle, State};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogResult};

use crate::{
    paths::to_forward_slashes,
    state::AppState,
};

#[tauri::command]
pub async fn open_folder_dialog(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    let folder = app.dialog().file().blocking_pick_folder();

    Ok(match folder {
        Some(path) => {
            let p = path.to_string().replace('\\', "/");
            state.sandbox.bless(&p);
            Some(p)
        }
        None => None,
    })
}

#[tauri::command]
pub async fn save_as_dialog(
    app: AppHandle,
    state: State<'_, AppState>,
    default_path: String,
) -> Result<Option<String>, String> {
    let native_default = default_path.replace('/', std::path::MAIN_SEPARATOR_STR);
    let default = std::path::Path::new(&native_default);

    let mut builder = app.dialog().file().add_filter("Markdown", &["md", "markdown"]);
    if let Some(name) = default.file_name() {
        builder = builder.set_file_name(name.to_string_lossy().as_ref());
    }
    if let Some(parent) = default.parent() {
        if parent.exists() {
            builder = builder.set_directory(parent);
        }
    }

    Ok(match builder.blocking_save_file() {
        Some(path) => {
            let p = path.to_string().replace('\\', "/");
            if let Some(parent) = std::path::Path::new(&p.replace('/', std::path::MAIN_SEPARATOR_STR)).parent() {
                state.sandbox.bless(&to_forward_slashes(parent));
            }
            Some(p)
        }
        None => None,
    })
}

#[tauri::command]
pub async fn confirm_discard(
    app: AppHandle,
    file_name: String,
) -> Result<String, String> {
    const SAVE: &str = "Save";
    const DISCARD: &str = "Don't Save";

    let result = app
        .dialog()
        .message(format!("Do you want to save changes to \"{}\"?", file_name))
        .title("Unsaved Changes")
        .buttons(MessageDialogButtons::YesNoCancelCustom(
            SAVE.to_string(),
            DISCARD.to_string(),
            "Cancel".to_string(),
        ))
        .blocking_show_with_result();

    // Anything other than an explicit Save / Don't Save — including closing the
    // dialog with X or Esc — is a cancel, so unsaved work is never dropped by accident.
    Ok(match result {
        MessageDialogResult::Yes => "save",
        MessageDialogResult::No => "discard",
        MessageDialogResult::Custom(ref label) if label == SAVE => "save",
        MessageDialogResult::Custom(ref label) if label == DISCARD => "discard",
        _ => "cancel",
    }
    .to_string())
}
