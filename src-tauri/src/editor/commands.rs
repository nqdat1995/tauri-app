use super::models::{EditorProjectData, EditorProjectResponse, EditorStyle, ProjectSummary, SaveEditorRequest, SubtitleCue};
use super::validation::{validate_overlays, validate_style, validate_subtitles};
use crate::storage;

/// Represents a subtitle cue as stored by the STT pipeline (snake_case, milliseconds).
#[derive(Debug, Clone, serde::Deserialize)]
struct SttSubtitleCue {
    pub cue_id: String,
    #[allow(dead_code)]
    pub sequence: Option<usize>,
    pub start_time: u64, // milliseconds
    pub end_time: u64,   // milliseconds
    #[allow(dead_code)]
    pub duration: Option<u64>,
    pub content: String,
    pub translated_content: Option<String>,
}

/// Convert STT-format cues to editor-format cues.
fn convert_stt_cues(stt_cues: Vec<SttSubtitleCue>) -> Vec<SubtitleCue> {
    stt_cues
        .into_iter()
        .map(|c| SubtitleCue {
            id: c.cue_id,
            start_time: c.start_time as f64 / 1000.0,
            end_time: c.end_time as f64 / 1000.0,
            original_text: c.content,
            translated_text: c.translated_content.unwrap_or_default(),
            is_new: false,
        })
        .collect()
}

/// Load a project for editing: reads project.json + subtitles.json.
/// Returns videoMissing=true if the source video file no longer exists.
#[tauri::command]
pub async fn load_editor_project(project_id: String) -> Result<EditorProjectResponse, String> {
    // Read project.json
    let project_path = storage::project_file_path(&project_id)?;
    if !project_path.exists() {
        return Err(format!("Project not found: {}", project_id));
    }

    let project_json: serde_json::Value =
        storage::read_json_file(&project_path)?;

    // Read subtitles.json — supports both STT format (snake_case, ms) and editor format (camelCase, seconds)
    let mut subtitles_path = storage::project_dir(&project_id)?;
    subtitles_path.push("subtitles.json");

    let subtitles: Vec<SubtitleCue> = if subtitles_path.exists() {
        // Try editor format first (camelCase)
        match storage::read_json_file::<Vec<SubtitleCue>>(&subtitles_path) {
            Ok(cues) => cues,
            Err(_) => {
                // Fall back to STT format (snake_case, milliseconds)
                match storage::read_json_file::<Vec<SttSubtitleCue>>(&subtitles_path) {
                    Ok(stt_cues) => convert_stt_cues(stt_cues),
                    Err(e) => return Err(format!("Failed to parse subtitles.json: {}", e)),
                }
            }
        }
    } else {
        Vec::new()
    };

    // Extract metadata from project.json
    let filename = project_json
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    let video_path = project_json
        .get("source")
        .and_then(|s| s.get("path"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let duration = project_json
        .get("media")
        .and_then(|m| m.get("duration"))
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let file_size = project_json
        .get("source")
        .and_then(|s| s.get("size"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0);

    let width = project_json
        .get("media")
        .and_then(|m| m.get("width"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;

    let height = project_json
        .get("media")
        .and_then(|m| m.get("height"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;

    let status = project_json
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("ready")
        .to_string();

    let _updated_at = project_json
        .get("updated_at")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    // Check if video file still exists
    let video_missing = !video_path.is_empty() && !std::path::Path::new(&video_path).exists();

    // Read editor_style from project.json (or use default)
    let active_style: EditorStyle = project_json
        .get("editor_style")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    // Read editor_overlays from project.json (or use default)
    let overlays = project_json
        .get("editor_overlays")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    // Build asset URL for video (Tauri convertFileSrc equivalent not needed — FE handles it)
    let processing_time = project_json
        .get("processing")
        .and_then(|p| p.get("duration_seconds"))
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let project_data = EditorProjectData {
        id: project_id,
        filename,
        duration,
        file_size: file_size,
        width,
        height,
        processing_time: processing_time,
        status: if status == "completed" { "has_subtitle".to_string() } else { status },
        video_path,
        subtitles,
        active_style,
        overlays,
    };

    Ok(EditorProjectResponse {
        project: project_data,
        video_missing,
    })
}

/// Save edited subtitles, style, and overlays to disk.
/// Performs basic validation before writing.
#[tauri::command]
pub async fn save_editor_project(
    project_id: String,
    request: SaveEditorRequest,
) -> Result<(), String> {
    // Validate
    if let Err(errors) = validate_subtitles(&request.subtitles) {
        return Err(format!("Validation errors: {}", errors.join("; ")));
    }
    if let Err(errors) = validate_style(&request.style) {
        return Err(format!("Style validation errors: {}", errors.join("; ")));
    }
    if let Err(errors) = validate_overlays(&request.overlays) {
        return Err(format!("Overlay validation errors: {}", errors.join("; ")));
    }

    // Write subtitles.json
    let mut subtitles_path = storage::project_dir(&project_id)?;
    if !subtitles_path.exists() {
        return Err(format!("Project directory not found: {}", project_id));
    }
    subtitles_path.push("subtitles.json");
    storage::write_json_file(&subtitles_path, &request.subtitles)?;

    // Update project.json with editor_style and editor_overlays
    let project_path = storage::project_file_path(&project_id)?;
    let mut project_json: serde_json::Value = storage::read_json_file(&project_path)?;

    // Merge editor fields
    if let Some(obj) = project_json.as_object_mut() {
        obj.insert(
            "editor_style".to_string(),
            serde_json::to_value(&request.style).map_err(|e| e.to_string())?,
        );
        obj.insert(
            "editor_overlays".to_string(),
            serde_json::to_value(&request.overlays).map_err(|e| e.to_string())?,
        );
        // Update timestamp
        obj.insert(
            "updated_at".to_string(),
            serde_json::Value::String(chrono::Utc::now().to_rfc3339()),
        );
    }

    storage::write_json_file(&project_path, &project_json)?;

    Ok(())
}

/// Get the most recently updated project ID.
#[tauri::command]
pub async fn get_recent_project() -> Result<Option<String>, String> {
    let projects_dir = storage::project_storage_dir()?;

    if !projects_dir.exists() {
        return Ok(None);
    }

    let mut entries: Vec<(String, std::time::SystemTime)> = Vec::new();

    let read_dir = std::fs::read_dir(&projects_dir).map_err(|e| e.to_string())?;
    for entry in read_dir.flatten() {
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            let dir_name = entry.file_name().to_string_lossy().to_string();
            // Skip temp dirs
            if dir_name.ends_with(".tmp") {
                continue;
            }
            let project_json = entry.path().join("project.json");
            if project_json.exists() {
                let modified = std::fs::metadata(&project_json)
                    .and_then(|m| m.modified())
                    .unwrap_or(std::time::UNIX_EPOCH);
                entries.push((dir_name, modified));
            }
        }
    }

    // Sort by most recent modified
    entries.sort_by(|a, b| b.1.cmp(&a.1));

    Ok(entries.first().map(|(id, _)| id.clone()))
}

/// List all projects available for editing.
#[tauri::command]
pub async fn list_editor_projects() -> Result<Vec<ProjectSummary>, String> {
    let projects_dir = storage::project_storage_dir()?;

    if !projects_dir.exists() {
        return Ok(Vec::new());
    }

    let mut summaries = Vec::new();
    let read_dir = std::fs::read_dir(&projects_dir).map_err(|e| e.to_string())?;

    for entry in read_dir.flatten() {
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            let dir_name = entry.file_name().to_string_lossy().to_string();
            if dir_name.ends_with(".tmp") {
                continue;
            }

            let project_json_path = entry.path().join("project.json");
            if project_json_path.exists() {
                if let Ok(val) = storage::read_json_file::<serde_json::Value>(&project_json_path) {
                    let name = val.get("name").and_then(|v| v.as_str()).unwrap_or(&dir_name).to_string();
                    let status = val.get("status").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
                    let updated_at = val.get("updated_at").and_then(|v| v.as_str()).unwrap_or("").to_string();

                    summaries.push(ProjectSummary {
                        id: dir_name,
                        name,
                        status,
                        updated_at,
                    });
                }
            }
        }
    }

    // Sort by updated_at descending
    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(summaries)
}
