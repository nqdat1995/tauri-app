# Phase 1 CONTEXT

## Phase goal
Build the Home page upload workflow for video translation output.

## Locked decisions
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

## Out of scope
- Editor, History, Settings, and SRT-to-audio pages are outside Phase 1.
- Detailed output-mode execution semantics and export transformation logic are deferred to a later phase.

## Notes
- `project.sample.json` is the source example for the project record shape.
- This context is based on the current repository state and the supplied Phase 1 goal.
