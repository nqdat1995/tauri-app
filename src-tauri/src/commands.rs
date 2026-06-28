use crate::orchestrator::{enqueue_job as enqueue_job_cmd, cancel_pending_jobs as cancel_pending_jobs_cmd, start_sidecar as start_sidecar_cmd, AppState, QueueRequest};
use crate::storage::{project_file_path, save_project_file};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn save_project(json: String) -> Result<String, String> {
    let project: Value = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    let id = project
        .get("id")
        .and_then(|x| x.as_str())
        .ok_or_else(|| "missing id field".to_string())?;

    let file_path = project_file_path(id)?;
    save_project_file(&file_path, &project)?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn enqueue_job(app: AppHandle, state: State<'_, Arc<AppState>>, request: QueueRequest) -> Result<String, String> {
    enqueue_job_cmd(app, state, request)
}

#[tauri::command]
pub fn cancel_pending_jobs(app: AppHandle, state: State<'_, Arc<AppState>>) -> Result<usize, String> {
    cancel_pending_jobs_cmd(app, state)
}

#[tauri::command]
pub fn start_sidecar(app: AppHandle, state: State<'_, Arc<AppState>>) -> Result<u16, String> {
    start_sidecar_cmd(app, state)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub size: u64,
}

#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let meta = std::fs::metadata(&path).map_err(|e| format!("Cannot read metadata for '{}': {}", path, e))?;
    Ok(FileMetadata { size: meta.len() })
}
