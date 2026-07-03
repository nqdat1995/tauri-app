use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum JobStatus {
    Queued,
    Running,
    CallingWhisper,
    ParsingSubtitle,
    CreatingProject,
    ExtractingThumbnail,
    SavingFiles,
    Completed,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadJob {
    pub job_id: String,
    pub video_path: String,
    pub video_name: String,
    pub language: String,
    pub size: u64,
    pub duration: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub status: JobStatus,
    pub error: Option<String>,
    pub progress: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobEvent {
    pub job_id: String,
    pub status: JobStatus,
    pub message: Option<String>,
    pub progress: Option<u8>,
    pub updated_at: String,
}

/// Request payload for enqueueing a new job from the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueRequest {
    pub job_id: String,
    pub video_path: String,
    pub video_name: String,
    pub language: String,
    pub size: u64,
    pub duration: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}
