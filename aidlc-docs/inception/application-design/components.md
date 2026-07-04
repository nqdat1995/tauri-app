# Components — Video Editor Feature

## Backend Components (Rust)

### 1. `editor/mod.rs`
- **Purpose**: Editor module root — exports sub-modules
- **Responsibilities**: Module declaration and re-exports

### 2. `editor/models.rs`
- **Purpose**: Data structures for editor domain
- **Responsibilities**:
  - `EditorStyle` struct (font, size, colors, bg shape, position, opacity)
  - `OverlayItem` struct (id, type, enabled, config, position, size)
  - `EditorOverlays` struct (max_instances_per_type, items vec)
  - `SubtitleCue` struct (id, start_time, end_time, original_text, translated_text, is_new)
  - `EditorProject` response struct (project metadata + subtitles + style + overlays)
  - `SaveEditorRequest` input struct

### 3. `editor/commands.rs`
- **Purpose**: Tauri command handlers for editor operations
- **Responsibilities**:
  - `load_editor_project(project_id)` → read project + subtitles from disk
  - `save_editor_project(project_id, subtitles, style, overlays)` → validate + write
  - `get_recent_project()` → return most recent project ID from app_data
  - `list_editor_projects()` → return all projects available for editing

### 4. `editor/validation.rs`
- **Purpose**: Basic validation for editor save operations
- **Responsibilities**:
  - Validate required fields present
  - Validate timing ranges (start < end, non-negative)
  - Validate style value ranges (fontSize 1-200, opacity 0-100)
  - Return structured error messages

### 5. `storage.rs` (extended)
- **Purpose**: Extended with editor-specific read/write operations
- **Responsibilities** (new):
  - `read_editor_project(project_id)` → read project.json + subtitles.json + return combined
  - `write_editor_project(project_id, subtitles, style, overlays)` → atomic write both files
  - `get_most_recent_project_id()` → parse app_data.json, return latest
  - `list_project_ids()` → list all project directories

---

## Frontend Components (React/TypeScript)

### 6. `EditorStore` (Zustand)
- **Purpose**: Global editor state management
- **Responsibilities**:
  - Hold current project data (metadata, subtitles, style, overlays)
  - Track currentTime, isPlaying, isDirty (unsaved changes)
  - Actions: loadProject, saveProject, updateSubtitle, addSubtitle, deleteSubtitle, updateStyle, addOverlay, removeOverlay, updateOverlay
  - Derived state: activeCue (based on currentTime)

### 7. `Editor` Page (`pages/Editor/index.tsx`)
- **Purpose**: Main editor page layout orchestrator
- **Responsibilities**:
  - Layout: main area (video + subtitles) + right panel (style/overlay)
  - Load project on mount (from store or via get_recent_project)
  - Handle unsaved changes dialog on navigation away
  - Coordinate between sub-components via store

### 8. `EditorToolbar`
- **Purpose**: Top bar with project info and actions
- **Responsibilities**:
  - Display project metadata (filename, duration, size, resolution)
  - Status badge
  - Save button (triggers store.saveProject)
  - "Xuất Video" / "Tạo lại âm thanh" buttons (disabled in Phase 1)

### 9. `VideoPlayer`
- **Purpose**: Video playback with subtitle overlay
- **Responsibilities**:
  - HTML5 video element with asset:// src
  - Playback controls (play/pause, seek, skip, volume, fullscreen)
  - Seekbar/timeline with draggable handle
  - CSS-based subtitle overlay (positioned div, styled per activeStyle)
  - Overlay items placeholder/bounding boxes (for drag/resize in Phase 1)

### 10. `SubtitleTable`
- **Purpose**: Editable subtitle cue list
- **Responsibilities**:
  - Table display: TIME | VĂN BẢN GỐC | VĂN BẢN DỊCH
  - Inline editing (contentEditable spans)
  - Add new subtitle button
  - Delete subtitle button per row
  - Active cue highlight (synced with video time)
  - Click row → seek video to cue startTime

### 11. `StylePanel`
- **Purpose**: Right panel — subtitle style configuration
- **Responsibilities**:
  - Style/Overlay tab toggle
  - Preset grid with selectable cards
  - Font settings (family, size, color, bg color, shape, position, opacity)
  - Live preview update on change

### 12. `OverlayPanel`
- **Purpose**: Right panel — overlay effects management
- **Responsibilities**:
  - Effect type buttons (Nền phủ, Kính mờ, Gương, Chữ, Logo, Watermark)
  - Active effects list with eye icon toggle + select/delete
  - Config panel per selected effect type
  - Max instances enforcement (5 per type, configurable)

### 13. `OverlayViewport`
- **Purpose**: Drag/resize overlay items on video viewport
- **Responsibilities**:
  - Render overlay item bounding boxes using `react-rnd`
  - Draggable + resizable handles
  - Position/size sync with store
  - Visual indicator of selected item
