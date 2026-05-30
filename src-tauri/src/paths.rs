use std::path::{Path, PathBuf};

pub fn to_forward_slashes(p: &Path) -> String {
    p.to_string_lossy().replace('\\', "/")
}

pub fn from_forward_slashes(s: &str) -> PathBuf {
    PathBuf::from(s.replace('/', std::path::MAIN_SEPARATOR_STR))
}

/// Lexical absolute path resolution matching Node's path.resolve() semantics.
/// Does not require the path to exist (unlike canonicalize).
pub fn resolve_lexical(p: &Path) -> PathBuf {
    if p.is_absolute() {
        normalize_lexical(p)
    } else {
        let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        normalize_lexical(&cwd.join(p))
    }
}

/// Remove . and .. components from an absolute path.
fn normalize_lexical(p: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in p.components() {
        use std::path::Component::*;
        match comp {
            CurDir => {}
            ParentDir => {
                out.pop();
            }
            c => out.push(c),
        }
    }
    // Strip \\?\ prefix that Windows may have added
    dunce_strip(out)
}

fn dunce_strip(p: PathBuf) -> PathBuf {
    // Use dunce to normalize \\?\ paths to regular paths
    dunce::simplified(&p).to_path_buf()
}
