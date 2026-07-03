use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::storage::{create_dir_if_missing, project_file_path, project_storage_file_path, read_json_file, read_settings, save_project_file, settings_file_path, write_json_file};
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
    // Ensure the project subdirectory exists before writing
    if let Some(parent) = file_path.parent() {
        create_dir_if_missing(parent)?;
    }
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

/// Model info returned to the frontend.
#[derive(Debug, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
}

/// Fetch available models from the AI provider's API.
/// Falls back gracefully — returns an empty list on network/auth errors
/// so the frontend can show its hardcoded fallback.
#[tauri::command]
pub fn list_models(provider: String, api_key: String) -> Result<Vec<ModelInfo>, String> {
    if api_key.trim().is_empty() {
        return Ok(Vec::new());
    }

    match provider.as_str() {
        "openai" => list_openai_models(&api_key),
        "gemini" => list_gemini_models(&api_key),
        "deepseek" => list_deepseek_models(&api_key),
        _ => Ok(Vec::new()),
    }
}

fn list_openai_models(api_key: &str) -> Result<Vec<ModelInfo>, String> {
    let resp = ureq::get("https://api.openai.com/v1/models")
        .set("Authorization", &format!("Bearer {}", api_key))
        .call()
        .map_err(|e| e.to_string())?;

    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let models = body["data"]
        .as_array()
        .unwrap_or(&Vec::new())
        .iter()
        .filter_map(|m| {
            let id = m["id"].as_str()?;
            // Only include chat-capable models (gpt-*)
            if id.starts_with("gpt-") {
                Some(ModelInfo {
                    id: id.to_string(),
                    name: id.to_string(),
                })
            } else {
                None
            }
        })
        .collect();
    Ok(models)
}

fn list_gemini_models(api_key: &str) -> Result<Vec<ModelInfo>, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models?key={}",
        api_key
    );
    let resp = ureq::get(&url)
        .call()
        .map_err(|e| e.to_string())?;

    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let models = body["models"]
        .as_array()
        .unwrap_or(&Vec::new())
        .iter()
        .filter_map(|m| {
            let name = m["name"].as_str()?;
            let display = m["displayName"].as_str().unwrap_or(name);
            // name is like "models/gemini-1.5-flash" — extract the model id
            let id = name.strip_prefix("models/").unwrap_or(name);
            // Only include generateContent-capable models
            let methods = m["supportedGenerationMethods"].as_array();
            let supports_generate = methods
                .map(|arr| arr.iter().any(|v| v.as_str() == Some("generateContent")))
                .unwrap_or(false);
            if supports_generate {
                Some(ModelInfo {
                    id: id.to_string(),
                    name: display.to_string(),
                })
            } else {
                None
            }
        })
        .collect();
    Ok(models)
}

fn list_deepseek_models(api_key: &str) -> Result<Vec<ModelInfo>, String> {
    let resp = ureq::get("https://api.deepseek.com/models")
        .set("Authorization", &format!("Bearer {}", api_key))
        .call()
        .map_err(|e| e.to_string())?;

    let body: Value = resp.into_json().map_err(|e| e.to_string())?;
    let models = body["data"]
        .as_array()
        .unwrap_or(&Vec::new())
        .iter()
        .filter_map(|m| {
            let id = m["id"].as_str()?;
            Some(ModelInfo {
                id: id.to_string(),
                name: id.to_string(),
            })
        })
        .collect();
    Ok(models)
}
