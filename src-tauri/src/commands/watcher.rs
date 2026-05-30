use std::{path::PathBuf, time::Duration};

use notify::RecursiveMode;
use notify_debouncer_full::{new_debouncer, DebounceEventResult, FileIdMap};
use tauri::{AppHandle, Emitter, State};

use crate::{
    models::FileChangedPayload,
    paths::{from_forward_slashes, to_forward_slashes},
    state::{AppState, WatchHandle},
};

#[tauri::command]
pub fn watch_folder(
    app: AppHandle,
    state: State<AppState>,
    path: String,
) -> Result<(), String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;

    {
        let watchers = state.watchers.0.lock().unwrap();
        if watchers.contains_key(&path) {
            return Ok(());
        }
    }

    let app_handle = app.clone();
    let debouncer = new_debouncer(
        Duration::from_millis(150),
        None,
        move |result: DebounceEventResult| {
            let events = match result {
                Ok(evs) => evs,
                Err(_) => return,
            };

            for debounced in events {
                use notify::EventKind::*;
                let kind = &debounced.event.kind;
                let event_name = match kind {
                    Create(_) => "add",
                    Modify(notify::event::ModifyKind::Name(
                        notify::event::RenameMode::From,
                    )) => "unlink",
                    Modify(notify::event::ModifyKind::Name(
                        notify::event::RenameMode::To,
                    )) => "add",
                    Modify(_) => "change",
                    Remove(_) => "unlink",
                    _ => continue,
                };

                for path in &debounced.event.paths {
                    // Skip dotfiles / hidden paths
                    if path_has_dotfile(path) {
                        continue;
                    }

                    let payload = FileChangedPayload {
                        path: to_forward_slashes(path),
                        event: event_name.to_string(),
                    };

                    let _ = app_handle.emit("fs:changed", payload);
                }
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(&native, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    state
        .watchers
        .0
        .lock()
        .unwrap()
        .insert(path, WatchHandle { _debouncer: debouncer });

    Ok(())
}

#[tauri::command]
pub fn unwatch_folder(state: State<AppState>, path: String) -> Result<(), String> {
    state.watchers.0.lock().unwrap().remove(&path);
    Ok(())
}

fn path_has_dotfile(p: &PathBuf) -> bool {
    p.components().any(|c| {
        c.as_os_str()
            .to_string_lossy()
            .starts_with('.')
    })
}
