use std::{collections::HashMap, sync::Mutex};
use notify_debouncer_full::{DebounceEventHandler, Debouncer, RecommendedCache};
use notify::RecommendedWatcher;
use tokio::sync::oneshot;

use crate::sandbox::Sandbox;

pub struct WatchHandle {
    pub _debouncer: Debouncer<RecommendedWatcher, RecommendedCache>,
}

#[derive(Default)]
pub struct Watchers(pub Mutex<HashMap<String, WatchHandle>>);

#[derive(Default)]
pub struct AppState {
    pub sandbox: Sandbox,
    pub watchers: Watchers,
    pub ctx_pending: Mutex<Option<oneshot::Sender<Option<String>>>>,
}
