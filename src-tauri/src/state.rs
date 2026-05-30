use std::{collections::HashMap, sync::Mutex};
use notify_debouncer_full::{notify::RecommendedWatcher, Debouncer, FileIdMap};
use tokio::sync::oneshot;
use tauri::async_runtime::JoinHandle;

use crate::sandbox::Sandbox;

pub struct WatchHandle {
    pub _debouncer: Debouncer<RecommendedWatcher, FileIdMap>,
}

#[derive(Default)]
pub struct Watchers(pub Mutex<HashMap<String, WatchHandle>>);

#[derive(Default)]
pub struct AppState {
    pub sandbox: Sandbox,
    pub watchers: Watchers,
    pub ctx_pending: Mutex<Option<oneshot::Sender<Option<String>>>>,
    pub chat_handle: Mutex<Option<JoinHandle<()>>>,
}
