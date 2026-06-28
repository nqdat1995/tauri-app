use crate::storage::{create_dir_if_missing, project_dir, temp_project_dir, write_json_file};

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use ureq;
use uuid::Uuid;

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

#[derive(Debug, Clone)]
pub struct SidecarState {
  pub port: u16,
  pub _pid: u32,
}

#[derive(Default)]
pub struct AppState {
  pub sidecar_state: Mutex<Option<SidecarState>>,
  /// Held by the thread currently starting the sidecar to prevent double-spawn.
  pub sidecar_starting: Mutex<bool>,
  pub queue: Mutex<Vec<UploadJob>>,
  pub processing: Mutex<bool>,
}

#[derive(Debug, Deserialize)]
struct WhisperResponse {
  status_code: i32,
  message: Option<String>,
  srt_content: Option<String>,
  error_details: Option<String>,
}

pub fn enqueue_job(app: AppHandle, state: tauri::State<'_, Arc<AppState>>, request: QueueRequest) -> Result<String, String> {
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

pub fn cancel_pending_jobs(app: AppHandle, state: tauri::State<'_, Arc<AppState>>) -> Result<usize, String> {
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

pub fn start_sidecar(app: AppHandle, state: tauri::State<'_, Arc<AppState>>) -> Result<u16, String> {
  let state = state.inner().clone();
  ensure_sidecar_running(&app, &state)
}

pub fn ensure_sidecar_running_pub(app: &AppHandle, state: &Arc<AppState>) -> Result<u16, String> {
  ensure_sidecar_running(app, state)
}

fn ensure_sidecar_running(_app: &AppHandle, state: &Arc<AppState>) -> Result<u16, String> {
  // Fast path: sidecar already running
  if let Some(ref sidecar) = *state.sidecar_state.lock().map_err(|e| e.to_string())? {
    return Ok(sidecar.port);
  }

  // Slow path: acquire the "starting" lock so only one thread spawns the sidecar.
  // Other threads will block here and then take the fast path once the lock is released.
  let mut starting = state.sidecar_starting.lock().map_err(|e| e.to_string())?;

  // Re-check after acquiring the lock — another thread may have started it already.
  if let Some(ref sidecar) = *state.sidecar_state.lock().map_err(|e| e.to_string())? {
    return Ok(sidecar.port);
  }

  *starting = true;

  let port = bind_free_port()?;
  eprintln!("[sidecar] Spawning on port {port}");
  let child = spawn_sidecar_process(port)?;
  let pid = child.id();
  std::mem::forget(child);

  // Wait up to 30 s for the sidecar to become healthy (PyInstaller is slow on Windows)
  wait_for_sidecar_health(port, 30_000)?;
  eprintln!("[sidecar] Ready on port {port} (pid {pid})");

  *state.sidecar_state.lock().map_err(|e| e.to_string())? = Some(SidecarState { port, _pid: pid });
  *starting = false;

  Ok(port)
}

fn bind_free_port() -> Result<u16, String> {
  let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
  let addr = listener.local_addr().map_err(|e| e.to_string())?;
  drop(listener);
  Ok(addr.port())
}

fn start_processing_thread(app: AppHandle, state: Arc<AppState>) {
  thread::spawn(move || {
    while let Some(mut job) = take_next_queued_job(&state) {
      if let Err(error) = process_job(&app, &state, &mut job) {
        let _ = update_job_status(&state, &job.job_id, JobStatus::Failed, Some(error.clone()), Some(100));
        emit_job_event(&app, &job, Some(error), Some(100)).ok();
      }
    }

    if let Ok(mut processing) = state.processing.lock() {
      *processing = false;
    }
  });
}

fn take_next_queued_job(state: &Arc<AppState>) -> Option<UploadJob> {
  let mut queue = state.queue.lock().ok()?;
  let index = queue.iter().position(|job| job.status == JobStatus::Queued)?;
  queue[index].status = JobStatus::Running;
  queue[index].progress = Some(5);
  queue.get(index).cloned()
}

fn process_job(app: &AppHandle, state: &Arc<AppState>, job: &mut UploadJob) -> Result<(), String> {
  emit_job_event(app, job, Some("Processing started".to_string()), Some(10))?;

  let port = ensure_sidecar_running(app, state).map_err(|e| format!("Sidecar failed: {e}"))?;

  update_job_status(state, &job.job_id, JobStatus::CallingWhisper, Some("Calling Whisper sidecar".to_string()), Some(20))?;
  let srt = call_whisper(port, job)?;

  update_job_status(state, &job.job_id, JobStatus::ParsingSubtitle, Some("Parsing SRT".to_string()), Some(40))?;
  let subtitles = parse_srt(&srt)?;

  update_job_status(state, &job.job_id, JobStatus::CreatingProject, Some("Creating project artifacts".to_string()), Some(60))?;
  create_project(job, &subtitles)?;

  update_job_status(state, &job.job_id, JobStatus::Completed, Some("Job completed".to_string()), Some(100))?;
  emit_job_event(app, job, Some("Completed".to_string()), Some(100))?;
  Ok(())
}

fn update_job_status(state: &Arc<AppState>, job_id: &str, status: JobStatus, message: Option<String>, progress: Option<u8>) -> Result<(), String> {
  let mut queue = state.queue.lock().map_err(|e| e.to_string())?;
  if let Some(job) = queue.iter_mut().find(|job| job.job_id == job_id) {
    job.status = status.clone();
    job.error = if status == JobStatus::Failed { message.clone() } else { None };
    job.progress = progress;
  }
  Ok(())
}

fn emit_job_event(app: &AppHandle, job: &UploadJob, message: Option<String>, progress: Option<u8>) -> Result<(), String> {
  let event = JobEvent {
    job_id: job.job_id.clone(),
    status: job.status.clone(),
    message,
    progress,
    updated_at: chrono::Utc::now().to_rfc3339(),
  };
  app.clone().emit("upload_progress", event).map_err(|e| e.to_string())
}

fn find_sidecar_executable() -> Option<PathBuf> {
  let names = if cfg!(windows) {
    vec!["tauri-sidecar-app.exe", "tauri-sidecar-app"]
  } else {
    vec!["tauri-sidecar-app"]
  };

  let mut candidates: Vec<PathBuf> = Vec::new();

  if let Ok(cwd) = std::env::current_dir() {
    for name in &names {
      candidates.push(cwd.join(name));
    }
  }

  if let Ok(exe_path) = std::env::current_exe() {
    let mut dir = exe_path.parent();
    while let Some(parent) = dir {
      for name in &names {
        candidates.push(parent.join(name));
      }
      dir = parent.parent();
    }
  }

  for path in candidates {
    if path.exists() && path.is_file() {
      return Some(path);
    }
  }
  None
}

fn spawn_sidecar_process(port: u16) -> Result<Child, String> {
  // Point the sidecar's temp dir to the OS temp folder so it never writes inside
  // the source tree and does not trigger the Tauri dev watcher.
  let temp_dir = std::env::temp_dir().join("tauri-sidecar-app");
  let temp_dir_str = temp_dir.to_string_lossy().into_owned();

  if let Some(path) = find_sidecar_executable() {
    let mut command = Command::new(path);
    command
      .arg("--port").arg(port.to_string())
      .env("FASTER_WHISPER_TEMP_DIR", &temp_dir_str)
      .stdout(Stdio::null())
      .stderr(Stdio::null());
    return command.spawn().map_err(|e| e.to_string());
  }

  let candidates: Vec<&str> = if cfg!(windows) {
    vec!["tauri-sidecar-app.exe", "tauri-sidecar-app"]
  } else {
    vec!["tauri-sidecar-app"]
  };

  let mut last_not_found = None;
  for command_name in candidates.iter() {
    let mut command = Command::new(command_name);
    command
      .arg("--port").arg(port.to_string())
      .env("FASTER_WHISPER_TEMP_DIR", &temp_dir_str)
      .stdout(Stdio::null())
      .stderr(Stdio::null());

    match command.spawn() {
      Ok(child) => return Ok(child),
      Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
        last_not_found = Some(err);
        continue;
      }
      Err(err) => return Err(err.to_string()),
    }
  }

  if last_not_found.is_some() {
    spawn_python_sidecar(port, &temp_dir_str)
  } else {
    Err("Failed to start tauri-sidecar-app or python runtime.".to_string())
  }
}

fn find_sidecar_script() -> Option<PathBuf> {
  let name = "tauri-sidecar-app.py";

  if let Ok(cwd) = std::env::current_dir() {
    let candidate = cwd.join(name);
    if candidate.exists() && candidate.is_file() {
      return Some(candidate);
    }
  }

  if let Ok(exe_path) = std::env::current_exe() {
    let mut dir = exe_path.parent();
    while let Some(parent) = dir {
      let candidate = parent.join(name);
      if candidate.exists() && candidate.is_file() {
        return Some(candidate);
      }
      dir = parent.parent();
    }
  }

  None
}

fn spawn_python_sidecar(port: u16, temp_dir: &str) -> Result<Child, String> {
  let script = find_sidecar_script().ok_or_else(|| {
    "Failed to start tauri-sidecar-app or python runtime. Ensure Python is installed and tauri-sidecar-app.py is available.".to_string()
  })?;

  let python_executables = ["python3", "python"];
  for exe in python_executables {
    let mut command = Command::new(exe);
    command
      .arg(script.clone())
      .arg("--port")
      .arg(port.to_string())
      .env("FASTER_WHISPER_TEMP_DIR", temp_dir)
      .stdout(Stdio::null())
      .stderr(Stdio::null());

    if let Ok(child) = command.spawn() {
      return Ok(child);
    }
  }

  Err("Failed to start tauri-sidecar-app or python runtime. Ensure Python is installed and tauri-sidecar-app.py is available.".to_string())
}

fn wait_for_sidecar_health(port: u16, timeout_ms: u64) -> Result<(), String> {
  let url = format!("http://127.0.0.1:{}/health", port);
  let interval_ms = 500u64;
  let attempts = (timeout_ms / interval_ms).max(1);
  let mut last_error = None;
  for _ in 0..attempts {
    match ureq::get(&url).call() {
      Ok(response) => {
        if response.status() == 200 {
          if let Ok(body) = response.into_string() {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
              if json.get("status").and_then(|value| value.as_str()) == Some("ok") {
                return Ok(());
              }
            }
          }
        }
      }
      Err(err) => {
        last_error = Some(err.to_string());
      }
    }
    thread::sleep(Duration::from_millis(interval_ms));
  }
  Err(format!(
    "Sidecar did not become healthy within {}ms: {}",
    timeout_ms,
    last_error.unwrap_or_else(|| "no response".to_string())
  ))
}

fn call_whisper(port: u16, job: &UploadJob) -> Result<String, String> {
  let url = format!("http://127.0.0.1:{}/stt/whisper", port);
  println!("Calling Whisper sidecar at: {}", url);

  let video_name_without_ext = job.video_name
    .rsplit_once('.')
    .map(|(name, _)| name.to_string())
    .unwrap_or_else(|| job.video_name.clone());

  // Map frontend language labels to sidecar language codes
  let language_code = match job.language.as_str() {
    "chinese"  => "zh",
    "english"  => "en",
    "japanese" => "jp",
    "korean"   => "kr",
    other      => other, // pass through if already a code
  };

  let request = json!({
    "video_path": job.video_path,
    "video_name": video_name_without_ext,
    "language": language_code,
  });

  println!("Sending request to Whisper sidecar: {}", request.to_string());

  let response = ureq::post(&url)
    .set("Accept", "application/json")
    .set("Content-Type", "application/json")
    .send_string(&request.to_string())
    .map_err(|e| e.to_string())?;

  let response_text = response.into_string().map_err(|e| e.to_string())?;
  let whisper_response: WhisperResponse = serde_json::from_str(&response_text).map_err(|e| e.to_string())?;

  if whisper_response.status_code != 0 {
    return Err(format!(
      "Whisper failed: {}",
      whisper_response.error_details.unwrap_or_else(|| whisper_response.message.unwrap_or_else(|| "unknown error".to_string()))
    ));
  }

  whisper_response
    .srt_content
    .ok_or_else(|| "Whisper returned no srt_content".to_string())
}

#[derive(Debug, Serialize)]
struct SubtitleCue {
  cue_id: String,
  sequence: usize,
  start_time: u64,
  end_time: u64,
  duration: u64,
  content: String,
  translated_content: Option<String>,
}

fn parse_srt(srt: &str) -> Result<Vec<SubtitleCue>, String> {
  let mut cues = Vec::new();
  let blocks: Vec<&str> = srt.split("\n\n").collect();
  for (index, block) in blocks.iter().enumerate() {
    let trimmed = block.trim();
    if trimmed.is_empty() {
      continue;
    }
    let lines: Vec<&str> = trimmed.lines().collect();
    if lines.len() < 2 {
      continue;
    }
    let timecode = lines[1].trim();
    let parts: Vec<&str> = timecode.split(" --> ").collect();
    if parts.len() != 2 {
      continue;
    }
    let start_time = parse_timecode(parts[0])?;
    let end_time = parse_timecode(parts[1])?;
    let content = lines[2..].join("\n").trim().to_string();
    cues.push(SubtitleCue {
      cue_id: Uuid::new_v4().to_string(),
      sequence: index + 1,
      start_time,
      end_time,
      duration: end_time.saturating_sub(start_time),
      content,
      translated_content: None,
    });
  }
  Ok(cues)
}

fn parse_timecode(value: &str) -> Result<u64, String> {
  let value = value.trim();
  let parts: Vec<&str> = value.split(',').collect();
  if parts.len() != 2 {
    return Err(format!("Invalid timecode: {}", value));
  }
  let seconds_part = parts[0];
  let millis_part = parts[1];
  let time_parts: Vec<&str> = seconds_part.split(':').collect();
  if time_parts.len() != 3 {
    return Err(format!("Invalid timecode: {}", value));
  }
  let hours = time_parts[0].parse::<u64>().map_err(|e| e.to_string())?;
  let minutes = time_parts[1].parse::<u64>().map_err(|e| e.to_string())?;
  let seconds = time_parts[2].parse::<u64>().map_err(|e| e.to_string())?;
  let millis = millis_part.parse::<u64>().map_err(|e| e.to_string())?;
  Ok(hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + millis)
}

fn create_project(job: &UploadJob, subtitles: &[SubtitleCue]) -> Result<(), String> {
  let final_project_dir = project_dir(&job.job_id)?;
  let temp_dir = temp_project_dir(&job.job_id)?;
  if temp_dir.exists() {
    std::fs::remove_dir_all(&temp_dir).map_err(|e| e.to_string())?;
  }
  create_dir_if_missing(&temp_dir)?;

  let subtitles_path = temp_dir.join("subtitles.json");
  write_json_file(&subtitles_path, &serde_json::to_value(subtitles).map_err(|e| e.to_string())?)?;

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
    return Err(format!("Failed to move project to final directory: {}", rename_error));
  }

  Ok(())
}

fn generate_thumbnail(input_path: &str, output_path: &std::path::Path) -> Result<(), String> {
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

