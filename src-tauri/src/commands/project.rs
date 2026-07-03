use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::storage::{project_file_path, project_storage_file_path, read_json_file, read_settings, save_project_file, settings_file_path, write_json_file};
use crate::state::AppData;
use crate::translation::models::AppSettings;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub size: u64,
}

#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let meta = std::fs::metadata(&path)
        .map_err(|e| format!("Cannot read metadata for '{}': {}", path, e))?;
    Ok(FileMetadata { size: meta.len() })
}

/// Load application settings from ~/.tauri-translate-app/settings.json.
/// Returns defaults if the file does not exist yet.
#[tauri::command]
pub fn load_settings() -> Result<AppSettings, String> {
    read_settings()
}

/// Persist application settings to ~/.tauri-translate-app/settings.json.
#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = settings_file_path()?;
    let value = serde_json::to_value(&settings).map_err(|e| e.to_string())?;
    write_json_file(&path, &value)
}

/// Load history: read app_data.json for project IDs, then load each project file.
/// Projects whose file is missing or malformed are silently skipped.
#[tauri::command]
pub fn load_history() -> Result<Vec<Value>, String> {
    let data_path = project_storage_file_path()?;
    let app_data: AppData = read_json_file(&data_path)?;

    let mut projects: Vec<Value> = Vec::new();
    for id in &app_data.projects {
        let file = match project_file_path(id) {
            Ok(p) => p,
            Err(_) => continue,
        };
        if !file.exists() {
            continue;
        }
        if let Ok(record) = read_json_file::<Value>(&file) {
            projects.push(record);
        }
    }
    Ok(projects)
}
