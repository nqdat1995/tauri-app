use serde::Deserialize;
use serde_json::json;

use crate::job::models::UploadJob;

#[derive(Debug, Deserialize)]
pub struct WhisperResponse {
    pub status_code: i32,
    pub message: Option<String>,
    pub srt_content: Option<String>,
    pub error_details: Option<String>,
}

/// Sends the video to the Whisper sidecar and returns the raw SRT content.
pub fn call_whisper(port: u16, job: &UploadJob) -> Result<String, String> {
    let url = format!("http://127.0.0.1:{}/stt/whisper", port);
    println!("Calling Whisper sidecar at: {}", url);

    let video_name_without_ext = job
        .video_name
        .rsplit_once('.')
        .map(|(name, _)| name.to_string())
        .unwrap_or_else(|| job.video_name.clone());

    // Map frontend language labels to sidecar language codes
    let language_code = match job.language.as_str() {
        "chinese" => "zh",
        "english" => "en",
        "japanese" => "jp",
        "korean" => "kr",
        other => other, // pass through if already a code
    };

    let request = json!({
        "video_path": job.video_path,
        "video_name": video_name_without_ext,
        "language": language_code,
    });

    println!(
        "Sending request to Whisper sidecar: {}",
        request.to_string()
    );

    let response = ureq::post(&url)
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .send_string(&request.to_string())
        .map_err(|e| e.to_string())?;

    let response_text = response.into_string().map_err(|e| e.to_string())?;
    let whisper_response: WhisperResponse =
        serde_json::from_str(&response_text).map_err(|e| e.to_string())?;

    if whisper_response.status_code != 0 {
        return Err(format!(
            "Whisper failed: {}",
            whisper_response
                .error_details
                .unwrap_or_else(|| whisper_response
                    .message
                    .unwrap_or_else(|| "unknown error".to_string()))
        ));
    }

    whisper_response
        .srt_content
        .ok_or_else(|| "Whisper returned no srt_content".to_string())
}
