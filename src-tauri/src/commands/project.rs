use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::storage::{project_file_path, save_project_file};

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
