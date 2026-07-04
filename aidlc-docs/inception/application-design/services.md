# Services — Video Editor Feature

## Service Layer Overview

The Video Editor feature uses a simple **command-based service layer** via Tauri IPC. No separate "service" orchestrator module is needed because:
- Operations are straightforward CRUD (read/validate/write)
- No complex multi-step pipelines (unlike STT pipeline)
- Single-user desktop app (no concurrency concerns)

---

## Tauri IPC Service Contract

### Command: `load_editor_project`
```
Frontend → invoke("load_editor_project", { projectId }) → Backend
Backend: storage.read_editor_project(id) → validate video exists → return EditorProject
Frontend: store.loadProject receives data → populate UI
```

**Error handling**:
- Project not found → return error string
- Video file missing → return error with `video_missing: true` flag
- Subtitles file missing/corrupt → return error string

### Command: `save_editor_project`
```
Frontend → invoke("save_editor_project", { projectId, request: SaveEditorRequest }) → Backend
Backend: validation.validate_subtitles + validate_style + validate_overlays → storage.write → return Ok
Frontend: on success → reset isDirty, show toast
```

**Error handling**:
- Validation failure → return Vec<String> of error messages
- Write failure → return error string
- Atomic write: if either file fails, rollback both (keep previous state)

### Command: `get_recent_project`
```
Frontend → invoke("get_recent_project") → Backend
Backend: storage.get_most_recent_project_id() → return Option<String>
Frontend: if Some(id) → loadProject(id). if None → show empty state
```

### Command: `list_editor_projects`
```
Frontend → invoke("list_editor_projects") → Backend
Backend: storage.list_project_summaries() → return Vec<ProjectSummary>
Frontend: populate project picker (if needed)
```

---

## Frontend Service Layer (Zustand Store as Service)

The Zustand `EditorStore` acts as the frontend service layer:

### Data Flow: Load
```
App tab change → Editor mounts
  → store.loadRecentProject()
    → invoke("get_recent_project") → projectId
    → invoke("load_editor_project", { projectId })
    → store state populated
    → UI renders
```

### Data Flow: Edit (no network)
```
User edits subtitle → store.updateSubtitle(id, field, value)
  → store.subtitles updated (in-memory only)
  → store.isDirty = true
  → UI re-renders (subtitle table + video overlay)
```

### Data Flow: Save
```
User clicks "Lưu" → store.saveProject()
  → build SaveEditorRequest from current state
  → invoke("save_editor_project", { projectId, request })
  → on success: store.isDirty = false, show toast
  → on error: show error message
```

### Data Flow: Navigate Away
```
User clicks another tab → App.handleTabChange(newTab)
  → if store.isDirty: show confirmation dialog
    → "Lưu & rời" → store.saveProject() → navigate
    → "Rời mà không lưu" → store.resetDirty() → navigate
    → "Hủy" → stay on editor
  → if !store.isDirty: navigate directly
```

---

## Cross-Component Communication

| From | To | Mechanism | Data |
|------|----|-----------|------|
| History page | Editor page | App-level state (`activeEditorProjectId`) | project_id |
| Home page (post-STT) | Editor page | App-level state | project_id |
| VideoPlayer | Store | store.setCurrentTime | current playback time |
| Store (currentTime) | SubtitleTable | derived: activeCue | highlights active row |
| Store (currentTime) | VideoPlayer overlay | derived: activeCue | shows/hides subtitle |
| SubtitleTable click | VideoPlayer | store.seekTo → video.currentTime | seek time |
| StylePanel change | VideoPlayer overlay | store.activeStyle | re-renders overlay style |
| OverlayPanel | OverlayViewport | store.overlays | renders drag/resize boxes |
| OverlayViewport drag | Store | store.updateOverlay | position/size update |
