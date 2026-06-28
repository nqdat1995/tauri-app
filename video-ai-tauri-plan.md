# Video AI Tauri App – Full Architecture & Processing Plan

## 1. System Overview

Hệ thống gồm 3 layer:

- **Tauri App (Rust Core)**: Orchestrator chính (queue, file system, project lifecycle, events, thumbnail)
- **tauri-sidecar-app (Python)**: chỉ xử lý Whisper STT + health check
- **Frontend (Tauri UI)**: hiển thị progress + điều khiển queue

Mục tiêu: upload nhiều video → xử lý tuần tự → tạo project hoàn chỉnh (subtitle + thumbnail + metadata)

---

## 2. Sidecar Lifecycle (Python Service)

### Startup Flow

- Tìm port trống (`127.0.0.1:0`)
- Spawn `tauri-sidecar-app.exe --port {port}`
- Health check `/health` (retry 10 lần, 500ms)
- Lưu state vào `SidecarState { port, pid }`

### Failure Handling

- Nếu health check fail → show error dialog + stop app

---

## 3. Project Structure

projects/{project_id}/
  project.json
  subtitles.json
  media/
    thumbnail.jpg

Rule:
- KHÔNG tạo project folder trước khi Whisper SUCCESS
- Nếu lỗi → cleanup toàn bộ folder nếu đã tạo

---

## 4. Project Schema (project.json v2)

{
  "id": "uuid",
  "name": "video.mp4",
  "project_type": "video",
  "schema_version": 2,
  "status": "completed",
  "created_at": "...",
  "updated_at": "...",
  "source": {
    "path": "D:/video.mp4",
    "size": 12345,
    "modified_at": null,
    "fingerprint": null
  },
  "media": {
    "duration": 17.2,
    "width": 1920,
    "height": 1080,
    "fps": 30,
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
}

---

## 5. Subtitle JSON Schema

[
  {
    "cue_id": "uuid",
    "sequence": 1,
    "start_time": 0,
    "end_time": 3000,
    "duration": 3000,
    "content": "text",
    "translated_content": null
  }
]

Parsing: Rust backend (subtp/srtparse)

---

## 6. Thumbnail Generation (Rust Backend)

ffmpeg -ss 00:00:01 -i input.mp4 -vframes 1 output.jpg

Output:
media/thumbnail.jpg

---

## 7. tauri-sidecar-app API

POST /stt/whisper

Request:
{
  "video_path": "D:/video.mp4",
  "video_name": "video",
  "language": "zh"
}

Success:
{
  "status_code": 0,
  "message": "SUCCESS",
  "srt_content": "...",
  "error_details": null
}

Fail:
{
  "status_code": 1,
  "message": "FAILED",
  "srt_content": null,
  "error_details": "error"
}

Rule:
- 0 + srt_content => continue
- else => cleanup + error

---

## 8. Job Queue System

UploadJob:
{
  job_id,
  video_path,
  video_name,
  language
}

Status:
Queued, Running, CallingWhisper, ParsingSubtitle,
CreatingProject, ExtractingThumbnail, SavingFiles,
Completed, Cancelled, Failed

---

## 9. Processing Pipeline

1. Select videos
2. Enqueue
3. Call Whisper
4. Parse SRT
5. Create project (ONLY after success)
6. Create media folder
7. Generate thumbnail
8. Save subtitle + project.json
9. Emit progress
10. Next job

---

## 10. Progress System

States:
queued, running, calling_whisper, parsing,
creating_project, extracting_thumbnail, saving,
completed, failed, cancelled

---

## 11. Event System

upload_progress event (Rust -> UI)

---

## 12. Cancel Queue

- Running job continues
- Pending jobs cancelled
- Stop after current job

---

## 13. Error Handling

- If error after project creation → delete folder
- Emit error event
- Continue queue

---

## 14. Key Design Decisions

- Sidecar only Whisper
- Rust orchestrator
- Sequential queue
- Event-driven UI
