use std::{
    collections::HashSet,
    path::PathBuf,
    sync::Mutex,
};

use crate::{error::AppError, paths::{from_forward_slashes, resolve_lexical}};

#[derive(Default)]
pub struct Sandbox(pub Mutex<HashSet<PathBuf>>);

impl Sandbox {
    /// Bless a path so the renderer may access it and its descendants.
    pub fn bless(&self, path: &str) {
        let resolved = resolve_lexical(&from_forward_slashes(path));
        self.0.lock().unwrap().insert(resolved);
    }

    /// Assert that `path` (forward-slashed from renderer) is within a blessed root.
    /// Returns the native PathBuf if allowed.
    pub fn assert_allowed(&self, path: &str) -> Result<PathBuf, AppError> {
        let resolved = resolve_lexical(&from_forward_slashes(path));
        let roots = self.0.lock().unwrap();
        for root in roots.iter() {
            if resolved == *root || resolved.starts_with(root) {
                return Ok(resolved);
            }
        }
        Err(AppError::AccessDenied(path.to_string()))
    }
}
