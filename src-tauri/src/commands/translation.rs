use crate::translation::service::TranslationService;

/// Translate all subtitles for the given project using the configured AI provider.
#[tauri::command]
pub async fn translate_project(project_id: String) -> Result<(), String> {
    let service = TranslationService::new();
    service
        .translate_project(&project_id)
        .await
        .map_err(|e| e.to_string())
}
