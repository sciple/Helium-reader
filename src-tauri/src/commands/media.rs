use std::{fs, path::Path};

use base64::{engine::general_purpose::STANDARD, Engine};
use tauri::State;

use crate::{
    error::AppError, models::SaveMediaResult, paths::to_forward_slashes, state::AppState,
};

/// Extensions we are willing to write into the media folder.
const ALLOWED_EXTENSIONS: [&str; 8] = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"];

const MAX_STEM_LEN: usize = 80;
const MAX_DEDUPE_ATTEMPTS: u32 = 1000;

/// Save an image into a media directory inside the sandbox.
///
/// `dir` is forward-slashed (e.g. "D:/Notes/media") and is created if missing.
/// `file_name` is a *suggested* name — it is sanitized here, never trusted as-is.
/// `data` is the base64-encoded raw bytes.
#[tauri::command]
pub fn save_media_image(
    state: State<AppState>,
    dir: String,
    file_name: String,
    data: String,
) -> Result<SaveMediaResult, String> {
    let native_dir = state.sandbox.assert_allowed(&dir).map_err(String::from)?;

    let (stem, ext) = sanitize_name(&file_name);

    let bytes = STANDARD
        .decode(data.as_bytes())
        .map_err(|e| AppError::Other(format!("Invalid image data: {}", e)).to_string())?;

    fs::create_dir_all(&native_dir).map_err(|e| AppError::Io(e).to_string())?;

    let (target, final_name) = unique_path(&native_dir, &stem, &ext)?;

    fs::write(&target, bytes).map_err(|e| AppError::Io(e).to_string())?;

    Ok(SaveMediaResult {
        path: to_forward_slashes(&target),
        file_name: final_name,
    })
}

/// Reduce an arbitrary suggested name to a safe (stem, extension) pair.
fn sanitize_name(raw: &str) -> (String, String) {
    // Drop any directory component the renderer may have sent.
    let base = Path::new(raw)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    let ext = Path::new(&base)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .filter(|e| ALLOWED_EXTENSIONS.contains(&e.as_str()))
        .unwrap_or_else(|| "png".to_string());

    let raw_stem = Path::new(&base)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    let mut stem = String::new();
    let mut last_was_space = false;
    for c in raw_stem.chars() {
        let cleaned = match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '-',
            c if c.is_control() => '-',
            c if c.is_whitespace() => ' ',
            c => c,
        };
        // Collapse runs of whitespace
        if cleaned == ' ' {
            if last_was_space || stem.is_empty() {
                continue;
            }
            last_was_space = true;
        } else {
            last_was_space = false;
        }
        stem.push(cleaned);
        if stem.chars().count() >= MAX_STEM_LEN {
            break;
        }
    }

    // Windows rejects names ending in a dot or space.
    let stem = stem.trim_end_matches(['.', ' ']).to_string();

    let stem = if stem.is_empty() {
        "image".to_string()
    } else {
        stem
    };

    (stem, ext)
}

/// Find a free path in `dir`, appending -1, -2, ... on collision.
fn unique_path(
    dir: &Path,
    stem: &str,
    ext: &str,
) -> Result<(std::path::PathBuf, String), String> {
    for n in 0..MAX_DEDUPE_ATTEMPTS {
        let name = if n == 0 {
            format!("{}.{}", stem, ext)
        } else {
            format!("{}-{}.{}", stem, n, ext)
        };
        let candidate = dir.join(&name);
        if !candidate.exists() {
            return Ok((candidate, name));
        }
    }
    Err(AppError::Other(format!("Could not find a free name for {}.{}", stem, ext)).to_string())
}
