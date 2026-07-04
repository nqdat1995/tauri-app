# Component Dependencies — Video Editor Feature

## Dependency Matrix

```
+--------------------+---------------------------+----------------------------+
| Component          | Depends On                | Depended By                |
+--------------------+---------------------------+----------------------------+
| editor/commands.rs | editor/models.rs          | Frontend (Tauri IPC)       |
|                    | editor/validation.rs      |                            |
|                    | storage.rs                |                            |
+--------------------+---------------------------+----------------------------+
| editor/models.rs   | serde, chrono             | editor/commands.rs         |
|                    |                           | editor/validation.rs       |
|                    |                           | storage.rs                 |
+--------------------+---------------------------+----------------------------+
| editor/validation  | editor/models.rs          | editor/commands.rs         |
+--------------------+---------------------------+----------------------------+
| storage.rs (ext)   | editor/models.rs          | editor/commands.rs         |
|                    | serde_json, dirs, fs      |                            |
+--------------------+---------------------------+----------------------------+
| EditorStore        | Tauri invoke (IPC)        | Editor page                |
| (Zustand)          | editor types (TS)         | VideoPlayer                |
|                    |                           | SubtitleTable              |
|                    |                           | StylePanel                 |
|                    |                           | OverlayPanel               |
|                    |                           | OverlayViewport            |
|                    |                           | EditorToolbar              |
+--------------------+---------------------------+----------------------------+
| Editor page        | EditorStore               | App.tsx (renders in main)  |
|                    | VideoPlayer               |                            |
|                    | SubtitleTable             |                            |
|                    | StylePanel                |                            |
|                    | OverlayPanel              |                            |
|                    | EditorToolbar             |                            |
+--------------------+---------------------------+----------------------------+
| VideoPlayer        | EditorStore (time, cues)  | Editor page                |
|                    | OverlayViewport           |                            |
+--------------------+---------------------------+----------------------------+
| SubtitleTable      | EditorStore (cues, time)  | Editor page                |
+--------------------+---------------------------+----------------------------+
| StylePanel         | EditorStore (style)       | Editor page                |
+--------------------+---------------------------+----------------------------+
| OverlayPanel       | EditorStore (overlays)    | Editor page                |
+--------------------+---------------------------+----------------------------+
| OverlayViewport    | EditorStore (overlays)    | VideoPlayer                |
|                    | react-rnd                 |                            |
+--------------------+---------------------------+----------------------------+
| App.tsx            | EditorStore (isDirty)     | —                          |
|                    | Editor, History, Home     |                            |
+--------------------+---------------------------+----------------------------+
| History page       | App-level state           | App.tsx                    |
| (modified)         | (setActiveEditorProject)  |                            |
+--------------------+---------------------------+----------------------------+
```

## New External Dependencies

| Package | Version | Purpose | Layer |
|---------|---------|---------|-------|
| `zustand` | ^5.x | Frontend state management | Frontend |
| `react-rnd` | ^10.x | Drag + Resize overlay items | Frontend |

## Integration with Existing Components

### App.tsx Changes
- Add `activeEditorProjectId` state (lifted)
- Pass setter to History page
- Pass value to Editor page
- Intercept tab changes when editor isDirty (unsaved changes dialog)

### History Page Changes
- Add "Chỉnh sửa" (Edit) button per project row
- On click: set `activeEditorProjectId` + switch tab to "editor"

### Home Page Changes (optional)
- After STT job completes: show "Mở trong trình chỉnh sửa" link
- On click: set `activeEditorProjectId` + switch tab to "editor"

### lib.rs Changes
- Register 4 new Tauri commands
- Add `editor` module to `mod` declarations

## Data Flow Diagram

```
User Action
    |
    v
+------------------+     invoke()     +--------------------+
| Frontend         | ----------------> | Backend (Rust)     |
| EditorStore      |                   | editor/commands.rs |
| (Zustand)        | <---------------- | editor/validation  |
|                  |     Result<T>     | storage.rs         |
+------------------+                   +--------------------+
    |                                          |
    v                                          v
+------------------+                   +--------------------+
| UI Components    |                   | Filesystem         |
| VideoPlayer      |                   | projects/{id}/     |
| SubtitleTable    |                   |   project.json     |
| StylePanel       |                   |   subtitles.json   |
| OverlayPanel     |                   |   media/           |
| OverlayViewport  |                   +--------------------+
+------------------+
```
