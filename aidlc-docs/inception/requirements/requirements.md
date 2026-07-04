# Requirements — Video Editor Feature (Trình chỉnh sửa video)

## Intent Analysis

| Field | Value |
|---|---|
| **User Request** | Xây dựng hoàn thiện tính năng chỉnh sửa video (tab "Trình chỉnh sửa") dựa trên mockup |
| **Request Type** | New Feature (full-stack: Frontend + Backend) |
| **Scope Estimate** | Multiple Components (new FE page + new Rust commands + data model extension) |
| **Complexity Estimate** | Moderate-to-Complex |
| **Phased Delivery** | Phase 1 (current): Edit + Save. Phase 2 (future): Export video + TTS |

---

## Phased Approach

### Phase 1 (Current Scope)
- Subtitle editing (CRUD: read, edit text/timing, add new, delete)
- Subtitle style configuration (font, size, color, background, position, opacity)
- Real video playback with live subtitle overlay (matching selected style)
- Persist all changes to project storage (manual save)
- Overlay tab UI with full settings (saved for Phase 2 rendering)
- Navigate to editor from History or auto-open after STT

### Phase 2 (Future — NOT in current scope)
- Video export with burn-in subtitles (FFmpeg)
- TTS audio generation via sidecar
- Final video rendering with all overlays applied

---

## Functional Requirements

### FR-ED-01: Load Project into Editor
- Editor loads the most recently processed project on tab open
- User can also open a specific project from History tab
- Load `project.json` + `subtitles.json` from `projects/{id}/` storage
- Display project metadata: filename, duration, file size, resolution, processing time

### FR-ED-02: Video Playback
- Play video from local filesystem using HTML5 `<video>` + Tauri `asset://` protocol
- Playback controls: play/pause, skip forward/backward, seek via timeline
- Display current time / total duration
- Volume control, mute toggle
- Fullscreen toggle

### FR-ED-03: Subtitle Overlay on Video
- Render subtitle text on top of video viewport in real-time
- Subtitle appears/disappears based on cue timing (startTime → endTime)
- Overlay style matches the user-selected SubtitleStyle (font, size, color, bg, position, opacity)
- Live preview: changing style immediately updates the overlay appearance

### FR-ED-04: Subtitle Table (Read/Edit)
- Display all subtitle cues in a table: TIME | VĂN BẢN GỐC | VĂN BẢN DỊCH
- Allow inline editing of original text and translated text
- Allow editing of start/end timing per cue
- Highlight the currently active cue (based on video playback time)
- Click on a row to seek video to that cue's startTime

### FR-ED-05: Add New Subtitle
- User can add a new subtitle cue (with empty text fields)
- New cue gets default timing (e.g., current video time → +3s)
- New cue appears in table and is immediately editable

### FR-ED-06: Delete Subtitle
- User can delete any subtitle cue from the table
- Confirmation not required (immediate delete, recoverable via not saving)

### FR-ED-07: Manual Save
- Changes are NOT auto-saved
- User clicks "Lưu" (Save) button to persist
- Save writes updated `subtitles.json` + updated `project.json` (with style) to disk
- Backend Tauri command: `save_editor_project(project_id, subtitles, style)`

### FR-ED-08: Subtitle Style Configuration
- Right panel "Style" tab with preset grid
- Presets show preview text with different styles
- User can select a preset → applies immediately to video overlay
- Manual fine-tuning:
  - Font family (system fonts dropdown)
  - Font size (slider, px value)
  - Text color (color picker)
  - Background color (color picker)
  - Background shape: Hộp bo (rounded) / Hộp vuông (box) / Không (none)
  - Position: Trên (top) / Dưới (bottom)
  - Background opacity (slider, 0-100%)
- Active style saved in `project.json` under `editor_style` field

### FR-ED-09: Overlay Tab (UI + Persistence)
- "Overlay" tab in right panel

**Available effect types (displayed as buttons at the top):**
- Nền phủ (Background overlay)
- Kính mờ (Blur)
- Hiệu ứng gương (Mirror effect)
- Chữ (Text overlay)
- Logo
- Watermark

**Interaction model:**
1. Effect types are shown as **buttons** in a toolbar area
2. Clicking a button **adds an instance** of that effect to the **active effects list** below
3. Each effect type allows a maximum of **X instances** (configurable in code, default X = 5)
4. When the limit is reached, the button becomes disabled

**Active effects list:**
- Each added effect shows as a list item with: effect name + **eye icon** (toggle visibility/enable-disable)
- Clicking on a list item **opens the configuration panel** specific to that effect type:
  - Nền phủ: color picker + opacity slider
  - Kính mờ: color picker + opacity slider
  - Hiệu ứng gương: (no extra config — toggle only via eye icon)
  - Chữ: text input + font family + font size + color
  - Logo: file picker + opacity
  - Watermark: file picker + opacity
- Each list item can be **deleted** (remove from list)

**Size/Position — Visual editing on viewport:**
- Size and position are NOT configured in the settings panel
- Instead, user **drags** the overlay element directly on the video viewport to set position
- Overlay elements are **resizable** via drag handles on the viewport
- This provides intuitive WYSIWYG-style editing

**Persistence:**
- Overlay settings (list of active effects with their config, position, size, enabled state) saved to `project.json` under `editor_overlays` field
- Overlay rendering on video viewport is Phase 2 (in Phase 1: only persist settings + show placeholder/bounding boxes on viewport for positioning)

### FR-ED-10: Editor Toolbar
- Status badge showing project state (Đã có phụ đề/giọng, Đang xử lý, etc.)
- Project filename and metadata display
- "Tạo lại âm thanh" button (disabled/placeholder in Phase 1)
- "Xuất Video" button (disabled/placeholder in Phase 1, shows tooltip "Sẽ có trong phiên bản tiếp")
- "Lưu" (Save) button — triggers FR-ED-07

### FR-ED-11: Navigate from History to Editor
- History table rows have an "Edit" action/button
- Clicking "Edit" switches to Editor tab and loads that project
- After STT completes on Home tab, option to auto-navigate to Editor

---

## Non-Functional Requirements

### NFR-ED-01: Performance
- Video playback must be smooth (no frame drops from subtitle overlay)
- Subtitle table supports up to 500+ cues without noticeable lag
- Save operation completes in < 1 second for typical projects

### NFR-ED-02: Data Integrity
- Save is atomic: either all changes persist or none (no partial writes)
- Unsaved changes indicator (e.g., dot on tab or "Unsaved" badge)

### NFR-ED-03: UX
- Responsive layout that adapts to window resize
- Keyboard shortcuts: Space = play/pause, Ctrl+S = save
- Visual feedback on save (success toast/indicator)

---

## Data Model Changes

### project.json Extension
```json
{
  "schema_version": 2,
  "...existing fields...": "...",
  "editor_style": {
    "id": "preset-id",
    "fontFamily": "system-ui",
    "fontSize": 22,
    "textColor": "#fbbf24",
    "bgColor": "#dc2626",
    "bgShape": "rounded",
    "position": "bottom",
    "bgOpacity": 92
  },
  "editor_overlays": {
    "max_instances_per_type": 5,
    "items": [
      {
        "id": "overlay-1",
        "type": "background_overlay",
        "enabled": true,
        "config": { "color": "#000000", "opacity": 50 },
        "position": { "x": 0, "y": 0 },
        "size": { "width": 1920, "height": 1080 }
      },
      {
        "id": "overlay-2",
        "type": "text",
        "enabled": true,
        "config": { "text": "Sample", "fontFamily": "system-ui", "fontSize": 18, "color": "#ffffff" },
        "position": { "x": 100, "y": 50 },
        "size": { "width": 200, "height": 40 }
      },
      {
        "id": "overlay-3",
        "type": "logo",
        "enabled": false,
        "config": { "path": "/path/to/logo.png", "opacity": 80 },
        "position": { "x": 10, "y": 10 },
        "size": { "width": 120, "height": 60 }
      }
    ]
  }
}
```

### subtitles.json Extension
Each cue may be edited:
```json
[
  {
    "id": "cue-1",
    "start_time": 2.65,
    "end_time": 5.98,
    "original_text": "又谁晚。",
    "translated_text": "Ai nữa vậy?",
    "is_new": false
  }
]
```
- `is_new`: marks user-added cues (not from STT)

---

## Backend Tauri Commands (Phase 1)

| Command | Purpose |
|---|---|
| `load_editor_project(project_id)` | Load project.json + subtitles.json for editor |
| `save_editor_project(project_id, subtitles, style, overlays)` | Atomic save of edited data |
| `get_recent_project()` | Return most recently processed project ID |
| `list_editor_projects()` | Return list of projects available for editing |

---

## Out of Scope (Phase 2)
- FFmpeg video rendering/export
- TTS audio generation via sidecar
- Overlay rendering on video viewport (only persist settings)
- "Tạo lại âm thanh" actual functionality
- "Xuất Video" actual functionality
