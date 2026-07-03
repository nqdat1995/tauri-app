use std::sync::Arc;
use tauri::{AppHandle, State};

use crate::job::models::{JobStatus, QueueRequest, UploadJob};
use crate::job::processor::start_processing_thread;
use crate::state::AppState;

use super::processor::emit_job_event;

/// Adds a new job to the queue and starts the processing thread if not already running.
pub fn enqueue_job(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    request: QueueRequest,
) -> Result<String, String> {
    let job = UploadJob {
        job_id: request.job_id.clone(),
        video_path: request.video_path,
        video_name: request.video_name,
        language: request.language,
        size: request.size,
        duration: request.duration,
        width: request.width,
        height: request.height,
        status: JobStatus::Queued,
        error: None,
        progress: Some(0),
    };

    {
        let mut queue = state.queue.lock().map_err(|e| e.to_string())?;
        queue.push(job.clone());
    }

    emit_job_event(&app, &job, Some("Job queued".to_string()), Some(0))?;

    let should_start = {
        let mut processing = state.processing.lock().map_err(|e| e.to_string())?;
        if !*processing {
            *processing = true;
            true
        } else {
            false
        }
    };

    if should_start {
        start_processing_thread(app.clone(), state.inner().clone());
    }

    Ok(job.job_id)
}

/// Cancels all jobs that are currently in `Queued` status.
pub fn cancel_pending_jobs(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
) -> Result<usize, String> {
    let mut queue = state.queue.lock().map_err(|e| e.to_string())?;
    let mut cancelled = 0;
    for job in queue.iter_mut() {
        if job.status == JobStatus::Queued {
            job.status = JobStatus::Cancelled;
            job.error = None;
            job.progress = Some(100);
            cancelled += 1;
            let _ = emit_job_event(&app, job, Some("Cancelled".to_string()), Some(100));
        }
    }
    Ok(cancelled)
}
