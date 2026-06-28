# Phase 1 Research

## User Constraints
- Home page upload flow is the Phase 1 focus. It must let users select one or more video files and show a selected-video list with thumbnails, metadata, and removal controls.
- Selected videos are staged in the UI, but project records are only created when the user clicks `Dịch & xuất`.
- Each video chosen at export time becomes an independent saved project record. The Home workflow does not collapse multiple selected videos into a single project batch.
- Validation happens immediately on selection. Unsupported files or non-video inputs are rejected at selection time with clear per-file feedback while valid videos remain selected.
- Persist upload records using the `project.sample.json` schema as the phase model. The saved record should include:
  - `schema_version`
  - `project_type`
  - `name`
  - `status`
  - `created_at`
  - `updated_at`
  - `source` with `mode`, `path`, `size`, and optional `modified_at` / `fingerprint`
  - `media` metadata such as duration, dimensions, fps, codecs
  - `processing` state data can remain empty until conversion begins

## Existing Codebase Findings
- `src/pages/Home/index.tsx` already implements multiple-video selection, video metadata extraction, thumbnail generation, and a removable selected-video list.
- `Header.tsx` contains the `Dịch & xuất` button, but it is currently a static button with no click behavior.
- No existing persistence layer was found in `src/` for saving projects, and the app does not currently use `localStorage`, Tauri file APIs, or a backend connection for long-lived state.
- `project.sample.json` is available at the repo root and defines the record schema expected for saved projects.

## Technical Research
- The browser can extract video duration and thumbnails via a hidden `<video>` element using `preload="metadata"` and `canvas` capture. This matches the current Home page approach.
- Non-video files should be rejected using both input `accept="video/*"` and additional runtime type checks on `file.type`; this avoids silent failures when a file has an incorrect extension.
- Since the app is a Tauri frontend, persistent project storage should use a client-side storage strategy that can be replaced later with a real file or database layer. A simple first implementation is:
  - save project records in `localStorage` or indexed JSON per project in app state
  - expose a persistence adapter layer so future Tauri FS or backend storage can be plugged in without changing Home UI logic

## Project Constraints (from copilot-instructions.md)
- Keep answers short and impersonal.
- Do not introduce unnecessary feature scope outside Phase 1.

## Architectural Responsibility Map
- UI: `Home` page, `Header`, `UploadCard`, `OptionPanel`
- Validation: `Home` page file selection flow
- Metadata extraction: `Home` page video metadata helper
- Persistence: new `project` storage adapter / utility
- Export flow: `Header` button event + Home page export handler

## Key Implementation Notes
- The export flow must create one project record per selected video, not one record for the whole selection.
- The record should be created only when the user clicks `Dịch & xuất`.
- File validation feedback must preserve valid selected videos even when invalid files are rejected.
- If metadata extraction fails, the record should still be created with available fields and fallback values.
