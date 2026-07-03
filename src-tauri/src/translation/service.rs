use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::storage::{project_dir, read_json_file, read_settings, write_json_file};
use crate::translation::chunk_builder::ChunkBuilder;
use crate::translation::models::TranslationRequest;
use crate::translation::provider_factory::{create_provider, ProviderType};

/// Mirrors the shape of a subtitle cue as stored in subtitles.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleCueFile {
    pub cue_id: String,
    pub sequence: usize,
    pub start_time: u64,
    pub end_time: u64,
    pub duration: u64,
    pub content: String,
    #[serde(default)]
    pub translated_content: Option<String>,
}

pub struct TranslationService;

impl TranslationService {
    pub fn new() -> Self {
        Self
    }

    /// Translate all subtitles for a project and write results back to subtitles.json.
    pub async fn translate_project(&self, project_id: &str) -> Result<()> {
        eprintln!("[translation::service] translate_project called for: {}", project_id);

        // ── 1. Read settings ──────────────────────────────────────────────
        let settings = read_settings().map_err(|e| anyhow!("Failed to read settings: {}", e))?;
        eprintln!(
            "[translation::service] Settings loaded — provider: '{}', model: '{}', target_lang: '{}', chunk_size: {}, api_key_set: {}",
            settings.provider,
            settings.model,
            settings.target_language,
            settings.chunk_size,
            !settings.api_key.is_empty()
        );

        if settings.api_key.is_empty() {
            eprintln!("[translation::service] ERROR: api_key is empty — aborting");
            return Err(anyhow!(
                "API key is not configured. Please set your API key in settings."
            ));
        }

        // ── 2. Read subtitles.json ────────────────────────────────────────
        let project_path =
            project_dir(project_id).map_err(|e| anyhow!("Invalid project path: {}", e))?;
        let subtitles_path = project_path.join("subtitles.json");
        eprintln!("[translation::service] Reading subtitles from: {}", subtitles_path.display());

        let mut cues: Vec<SubtitleCueFile> = read_json_file(&subtitles_path)
            .map_err(|e| anyhow!("Failed to read subtitles.json: {}", e))?;
        eprintln!("[translation::service] Loaded {} subtitle cues", cues.len());

        if cues.is_empty() {
            eprintln!("[translation::service] No cues to translate — returning early");
            return Ok(());
        }

        // ── 3. Create provider ────────────────────────────────────────────
        let provider_type = ProviderType::from_str(&settings.provider).ok_or_else(|| {
            anyhow!("Unknown provider '{}'. Use 'openai', 'gemini', or 'deepseek'.", settings.provider)
        })?;
        eprintln!("[translation::service] Creating provider: {}", settings.provider);
        let provider = create_provider(provider_type, settings.api_key.clone(), settings.model.clone());

        // ── 4. Build segments for translation ────────────────────────────
        use crate::translation::models::TranslationSegment;
        let all_segments: Vec<TranslationSegment> = cues
            .iter()
            .enumerate()
            .map(|(idx, cue)| TranslationSegment {
                id: idx,
                start: cue.start_time.to_string(),
                end: cue.end_time.to_string(),
                text: cue.content.clone(),
            })
            .collect();
        eprintln!("[translation::service] Built {} segments for translation", all_segments.len());

        // ── 5. Chunk and translate ────────────────────────────────────────
        let chunk_builder = ChunkBuilder::new(settings.chunk_size);
        let chunks = chunk_builder.split(&all_segments);
        eprintln!(
            "[translation::service] Split into {} chunks (chunk_size={})",
            chunks.len(),
            settings.chunk_size
        );

        let mut translated_texts: Vec<Option<String>> = vec![None; cues.len()];
        let mut chunk_errors: Vec<String> = Vec::new();

        for (chunk_idx, chunk) in chunks.iter().enumerate() {
            eprintln!(
                "[translation::service] Translating chunk {}/{} ({} segments)",
                chunk_idx + 1,
                chunks.len(),
                chunk.len()
            );
            let request = TranslationRequest {
                source_language: "auto".to_string(),
                target_language: settings.target_language.clone(),
                segments: chunk.clone(),
            };

            match provider.translate(request).await {
                Ok(result) => {
                    eprintln!(
                        "[translation::service] Chunk {}/{} translated OK ({} segments returned)",
                        chunk_idx + 1,
                        chunks.len(),
                        result.segments.len()
                    );
                    for segment in result.segments {
                        if segment.id < translated_texts.len() {
                            translated_texts[segment.id] = Some(segment.text);
                        }
                    }
                }
                Err(e) => {
                    let msg = format!("Chunk {} failed: {}", chunk_idx, e);
                    eprintln!("[translation::service] ERROR: {}", msg);
                    chunk_errors.push(msg);
                }
            }
        }

        // ── 6. Merge translated content back into cues ────────────────────
        let translated_count = translated_texts.iter().filter(|t| t.is_some()).count();
        eprintln!(
            "[translation::service] Merge complete: {}/{} cues translated",
            translated_count,
            cues.len()
        );
        for (idx, cue) in cues.iter_mut().enumerate() {
            cue.translated_content = translated_texts[idx].clone();
        }

        // ── 7. Write subtitles.json ───────────────────────────────────────
        eprintln!("[translation::service] Writing updated subtitles.json");
        let cues_value =
            serde_json::to_value(&cues).context("Failed to serialize subtitles")?;
        write_json_file(&subtitles_path, &cues_value)
            .map_err(|e| anyhow!("Failed to write subtitles.json: {}", e))?;

        // ── 8. Update project.json translation_status ─────────────────────
        let project_json_path = project_path.join("project.json");
        if project_json_path.exists() {
            let mut project: Value = read_json_file(&project_json_path)
                .map_err(|e| anyhow!("Failed to read project.json: {}", e))?;

            let status = if chunk_errors.is_empty() {
                "completed"
            } else {
                "partial"
            };
            eprintln!("[translation::service] Setting translation_status = '{}'", status);

            if let Some(processing) = project.get_mut("processing") {
                processing["translation_status"] = Value::String(status.to_string());
                if !chunk_errors.is_empty() {
                    processing["translation_errors"] =
                        Value::Array(chunk_errors.iter().map(|e| Value::String(e.clone())).collect());
                }
            }

            let project_value =
                serde_json::to_value(&project).context("Failed to serialize project.json")?;
            write_json_file(&project_json_path, &project_value)
                .map_err(|e| anyhow!("Failed to write project.json: {}", e))?;
        }

        if chunk_errors.is_empty() {
            eprintln!("[translation::service] Done — all chunks succeeded");
        } else {
            eprintln!(
                "[translation::service] Done with {} error(s) — partial translation",
                chunk_errors.len()
            );
        }

        Ok(())
    }
}
