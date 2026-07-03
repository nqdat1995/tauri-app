use serde::Serialize;
use serde::de::DeserializeOwned;
use serde_json::Value;
use std::path::Path;
use std::path::PathBuf;

use crate::state::AppData;
use crate::translation::models::AppSettings;

pub fn project_storage_dir() -> Result<PathBuf, String> {
    let mut base = dirs::home_dir().ok_or_else(|| "cannot determine home dir".to_string())?;
    base.push(".tauri-translate-app");
    base.push("projects");
    std::fs::create_dir_all(&base).map_err(|e| e.to_string())?;
    Ok(base)
}

pub fn project_storage_file_path() -> Result<PathBuf, String> {
    let mut path = dirs::home_dir().ok_or_else(|| "cannot determine home dir".to_string())?;
    path.push(".tauri-translate-app");
    path.push(format!("app_data.json"));

    if !path.exists() {
        let value = serde_json::to_value(AppData::default()).map_err(|e| e.to_string())?;
        write_json_file(&path, &value)?;
    }

    Ok(path)
}

/// Returns the path to the global settings file, creating it with defaults if absent.
pub fn settings_file_path() -> Result<PathBuf, String> {
    let mut path = dirs::home_dir().ok_or_else(|| "cannot determine home dir".to_string())?;
    path.push(".tauri-translate-app");
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("settings.json");
    Ok(path)
}

/// Read application settings from disk.  Returns defaults when the file doesn't exist yet.
pub fn read_settings() -> Result<AppSettings, String> {
    let path = settings_file_path()?;
    if !path.exists() {
        let defaults = AppSettings::default();
        let value = serde_json::to_value(&defaults).map_err(|e| e.to_string())?;
        write_json_file(&path, &value)?;
        return Ok(defaults);
    }
    read_json_file::<AppSettings>(&path)
}

pub fn project_file_path(project_id: &str) -> Result<PathBuf, String> {
    let mut path = project_storage_dir()?;
    path.push(format!("{project_id}.json"));
    Ok(path)
}

pub fn project_dir(project_id: &str) -> Result<PathBuf, String> {
    let mut path = project_storage_dir()?;
    path.push(project_id);
    Ok(path)
}

pub fn temp_project_dir(project_id: &str) -> Result<PathBuf, String> {
    let mut path = project_storage_dir()?;
    path.push(format!("{project_id}.tmp"));
    Ok(path)
}

pub fn create_dir_if_missing(path: &Path) -> Result<(), String> {
    std::fs::create_dir_all(path).map_err(|e| e.to_string())
}

pub fn write_json_file<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let contents = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

pub fn read_json_file<T: DeserializeOwned>(path: &Path) -> Result<T, String> {
    let contents = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

pub fn save_project_file(path: &PathBuf, project: &Value) -> Result<(), String> {
    let contents = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
    std::fs::write(path, contents).map_err(|e| e.to_string())
}
