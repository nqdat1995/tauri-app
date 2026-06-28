# Phase 1 Plan

## Goal
Build the Home page upload workflow for video translation output and persist selected videos as independent project records when the user clicks `Dịch & xuất`.

## Outcome
A polished Phase 1 experience with:
- multi-video selection and staging
- instant per-file validation for unsupported inputs
- selected-video thumbnails, metadata, and removal controls
- a working export action that saves one `project.sample.json`-style record per video
- no project records created until export is explicitly confirmed

## Scope
### In scope
- Home page upload flow and selection UX
- `Dịch & xuất` export trigger
- project record creation for each selected video using the repo's JSON schema
- per-file validation and user feedback
- preserving valid videos when invalid files are rejected
- removal of selected videos before export

### Out of scope
- Editor, History, Settings, SRT-to-audio page work
- actual video translation or file transformation logic
- cross-phase persistence architecture beyond Phase 1 local storage

## Implementation Tasks
1. Update the Home page export flow
   - wire `Header` button to an export handler exposed by the `Home` page
   - keep `selectedVideos` staged in UI until export is clicked
   - disable or hide export if no valid selection exists

2. Implement project record creation
   - add a utility that maps a selected video into a `project.sample.json` record
   - include required fields: `schema_version`, `project_type`, `name`, `status`, `created_at`, `updated_at`, `source`, `media`, `processing`
   - derive `source.mode`, `source.path`, `source.size`, and metadata from the selected file and extracted video info
   - initialize `processing` as an empty placeholder object until later phases

3. Add persistent storage for Phase 1 records
   - add a small storage adapter that can save project records locally
   - if Tauri FS is not yet wired, use browser-local persistence such as `localStorage` to satisfy Phase 1 behavior
   - ensure project records survive a reload for Phase 1 verification

4. Strengthen selection validation and feedback
   - reject non-video files at selection time
   - show a clear inline message for each rejected file
   - preserve valid selected items when the user mixes valid and invalid files
   - ensure the file picker accepts `video/*` and runtime-checks the MIME type

5. Refine selected-video list UX
   - keep thumbnails, type, size, and duration visible
   - keep the remove button on each card
   - show totals: count, combined size, combined duration
   - if the thumbnail generation fails, show a fallback placeholder and still allow export

6. Verify schema compliance
   - compare generated records against `project.sample.json`
   - confirm `created_at` and `updated_at` are set at export time
   - confirm each selected video generates a separate record

## Verification Criteria
- [ ] Selecting one or more video files displays each item in the selected-video list with thumbnail, duration, size, and remove control
- [ ] Selecting an unsupported file type rejects that file and preserves other valid selections
- [ ] `Dịch & xuất` is unavailable when no videos are selected
- [ ] Clicking `Dịch & xuất` creates one independent saved project record per selected video
- [ ] Saved records include all required schema fields from `project.sample.json`
- [ ] No saved project records exist before the user clicks export
- [ ] Exported records persist across a page reload for Phase 1 verification
- [ ] Project creation uses the selected video data and extracted media metadata, without collapsing multiple videos into one project

## Notes for execution
- Keep this phase focused on UI staging + persistence, not on conversion engine behavior.
- Build the persistence adapter as a Phase 1 local implementation with a clear replacement path later.
- Keep the `Dịch & xuất` button behavior deterministic and easy to test.
