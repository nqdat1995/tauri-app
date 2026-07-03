use std::sync::Arc;
use std::thread;
use tauri::{AppHandle, Emitter};

use crate::job::models::{JobEvent, JobStatus, UploadJob};
use crate::project::builder::create_project;
use crate::sidecar::manager::ensure_sidecar_running;
use crate::state::AppState;
use crate::stt::srt_parser::parse_srt;
use crate::stt::whisper_client::call_whisper;
use crate::translation::service::TranslationService;

/// Spawns the background thread that processes jobs from the queue sequentially.
pub fn start_processing_thread(app: AppHandle, state: Arc<AppState>) {
    thread::spawn(move || {
        while let Some(mut job) = take_next_queued_job(&state) {
            if let Err(error) = process_job(&app, &state, &mut job) {
                let _ = update_job_status(
                    &state,
                    &job.job_id,
                    JobStatus::Failed,
                    Some(error.clone()),
                    Some(100),
                );
                emit_job_event(&app, &job, Some(error), Some(100)).ok();
            }
        }

        if let Ok(mut processing) = state.processing.lock() {
            *processing = false;
        }
    });
}

/// Takes the next queued job, marking it as Running.
pub fn take_next_queued_job(state: &Arc<AppState>) -> Option<UploadJob> {
    let mut queue = state.queue.lock().ok()?;
    let index = queue
        .iter()
        .position(|job| job.status == JobStatus::Queued)?;
    queue[index].status = JobStatus::Running;
    queue[index].progress = Some(5);
    queue.get(index).cloned()
}

/// Runs the full STT → parse → create_project → translate pipeline for a single job.
pub fn process_job(
    app: &AppHandle,
    state: &Arc<AppState>,
    job: &mut UploadJob,
) -> Result<(), String> {
    emit_job_event(app, job, Some("Processing started".to_string()), Some(10))?;

    let port = ensure_sidecar_running(app, state).map_err(|e| format!("Sidecar failed: {e}"))?;

    update_job_status(
        state,
        &job.job_id,
        JobStatus::CallingWhisper,
        Some("Calling Whisper sidecar".to_string()),
        Some(20),
    )?;
    let srt = call_whisper(port, job)?;

    update_job_status(
        state,
        &job.job_id,
        JobStatus::ParsingSubtitle,
        Some("Parsing SRT".to_string()),
        Some(40),
    )?;
    let subtitles = parse_srt(&srt)?;

    update_job_status(
        state,
        &job.job_id,
        JobStatus::CreatingProject,
        Some("Creating project artifacts".to_string()),
        Some(60),
    )?;
    create_project(job, &subtitles)?;

    // Auto-translate subtitles immediately after STT completes.
    eprintln!(
        "[translation] Starting translation for project: {}",
        job.job_id
    );
    match tauri::async_runtime::block_on(async {
        TranslationService::new()
            .translate_project(&job.job_id)
            .await
    }) {
        Ok(_) => eprintln!(
            "[translation] Translation completed successfully for: {}",
            job.job_id
        ),
        Err(e) => eprintln!(
            "[translation] Translation failed for {}: {e}",
            job.job_id
        ),
    }

    update_job_status(
        state,
        &job.job_id,
        JobStatus::Completed,
        Some("Job completed".to_string()),
        Some(100),
    )?;
    emit_job_event(app, job, Some("Completed".to_string()), Some(100))?;
    Ok(())
}

/// Updates the status of a job identified by `job_id` in the queue.
pub fn update_job_status(
    state: &Arc<AppState>,
    job_id: &str,
    status: JobStatus,
    message: Option<String>,
    progress: Option<u8>,
) -> Result<(), String> {
    let mut queue = state.queue.lock().map_err(|e| e.to_string())?;
    if let Some(job) = queue.iter_mut().find(|job| job.job_id == job_id) {
        job.status = status.clone();
        job.error = if status == JobStatus::Failed {
            message.clone()
        } else {
            None
        };
        job.progress = progress;
    }
    Ok(())
}

/// Emits a job progress event to the frontend via Tauri's event system.
pub fn emit_job_event(
    app: &AppHandle,
    job: &UploadJob,
    message: Option<String>,
    progress: Option<u8>,
) -> Result<(), String> {
    let event = JobEvent {
        job_id: job.job_id.clone(),
        status: job.status.clone(),
        message,
        progress,
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    app.clone()
        .emit("upload_progress", event)
        .map_err(|e| e.to_string())
}
