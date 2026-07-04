# Component Methods — Video Editor Feature

## Backend Methods

### editor/commands.rs

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `load_editor_project` | `project_id: String` | `Result<EditorProject, String>` | Load project.json + subtitles.json, validate video exists, return combined data |
| `save_editor_project` | `project_id: String, request: SaveEditorRequest` | `Result<(), String>` | Validate input, atomic write subtitles.json + update project.json (style, overlays) |
| `get_recent_project` | — | `Result<Option<String>, String>` | Return most recently updated project_id from app_data.json |
| `list_editor_projects` | — | `Result<Vec<ProjectSummary>, String>` | List all project IDs with name, status, updated_at |

### editor/validation.rs

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `validate_subtitles` | `&[SubtitleCue]` | `Result<(), Vec<String>>` | Check required fields, timing ranges |
| `validate_style` | `&EditorStyle` | `Result<(), Vec<String>>` | Check fontSize range, opacity range, valid colors |
| `validate_overlays` | `&EditorOverlays` | `Result<(), Vec<String>>` | Check max instances per type, valid positions |

### storage.rs (new methods)

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `read_editor_project` | `project_id: &str` | `Result<(ProjectRecord, Vec<SubtitleCue>)>` | Read both files from projects/{id}/ |
| `write_editor_subtitles` | `project_id: &str, cues: &[SubtitleCue]` | `Result<()>` | Atomic write subtitles.json |
| `update_project_editor_fields` | `project_id: &str, style: &EditorStyle, overlays: &EditorOverlays` | `Result<()>` | Update project.json editor_style + editor_overlays fields |
| `get_most_recent_project_id` | — | `Result<Option<String>>` | Parse app_data.json, sort by updated_at, return first |
| `list_project_summaries` | — | `Result<Vec<ProjectSummary>>` | Scan projects/ dir, load each project.json minimally |
| `check_video_exists` | `video_path: &str` | `bool` | Check if source video file still exists on disk |

---

## Frontend Methods

### EditorStore (Zustand)

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `loadProject` | `projectId: string` | `Promise<void>` | Call load_editor_project command, populate store |
| `loadRecentProject` | — | `Promise<void>` | Call get_recent_project, then loadProject |
| `saveProject` | — | `Promise<void>` | Call save_editor_project with current state, reset isDirty |
| `updateSubtitle` | `id: string, field: string, value: any` | `void` | Update cue in store, set isDirty |
| `addSubtitle` | `afterId?: string` | `void` | Insert new cue, set isDirty |
| `deleteSubtitle` | `id: string` | `void` | Remove cue from store, set isDirty |
| `updateStyle` | `Partial<SubtitleStyle>` | `void` | Merge style update, set isDirty |
| `selectPreset` | `presetId: string` | `void` | Apply preset to active style, set isDirty |
| `addOverlay` | `type: OverlayType` | `void` | Add overlay item (check max), set isDirty |
| `removeOverlay` | `id: string` | `void` | Remove overlay item, set isDirty |
| `updateOverlay` | `id: string, updates: Partial<OverlayItem>` | `void` | Update overlay config/position/size, set isDirty |
| `toggleOverlay` | `id: string` | `void` | Toggle enabled state, set isDirty |
| `setCurrentTime` | `time: number` | `void` | Update currentTime (from video timeupdate) |
| `seekTo` | `time: number` | `void` | Set currentTime (from user action) |

### Editor Page

| Method | Purpose |
|--------|---------|
| `handleNavigateAway` | Check isDirty → show confirmation dialog → block or allow |
| `handleSave` | Call store.saveProject, show success toast |
| `handleProjectNotFound` | Show error dialog → on close redirect to History tab |

### VideoPlayer

| Method | Purpose |
|--------|---------|
| `handlePlayPause` | Toggle video play/pause |
| `handleSeek(time)` | Seek video to time, update store.currentTime |
| `handleTimeUpdate` | On video timeupdate event, update store.setCurrentTime |
| `handleVolumeChange` | Set video volume |
| `handleFullscreen` | Toggle fullscreen |

### SubtitleTable

| Method | Purpose |
|--------|---------|
| `handleEditCue(id, field, value)` | Call store.updateSubtitle |
| `handleAddCue` | Call store.addSubtitle |
| `handleDeleteCue(id)` | Call store.deleteSubtitle |
| `handleRowClick(cue)` | Call store.seekTo(cue.startTime) |

### OverlayPanel

| Method | Purpose |
|--------|---------|
| `handleAddEffect(type)` | Call store.addOverlay(type) |
| `handleSelectEffect(id)` | Set local selectedOverlayId state |
| `handleToggleEffect(id)` | Call store.toggleOverlay(id) |
| `handleDeleteEffect(id)` | Call store.removeOverlay(id) |
| `handleConfigChange(id, updates)` | Call store.updateOverlay(id, updates) |

### OverlayViewport (react-rnd)

| Method | Purpose |
|--------|---------|
| `handleDragStop(id, x, y)` | Call store.updateOverlay(id, {position: {x, y}}) |
| `handleResizeStop(id, w, h)` | Call store.updateOverlay(id, {size: {width: w, height: h}}) |
| `handleSelect(id)` | Highlight selected overlay item |
