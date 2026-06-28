// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod orchestrator;
mod storage;

use commands::{greet, save_project, enqueue_job, cancel_pending_jobs, start_sidecar, get_file_metadata};
use orchestrator::{AppState, ensure_sidecar_running_pub};
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> () {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Arc::new(AppState::default()))
        .setup(|app: &mut tauri::App| {
            let app_handle = app.handle().clone();
            let state = app.state::<Arc<AppState>>().inner().clone();
            // Start sidecar in a background thread so the window opens immediately
            std::thread::spawn(move || {
                if let Err(e) = ensure_sidecar_running_pub(&app_handle, &state) {
                    eprintln!("[setup] Failed to start sidecar: {e}");
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, save_project, enqueue_job, cancel_pending_jobs, start_sidecar, get_file_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
