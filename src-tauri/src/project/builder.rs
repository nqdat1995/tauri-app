use serde_json::json;
use std::process::Command;

use crate::job::models::UploadJob;
use crate::stt::srt_parser::SubtitleCue;
use crate::storage::{
    create_dir_if_missing, project_dir, project_storage_file_path, read_json_file,
    temp_project_dir, write_json_file,
};
use crate::state::AppData;

/// Creates all project artifacts (project.json, subtitles.json, thumbnail) on disk.
pub fn create_project(job: &UploadJob, subtitles: &[SubtitleCue]) -> Result<(), String> {
    let final_project_dir = project_dir(&job.job_id)?;
    let app_data_file_path = project_storage_file_path()?;
    let temp_dir = temp_project_dir(&job.job_id)?;
    if temp_dir.exists() {
        std::fs::remove_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    }
    create_dir_if_missing(&temp_dir)?;

    let subtitles_path = temp_dir.join("subtitles.json");
    write_json_file(
        &subtitles_path,
        &serde_json::to_value(subtitles).map_err(|e| e.to_string())?,
    )?;

    let media_dir = temp_dir.join("media");
    create_dir_if_missing(&media_dir)?;
    let thumbnail_path = media_dir.join("thumbnail.jpg");
    generate_thumbnail(&job.video_path, &thumbnail_path)?;

    let project_json = json!({
        "id": job.job_id,
        "name": job.video_name,
        "project_type": "video",
        "schema_version": 2,
        "status": "completed",
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
        "source": {
            "path": job.video_path,
            "size": job.size,
            "modified_at": null,
            "fingerprint": null
        },
        "media": {
            "duration": job.duration,
            "width": job.width,
            "height": job.height,
            "fps": null,
            "audio_codec": null,
            "codec": null,
            "thumbnail_path": "media/thumbnail.jpg"
        },
        "assets": {
            "subtitle_json": "subtitles.json"
        },
        "processing": {
            "stt_status": "completed",
            "translation_status": "pending",
            "error": null
        }
    });

    let project_json_path = temp_dir.join("project.json");
    write_json_file(&project_json_path, &project_json)?;

    if final_project_dir.exists() {
        std::fs::remove_dir_all(&final_project_dir).map_err(|e| e.to_string())?;
    }

    if let Err(rename_error) = std::fs::rename(&temp_dir, &final_project_dir) {
        let _ = std::fs::remove_dir_all(&temp_dir);
        return Err(format!(
            "Failed to move project to final directory: {}",
            rename_error
        ));
    }

    let mut app_data: AppData = read_json_file(&app_data_file_path.as_path())?;
    app_data.projects.push(job.job_id.clone());
    let value = serde_json::to_value(&app_data).map_err(|e| e.to_string())?;
    write_json_file(&app_data_file_path, &value)?;

    Ok(())
}

/// Uses ffmpeg to extract a thumbnail from the video at the 1-second mark.
pub fn generate_thumbnail(input_path: &str, output_path: &std::path::Path) -> Result<(), String> {
    let status = Command::new("ffmpeg")
        .arg("-y")
        .arg("-ss")
        .arg("00:00:01")
        .arg("-i")
        .arg(input_path)
        .arg("-vframes")
        .arg("1")
        .arg(output_path)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() && output_path.exists() {
        return Ok(());
    }

    let fallback = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i")
        .arg(input_path)
        .arg("-vf")
        .arg("select=gte(n\\,1)")
        .arg("-vframes")
        .arg("1")
        .arg(output_path)
        .status()
        .map_err(|e| e.to_string())?;

    if fallback.success() && output_path.exists() {
        Ok(())
    } else {
        Err("Failed to generate thumbnail with ffmpeg".to_string())
    }
}
