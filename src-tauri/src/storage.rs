use serde_json::Value;
use std::path::{Path, PathBuf};

pub fn project_storage_dir() -> Result<PathBuf, String> {
    let mut base = dirs::home_dir().ok_or_else(|| "cannot determine home dir".to_string())?;
    base.push(".tauri-translate-app");
    base.push("projects");
    std::fs::create_dir_all(&base).map_err(|e| e.to_string())?;
    Ok(base)
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

pub fn write_json_file(path: &Path, value: &Value) -> Result<(), String> {
    let contents = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

pub fn save_project_file(path: &PathBuf, project: &Value) -> Result<(), String> {
    let contents = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
    std::fs::write(path, contents).map_err(|e| e.to_string())
}
