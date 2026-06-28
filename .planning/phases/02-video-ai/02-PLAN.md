# Phase 2 Plan

## Goal
Build the Phase 2 pipeline for video → subtitle projects using the Rust Tauri orchestrator, Python Whisper sidecar, and event-driven UI.

## Outcome
A stable sequential job system that:
- starts a local Whisper sidecar
- polls sidecar health reliably
- sends video STT requests to Whisper
- parses SRT into `subtitles.json`
- creates `projects/{project_id}` only after STT success
- generates `media/thumbnail.jpg`
- saves `project.json` v2 and emits progress events
- supports cancelling pending jobs and retrying failures

## In scope
- Rust Tauri orchestrator queue and lifecycle
- Local sidecar spawn, port binding, and health check
- Whisper STT request flow and success/failure handling
- Atomic project folder creation with `project.json`, `subtitles.json`, and thumbnail
- Event-driven frontend progress UI and queue controls
- Cleanup on failure after partial creation

## Out of scope
- parallel job processing
- cloud or remote Whisper backends
- advanced translation completion beyond `processing` metadata fields
- editor/history pages outside the queue UI

## Implementation Tasks

### 1. Define Phase 2 backend models
- add Rust structs for `SidecarState`, `UploadJob`, `ProjectManifestV2`, and subtitle cue schema
- extend `src/lib/types.ts` or backend models to reflect the v2 `project.json` shape and subtitle asset paths

### 2. Implement sidecar lifecycle in Rust
- bind `127.0.0.1:0` and spawn `tauri-sidecar-app --port {port}`
- store `SidecarState { port, pid }` in memory
- implement `/health` polling with 10 attempts at 500ms
- emit an error dialog or event if the sidecar never becomes ready
- support explicit restart only via UI command (manual)

### 3. Build sequential job queue and state machine
- create a queue structure in Rust that processes one job at a time
- support job states: `queued`, `running`, `calling_whisper`, `parsing_subtitle`, `creating_project`, `extracting_thumbnail`, `saving_files`, `completed`, `failed`, `cancelled`
- allow pending jobs to be cancelled and removed from the queue
- implement `Stop after current job` semantics

### 4. Implement STT and subtitle parsing
- create a Tauri command or backend service that posts to `POST /stt/whisper`
- verify success only when `status_code: 0` and `srt_content` exists
- parse the returned SRT into `subtitles.json` in Rust
- do not create the project folder until parsing succeeds

### 5. Implement atomic project creation
- create `projects/{project_id}/` only after STT success and subtitle parse completion
- write `project.json`, `subtitles.json`, and `media/thumbnail.jpg` together
- include `source.path`, `media.duration`, `media.width`, `media.height`, `media.fps`, `media.thumbnail_path`, and `assets.subtitle_json`
- set `processing.stt_status`, `processing.translation_status`, and `processing.error`

### 6. Generate thumbnails via ffmpeg
- run `ffmpeg -ss 00:00:01 -i input.mp4 -vframes 1 output.jpg`
- if the direct seek fails, fall back to nearest available frame
- save the result as `media/thumbnail.jpg` inside the project folder

### 7. Hook up frontend event UI
- implement Tauri event listeners for `job:{id}:state` and `job:{id}:progress`
- display each job's status and provide a cancel button for pending queue items
- show failure details and a retry action for failed jobs
- map orchestrator state names into user-facing progress labels

### 8. Implement cleanup and error recovery
- if a job fails before project creation, emit error and leave no folder behind
- if a job fails after project creation, delete the `projects/{project_id}` folder and emit diagnostics
- preserve orphan cleanup logic for Windows/NTFS temp files

### 9. Document and verify
- add Phase 2 acceptance checks to `.planning/phases/02-video-ai/02-PLAN.md`
- update architecture/supporting docs if schema or event naming changes
- add regression notes for sidecar port, health check, and cleanup semantics

## Verification Criteria
- [ ] The app spawns the Whisper sidecar and passes `/health` within 10 attempts
- [ ] Jobs execute sequentially with no concurrent Whisper calls
- [ ] Pending jobs can be cancelled; running jobs are allowed to finish
- [ ] The pipeline creates `projects/{id}` only after STT and SRT parsing succeed
- [ ] Each saved project contains:
  - `project.json` v2
  - `subtitles.json`
  - `media/thumbnail.jpg`
- [ ] `project.json` includes `source`, `media`, `assets`, and `processing` fields as described in `video-ai-tauri-plan.md`
- [ ] If a job fails after partial persistence, the project folder is deleted and the failure is emitted
- [ ] Frontend displays job lifecycle states and retry/cancel controls correctly

## Notes
- This phase should re-use the existing `Home` page upload and export flow, but add a new queue-oriented progress experience.
- Keep the Rust orchestrator and sidecar contract strictly local: `127.0.0.1`, no external network exposure.
- Treat `video-ai-tauri-plan.md` as the phase architecture source of truth.
