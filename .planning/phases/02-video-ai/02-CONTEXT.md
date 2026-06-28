# Phase 2 CONTEXT

## Phase goal
Implement the processing pipeline and orchestration for video -> subtitle projects using the Rust Tauri orchestrator + Python Whisper sidecar as described in `video-ai-tauri-plan.md`.

(Reference: [video-ai-tauri-plan.md](video-ai-tauri-plan.md#L1))

## Prior locked decisions (applies from Phase 1)
- Home upload UI stages selected videos; project records are created by user action (`Dịch & xuất`) or by the pipeline on success as specified below. See [1-CONTEXT.md](1-CONTEXT.md#L1).

## Locked implementation decisions for Phase 2
- Architecture
  - Rust Tauri app is the orchestrator (queue, file lifecycle, event bus). The `tauri-sidecar-app` (Python) is dedicated to Whisper STT and health checks.
  - Frontend listens to orchestrator events for progress and controls queue (start, cancel pending jobs).

- Sidecar lifecycle
  - Sidecar is spawned by the Rust orchestrator using a dynamic port (bind `127.0.0.1:0` → read assigned port). Command: `tauri-sidecar-app --port {port}`.
  - Health check endpoint `/health` polled up to 10 attempts with 500ms interval. If health check fails, present an error dialog and stop further processing.
  - Persist minimal `SidecarState { port, pid }` in memory; attempt automatic restart only if explicitly requested by user (no silent respawn loops).

- Job queue & processing model
  - Sequential queue: jobs are processed one at a time (no concurrency) to simplify resource usage and sidecar interactions.
  - Job lifecycle states: `queued`, `running`, `calling_whisper`, `parsing_subtitle`, `creating_project`, `extracting_thumbnail`, `saving_files`, `completed`, `failed`, `cancelled`.
  - Cancellation: running job continues to completion; pending jobs are cancellable and removed from the queue. `Stop after current job` semantics supported.
  - Retry policy: do not auto-retry failures by default; surface failures to user with retry button per-job (manual retry).

- Project creation timing & atomicity
  - Follow strict rule: do NOT create the project folder or persist `project.json` until Whisper STT returns success and SRT parsing completes.
  - Only after STT parse success, atomically create `projects/{project_id}/` and write `project.json`, `subtitles.json`, and `media/thumbnail.jpg`.
  - If any step after project creation fails, delete the project folder and emit an error event.

- Persistence & layout
  - Use `projects/{project_id}/` layout with `project.json` (v2 schema), `subtitles.json`, and `media/thumbnail.jpg` as described in `video-ai-tauri-plan.md`.
  - `project.json` must include source metadata, media metadata, asset references, and `processing` state fields. Use `schema_version: 2`.
  - For intermediate/staged data before project creation, keep only in-memory state tied to the job; do not write partial disk artifacts except temporary files created by the OS/sidecar (clean on failure).

- Sidecar API contract
  - POST `/stt/whisper` with `{ video_path, video_name, language }`.
  - Success response: `status_code: 0` and `srt_content` present → continue pipeline.
  - Failure (non-zero or missing srt_content): abort job, emit error, do not create project folder.

- Media processing
  - Thumbnail extraction performed in Rust after STT success, using ffmpeg: `ffmpeg -ss 00:00:01 -i input.mp4 -vframes 1 output.jpg` (or nearest-frame fallback if seek fails).
  - Save thumbnail to `media/thumbnail.jpg` inside the project folder at creation time.

- Progress & event system
  - Orchestrator emits job-scoped events (e.g., `job:{id}:state` and `job:{id}:progress`) to the frontend via Tauri event API.
  - UI maps orchestrator states to the progress UI states listed in the plan.

- Error handling
  - If a failure happens before project creation: emit error for job, leave no project folder, allow manual retry.
  - If failure occurs after project creation: delete project folder and emit error. Log sufficient diagnostic details.

- Security / IPC
  - Sidecar listens on localhost only (127.0.0.1). Do not expose port to network interfaces.
  - No unauthenticated remote access allowed; only local process may call the sidecar.

## Gray areas (for researcher & planner to verify)
- Sidecar restart policy: whether to implement automatic restart on crash vs manual restart by user.
- Long-running job cancellation: whether to implement graceful Whisper cancellation (sidecar) or kill-only semantics.
- Temp file handling: exact temp file locations and cleanup window semantics on Windows (NTFS locks, antivirus interference).
- Large file handling: chunking, streaming to sidecar, or passing local path — researcher should evaluate memory and I/O tradeoffs.

## Deferred ideas
- Parallel / worker pool processing (future phase) for higher throughput.
- Remote-side processing / cloud offload integration.

## Acceptance criteria (Phase 2)
- Orchestrator spawns sidecar and passes health check reliably per lifecycle rules.
- Jobs process sequentially from selection to saved `projects/{id}/project.json` only after STT+parse success.
- UI receives and displays progress events for each job state and supports cancelling pending jobs.
- Project artifacts match `project.json` v2 shape and include `subtitles.json` and `media/thumbnail.jpg`.

## Next steps for downstream agents
- Researcher: verify Windows temp-file and ffmpeg behavior; evaluate sidecar streaming vs local path passing; recommend restart/cancellation semantics.
- Planner: produce task breakdown for implementing queue, sidecar orchestration, project persistence, UI events, and error flows.

(References: `video-ai-tauri-plan.md`, `1-CONTEXT.md`)
