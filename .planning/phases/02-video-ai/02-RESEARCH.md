# Phase 2 Research

## User Constraints
- Implement the processing pipeline and orchestration for video → subtitle projects using the Rust Tauri orchestrator + Python Whisper sidecar.
- The Rust Tauri app is the orchestrator: queue, file lifecycle, event bus, thumbnail extraction, and project persistence.
- The Python sidecar is dedicated to Whisper STT and health checks only.
- Jobs must process sequentially, one at a time; only pending jobs may be cancelled.
- Do not create `projects/{project_id}/` or persist `project.json` until Whisper STT returns success and SRT parsing completes.
- On any failure after project creation, delete the entire project folder and emit an error event.
- Persist final project artifacts as:
  - `projects/{project_id}/project.json`
  - `projects/{project_id}/subtitles.json`
  - `projects/{project_id}/media/thumbnail.jpg`
- `project.json` uses `schema_version: 2` and must include asset references, source metadata, media metadata, and processing state.
- The frontend should receive progress events mapped to the orchestrator lifecycle and support cancelling pending jobs.

## Existing Codebase Findings
- `src/pages/Home/index.tsx` currently implements multi-video selection, thumbnail capture, metadata extraction, and export via `save_project`.
- The current save flow is backed by `src/lib/projectStorage.ts`, which calls the Tauri command `save_project` and falls back to `localStorage`.
- `src-tauri/src/commands.rs` and `src-tauri/src/storage.rs` contain the current backend save command and project file path logic.
- The existing backend wiring in `src-tauri/src/lib.rs` is already modular enough to extend with new commands and orchestrator state.
- `video-ai-tauri-plan.md` already defines the intended architecture, sidecar contract, project layout, and job lifecycle states.
- `project.sample.json` is Phase 1 schema and does not yet match the Phase 2 `project.json` v2 shape.

## Technical Research
- Sidecar startup should be implemented by binding to `127.0.0.1:0` and spawning `tauri-sidecar-app --port {port}`.
- Health checks should poll `/health` up to 10 times at 500ms intervals, then stop the pipeline if the sidecar never becomes ready.
- Whisper requests should be sent with `POST /stt/whisper` and include `video_path`, `video_name`, and `language`.
- A successful sidecar response is `status_code: 0` with `srt_content`; any other response must abort the job.
- Subtitle parsing should produce `subtitles.json` with time-coded cues and preserved content; use a Rust parser rather than client-side JS.
- Thumbnail generation should use `ffmpeg -ss 00:00:01 -i input.mp4 -vframes 1 output.jpg` or a nearest-frame fallback when seek is unreliable.
- The project folder must be created atomically after STT success; if later steps fail, delete the folder and return a clear diagnostic error.
- Job events should be emitted via Tauri events using a consistent naming scheme like `job:{id}:state` and `job:{id}:progress`.
- The UI should support queue controls: start, cancel pending, and retry failed jobs.
- Determine whether the backend should support graceful Whisper cancellation or only cancel pending jobs and allow running jobs to finish.

## Project Constraints
- Keep Phase 2 focused on the orchestrator, sidecar lifecycle, queue, and persistence. Do not add parallel job execution or remote/cloud processing yet.
- Maintain the Phase 1 rule that selected videos are staged in UI and project creation is triggered by explicit pipeline completion.
- Avoid storing temporary partial project artifacts on disk except during transient OS/sidecar operations.

## Key Research Questions
- Should the orchestrator implement automatic sidecar restart on crash, or only manual restart by user request?
- How should Windows temp file and ffmpeg locking behavior be handled to avoid orphaned files and failed thumbnail extraction?
- What is the safest path strategy for `video_path` and project source metadata when running under Tauri on Windows?
- Should SRT parsing and `subtitles.json` creation happen in Rust or via a separate helper library? `video-ai-tauri-plan.md` suggests Rust backend.
- What exact `processing` fields belong in `project.json` v2 to support later translation and retry semantics?

## Notes
- Use `video-ai-tauri-plan.md` as the authoritative architecture spec for this phase.
- Phase 2 must remain compatible with Phase 1 upload semantics and the existing Tauri frontend shell.
- If the sidecar contract changes, preserve the sequence: health check → whisper call → parse → project creation.
