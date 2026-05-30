use std::time::Duration;

use notify_debouncer_full::{
    new_debouncer,
    notify::{EventKind, RecursiveMode, Watcher},
    DebounceEventResult,
};
use tauri::{AppHandle, Emitter, State};

use crate::{
    models::FileChangedPayload,
    paths::to_forward_slashes,
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
    let mut debouncer = new_debouncer(
        Duration::from_millis(150),
        None,
        move |result: DebounceEventResult| {
            let events = match result {
                Ok(evs) => evs,
                Err(_) => return,
            };

            for debounced in events {
                let event_name = match &debounced.event.kind {
                    EventKind::Create(_) => "add",
                    EventKind::Modify(notify_debouncer_full::notify::event::ModifyKind::Name(
                        notify_debouncer_full::notify::event::RenameMode::From,
                    )) => "unlink",
                    EventKind::Modify(notify_debouncer_full::notify::event::ModifyKind::Name(
                        notify_debouncer_full::notify::event::RenameMode::To,
                    )) => "add",
                    EventKind::Modify(_) => "change",
                    EventKind::Remove(_) => "unlink",
                    _ => continue,
                };

                for p in &debounced.event.paths {
                    if path_has_dotfile(p) {
                        continue;
                    }
                    let payload = FileChangedPayload {
                        path: to_forward_slashes(p),
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

fn path_has_dotfile(p: &std::path::Path) -> bool {
    p.components().any(|c| {
        c.as_os_str().to_string_lossy().starts_with('.')
    })
}
