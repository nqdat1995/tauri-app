# Units of Work — Video Editor Feature

## Unit Decomposition

3 units, implemented sequentially (Frontend-first approach):

---

## Unit 1: Frontend Store + Types

**Name**: `editor-store`  
**Layer**: Frontend (TypeScript)  
**Purpose**: Foundation layer — Zustand store, TypeScript types, Tauri invoke wrappers, mock data

**Components**:
- `src/pages/Editor/types.ts` — TypeScript interfaces (SubtitleCue, SubtitleStyle, OverlayItem, EditorProject, etc.)
- `src/pages/Editor/store.ts` — Zustand EditorStore (state + actions)
- `src/pages/Editor/constants.ts` — Preset styles, overlay type config (MAX_INSTANCES=5), defaults
- `src/lib/tauri.ts` (extend) — Add editor invoke wrappers (loadEditorProject, saveEditorProject, getRecentProject, listEditorProjects)
- `src/pages/Editor/mockData.ts` — Mock project data for development without backend

**Deliverables**:
- Complete TypeScript type definitions matching backend models
- Zustand store with all actions (loadProject, saveProject, CRUD subtitles, style, overlays)
- isDirty tracking, currentTime state, derived activeCue
- Tauri command wrappers (will call mock until Unit 3 connects real backend)
- Mock data that matches the mockup screenshot

---

## Unit 2: Frontend UI

**Name**: `editor-ui`  
**Layer**: Frontend (React/TypeScript/CSS)  
**Purpose**: Complete editor UI — all visual components, video playback, overlay drag/resize, navigation integration

**Components**:
- `src/pages/Editor/index.tsx` — Main page layout (connects store ↔ components)
- `src/pages/Editor/EditorToolbar.tsx` — Project info + Save + disabled Export/Audio buttons
- `src/pages/Editor/VideoPlayer.tsx` — HTML5 video + controls + CSS subtitle overlay
- `src/pages/Editor/SubtitleTable.tsx` — Editable subtitle table + add/delete
- `src/pages/Editor/StylePanel.tsx` — Style presets + font settings
- `src/pages/Editor/OverlayPanel.tsx` — Effect buttons + active list + config panel
- `src/pages/Editor/OverlayViewport.tsx` — react-rnd drag/resize layer on video
- `src/pages/Editor/editor.css` — All editor styling
- `src/App.tsx` (modify) — Add activeEditorProjectId state, unsaved changes dialog
- `src/pages/History/index.tsx` (modify) — Add "Chỉnh sửa" button per row
- `src/components/Sidebar.tsx` (modify) — Dirty indicator dot on editor tab
- Install dependencies: `zustand`, `react-rnd`

**Deliverables**:
- Complete editor UI matching mockup design
- Real video playback with asset:// protocol
- Live subtitle overlay synced to playback time
- Overlay items with drag/resize (react-rnd)
- Unsaved changes dialog on navigation
- History → Editor navigation working
- All CSS styled per existing design system

---

## Unit 3: Backend (Rust)

**Name**: `editor-backend`  
**Layer**: Backend (Rust/Tauri)  
**Purpose**: Tauri commands, validation, storage operations — connects frontend to real filesystem

**Components**:
- `src-tauri/src/editor/mod.rs` — Module declaration
- `src-tauri/src/editor/models.rs` — Rust structs (EditorStyle, OverlayItem, SubtitleCue, SaveEditorRequest, etc.)
- `src-tauri/src/editor/commands.rs` — 4 Tauri command handlers
- `src-tauri/src/editor/validation.rs` — Input validation (timing, style ranges, overlay limits)
- `src-tauri/src/storage.rs` (extend) — 6 new methods for editor file I/O
- `src-tauri/src/lib.rs` (modify) — Register 4 new commands + add editor module
- `src-tauri/src/commands/mod.rs` (modify) — Re-export editor commands

**Deliverables**:
- 4 working Tauri commands callable from frontend
- Basic validation (required fields, timing ranges, style constraints)
- Atomic save (project.json + subtitles.json)
- Video file existence check with error response
- Frontend switches from mock to real backend (remove mock fallback)
- `cargo check` passes

---

## Implementation Order

```
Unit 1 (editor-store) → Unit 2 (editor-ui) → Unit 3 (editor-backend)
         |                      |                       |
   Types + Store          UI Components          Rust Commands
   Mock Data              Video Playback         Validation
   Tauri Wrappers         Overlay Drag/Resize    Storage I/O
                          Navigation             Connect Real Data
```

## Rationale for Frontend-First Approach
- Faster visual feedback — can see UI immediately with mock data
- Design validation — verify UI matches mockup before wiring backend
- Zustand store defines the exact data contract → backend implements to match
- Overlay UX (drag/resize) needs iteration — easier without backend dependency
