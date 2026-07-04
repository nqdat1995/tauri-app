# Code Generation Plan — Unit 3: editor-backend

## Unit Context
- **Unit Name**: editor-backend
- **Layer**: Backend (Rust/Tauri)
- **Purpose**: Tauri commands + validation + storage extension for editor operations
- **Dependencies**: Unit 1 (type contract), Unit 2 (frontend consuming these commands)

## Code Location
- **Workspace root**: `/Users/maiphan/n8n/tauri-app/`
- **Target**: `src-tauri/src/editor/` (new module) + modifications to existing files

## Generation Steps

### Step 1: Create editor module — models.rs
- [ ] Create `src-tauri/src/editor/mod.rs`
- [ ] Create `src-tauri/src/editor/models.rs`
- Rust structs matching TS types: EditorStyle, OverlayItem, SubtitleCue, EditorOverlays, SaveEditorRequest, EditorProjectResponse, ProjectSummary

### Step 2: Create editor/validation.rs
- [ ] Create `src-tauri/src/editor/validation.rs`
- validate_subtitles: check start_time < end_time, non-negative
- validate_style: fontSize 1-200, bgOpacity 0-100
- validate_overlays: max instances per type check

### Step 3: Create editor/commands.rs
- [ ] Create `src-tauri/src/editor/commands.rs`
- 4 Tauri commands: load_editor_project, save_editor_project, get_recent_project, list_editor_projects

### Step 4: Extend storage.rs
- [ ] Modify `src-tauri/src/storage.rs`
- Add: read_subtitles_file, write_subtitles_file, read_project_json, update_project_editor_fields, get_most_recent_project_id, list_project_summaries, check_video_exists

### Step 5: Register in lib.rs and commands/mod.rs
- [ ] Modify `src-tauri/src/lib.rs` — add `mod editor;` + register 4 commands
- [ ] Modify `src-tauri/src/commands/mod.rs` — add `pub mod editor;` (or re-export from editor module)

### Step 6: Build verification
- [ ] Run `cargo check` — must pass with 0 errors

### Step 7: Documentation
- [ ] Create `aidlc-docs/construction/editor-backend/code/summary.md`
