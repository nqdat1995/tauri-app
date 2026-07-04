# Application Design — Video Editor Feature (Consolidated)

## Architecture Summary

The Video Editor feature follows the existing Tauri app pattern: **Frontend (React/TS) ↔ Tauri IPC ↔ Backend (Rust) ↔ Local Filesystem**.

Key architectural decisions:
- **Backend**: New `editor/` module (commands, models, validation) + extend existing `storage.rs`
- **Frontend**: Zustand store for state management, `react-rnd` for overlay drag/resize
- **Communication**: 4 new Tauri IPC commands (CRUD for editor data)
- **Navigation**: App-level shared state for `activeEditorProjectId`
- **Persistence**: Manual save (user clicks "Lưu"), project.json + subtitles.json per project

---

## Component Overview (13 components)

### Backend (Rust) — 5 components
| # | Component | Purpose |
|---|-----------|---------|
| 1 | `editor/mod.rs` | Module root |
| 2 | `editor/models.rs` | EditorStyle, OverlayItem, SubtitleCue structs |
| 3 | `editor/commands.rs` | 4 Tauri command handlers |
| 4 | `editor/validation.rs` | Input validation (timing, style ranges, overlay limits) |
| 5 | `storage.rs` (extended) | 6 new methods for editor file I/O |

### Frontend (React/TS) — 8 components
| # | Component | Purpose |
|---|-----------|---------|
| 6 | `EditorStore` (Zustand) | Global editor state + actions |
| 7 | `Editor` page | Layout orchestrator |
| 8 | `EditorToolbar` | Project info + Save/Export buttons |
| 9 | `VideoPlayer` | Video playback + subtitle overlay |
| 10 | `SubtitleTable` | Editable subtitle list |
| 11 | `StylePanel` | Subtitle style presets + fine-tuning |
| 12 | `OverlayPanel` | Overlay effects management (buttons, list, config) |
| 13 | `OverlayViewport` | Drag/resize overlay items on video (react-rnd) |

---

## New Dependencies
| Package | Layer | Purpose |
|---------|-------|---------|
| `zustand` ^5.x | Frontend | State management |
| `react-rnd` ^10.x | Frontend | Draggable + resizable overlay items |

---

## Data Model Extensions

### project.json (new fields)
```json
{
  "editor_style": { "id", "fontFamily", "fontSize", "textColor", "bgColor", "bgShape", "position", "bgOpacity" },
  "editor_overlays": { "max_instances_per_type": 5, "items": [{ "id", "type", "enabled", "config", "position", "size" }] }
}
```

### subtitles.json (new field per cue)
```json
{ "id", "start_time", "end_time", "original_text", "translated_text", "is_new": false }
```

---

## Key Interaction Flows

### Load Project
```
Tab open → get_recent_project → load_editor_project(id) → populate store → render UI
Missing video → error dialog → redirect to History
```

### Edit + Save
```
User edits (in-memory, isDirty=true) → clicks "Lưu" → validate → atomic write → isDirty=false
```

### Navigate Away with Unsaved Changes
```
Tab switch → if isDirty → dialog ("Lưu & rời" / "Rời mà không lưu" / "Hủy")
```

### History → Editor
```
History "Chỉnh sửa" click → set activeEditorProjectId → switch tab to "editor" → Editor loads project
```

---

## Design Artifacts
- [components.md](./components.md) — Full component definitions
- [component-methods.md](./component-methods.md) — Method signatures per component
- [services.md](./services.md) — Service layer and data flow
- [component-dependency.md](./component-dependency.md) — Dependency matrix and integration points
