# Phase 1 UAT

## Summary
Phase 1 Home upload flow is implemented and largely functional. The app supports multi-video selection, UI staging, removal controls, export gating, and persistence of exported project records.

## Test Results

1. Multi-video selection and staging
- Result: PASS
- Evidence: `Home` stores selected files in `selectedVideos` and renders a video list with thumbnail/fallback, metadata, and removal buttons.

2. Unsupported file validation
- Result: FAIL
- Evidence: `handleFiles` ignores non-video files without adding a rejection state or user feedback. There is no visible per-file rejection message.

3. Export button availability
- Result: PASS
- Evidence: `Header` disables export when `selectedCount === 0`.

4. Export creates independent project records
- Result: PASS
- Evidence: `handleExport` maps each selected video into a separate `ProjectRecord` and calls `addProject(project)` for each item.

5. Schema compliance for saved records
- Result: PASS
- Evidence: Saved records include `schema_version`, `project_type`, `name`, `status`, `created_at`, `updated_at`, `source`, `media`, and `processing`.

6. No saved project records before export
- Result: PASS
- Evidence: `addProject` is only called inside `handleExport`, so record creation occurs only after export.

7. Exported records persist across reload
- Result: PASS
- Evidence: `src/lib/projectStorage.ts` uses `localStorage` to persist records via `STORAGE_KEY`.

## Findings

- The Home workflow lacks explicit user-visible rejection feedback for unsupported files.
- `source.path` is populated with a transient `URL.createObjectURL(file)` string, which is not a stable reference after reload.
- The UI meets the main Phase 1 staging and export requirements, but the invalid-file handling and saved path semantics need correction.

## Diagnosis

- `handleFiles` currently filters non-video inputs silently and never stores information about rejected files.
- Per-file validation is not surfaced, so the user cannot tell which items were rejected or why.
- The app conflates a temporary preview URL with persisted record `source.path`; this should be decoupled.

## Fix Plan for /gsd-execute-phase

1. Update `Home` selection logic
   - Track invalid file candidates separately with a rejection reason.
   - Preserve valid selections while showing rejected items and reasons.
   - Ensure `accept="video/*"` remains enforced but add runtime MIME-type validation.

2. Decouple preview URL from persisted source path
   - Keep the object URL only for UI preview and thumbnail generation.
   - Store `source.path` as a stable identifier such as the original file name or native file path if Tauri is available.
   - If a native file path is available under Tauri, save it to `source.path`; otherwise use file metadata only.

3. Add UI feedback for unsupported files
   - Display rejected file names with a message like `Unsupported file type`.
   - Keep valid selected videos in the list and allow export only for valid items.

4. Strengthen persistence semantics
   - Confirm exported records remain readable after reload and no longer depend on temporary blob URLs.
   - Optionally add a `preview_url` field for transient UI state if needed.

## Recommendation

Proceed with `/gsd-execute-phase` to fix invalid-file feedback and stable record path handling in Phase 1.
