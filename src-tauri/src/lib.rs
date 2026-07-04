// Module declarations — order matters for forward references (state uses job::models)
mod job;       // must be declared before state so crate::job::models is resolvable
mod state;
mod sidecar;
mod stt;
mod project;
mod storage;
mod translation;
mod commands;
mod editor;

use commands::{
    cancel_pending_jobs, enqueue_job, get_file_metadata, greet, list_models, load_history,
    load_settings, save_project, save_settings, start_sidecar, translate_project,
};
use editor::commands::{
    get_recent_project, list_editor_projects, load_editor_project, save_editor_project,
};
use sidecar::ensure_sidecar_running_pub;
use state::AppState;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
        .invoke_handler(tauri::generate_handler![
            greet,
            save_project,
            enqueue_job,
            cancel_pending_jobs,
            start_sidecar,
            get_file_metadata,
            translate_project,
            load_settings,
            save_settings,
            load_history,
            list_models,
            load_editor_project,
            save_editor_project,
            get_recent_project,
            list_editor_projects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
