use std::sync::Arc;
use tauri::{AppHandle, State};

use crate::job::models::QueueRequest;
use crate::job::queue::{cancel_pending_jobs as cancel_fn, enqueue_job as enqueue_fn};
use crate::state::AppState;

#[tauri::command]
pub fn enqueue_job(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    request: QueueRequest,
) -> Result<String, String> {
    enqueue_fn(app, state, request)
}

#[tauri::command]
pub fn cancel_pending_jobs(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
) -> Result<usize, String> {
    cancel_fn(app, state)
}
