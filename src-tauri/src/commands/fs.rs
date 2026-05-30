use std::{
    fs,
    time::UNIX_EPOCH,
};

use tauri::State;

use crate::{
    error::AppError,
    models::{CreateFileResult, FileEntry, ReadFileResult, RenameResult, WriteFileResult},
    paths::to_forward_slashes,
    state::AppState,
};

#[tauri::command]
pub fn read_directory(
    state: State<AppState>,
    path: String,
    depth: i64,
) -> Result<Vec<FileEntry>, String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;
    read_dir_recursive(&native, depth).map_err(String::from)
}

fn read_dir_recursive(
    dir: &std::path::Path,
    depth: i64,
) -> Result<Vec<FileEntry>, AppError> {
    let mut entries: Vec<FileEntry> = Vec::new();

    let read = fs::read_dir(dir)?;
    let mut items: Vec<std::fs::DirEntry> = read.filter_map(|e| e.ok()).collect();
    items.sort_by(|a, b| {
        let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
        match (a_is_dir, b_is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.file_name().to_string_lossy().to_lowercase()
                .cmp(&b.file_name().to_string_lossy().to_lowercase()),
        }
    });

    for entry in items {
        let name = entry.file_name().to_string_lossy().to_string();
        // Skip dotfiles
        if name.starts_with('.') {
            continue;
        }

        let file_type = entry.file_type().unwrap_or_else(|_| {
            // treat as file if we can't determine
            entry.file_type().expect("file_type failed twice")
        });

        let is_dir = match entry.file_type() {
            Ok(ft) => ft.is_dir(),
            Err(_) => continue,
        };

        let entry_path = entry.path();
        let path_str = to_forward_slashes(&entry_path);

        if is_dir {
            let children = if depth > 1 {
                Some(read_dir_recursive(&entry_path, depth - 1)?)
            } else {
                None
            };
            entries.push(FileEntry {
                name,
                path: path_str,
                is_directory: true,
                children,
            });
        } else {
            // Only include markdown files
            let ext = entry_path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            if ext == "md" || ext == "markdown" {
                entries.push(FileEntry {
                    name,
                    path: path_str,
                    is_directory: false,
                    children: None,
                });
            }
        }
    }

    Ok(entries)
}

#[tauri::command]
pub fn read_file(state: State<AppState>, path: String) -> Result<ReadFileResult, String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;

    let meta = fs::metadata(&native).map_err(|e| AppError::Io(e).to_string())?;
    let mtime = meta
        .modified()
        .map(|t| t.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as f64)
        .unwrap_or(0.0);

    let raw = fs::read_to_string(&native).map_err(|e| AppError::Io(e).to_string())?;
    let content = raw.replace("\r\n", "\n");

    Ok(ReadFileResult {
        content,
        path: to_forward_slashes(&native),
        mtime,
    })
}

#[tauri::command]
pub fn write_file(
    state: State<AppState>,
    path: String,
    content: String,
) -> Result<WriteFileResult, String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;

    if let Some(parent) = native.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::Io(e).to_string())?;
    }

    fs::write(&native, content).map_err(|e| AppError::Io(e).to_string())?;

    Ok(WriteFileResult {
        success: true,
        path: to_forward_slashes(&native),
    })
}

#[tauri::command]
pub fn create_directory(state: State<AppState>, path: String) -> Result<(), String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;
    fs::create_dir_all(&native).map_err(|e| AppError::Io(e).to_string())
}

#[tauri::command]
pub fn create_file(state: State<AppState>, path: String) -> Result<CreateFileResult, String> {
    let native = state.sandbox.assert_allowed(&path).map_err(String::from)?;

    if native.exists() {
        return Err(format!("File already exists: {}", path));
    }

    if let Some(parent) = native.parent() {
        fs::create_dir_all(parent).map_err(|e| AppError::Io(e).to_string())?;
    }

    fs::write(&native, "").map_err(|e| AppError::Io(e).to_string())?;

    Ok(CreateFileResult {
        path: to_forward_slashes(&native),
    })
}

#[tauri::command]
pub fn rename_file(
    state: State<AppState>,
    old_path: String,
    new_path: String,
) -> Result<RenameResult, String> {
    let old_native = state.sandbox.assert_allowed(&old_path).map_err(String::from)?;
    let new_native = state.sandbox.assert_allowed(&new_path).map_err(String::from)?;

    fs::rename(&old_native, &new_native).map_err(|e| AppError::Io(e).to_string())?;

    Ok(RenameResult {
        new_path: to_forward_slashes(&new_native),
    })
}
