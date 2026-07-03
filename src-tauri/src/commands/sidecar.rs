use std::sync::Arc;
use tauri::{AppHandle, State};

use crate::sidecar::manager::ensure_sidecar_running;
use crate::state::AppState;

#[tauri::command]
pub fn start_sidecar(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
) -> Result<u16, String> {
    let state = state.inner().clone();
    ensure_sidecar_running(&app, &state)
}
