# Code Generation Plan — Unit 1: editor-store

## Unit Context
- **Unit Name**: editor-store
- **Layer**: Frontend (TypeScript)
- **Purpose**: Foundation layer — types, Zustand store, mock data, Tauri invoke wrappers
- **Dependencies**: None (this is the first unit)
- **Provides to**: Unit 2 (editor-ui) — types, store, constants, mock data

## Stories Covered
- FR-ED-01 (partial): store.loadProject action
- FR-ED-03 (partial): derived activeCue from currentTime
- FR-ED-04 (partial): store.updateSubtitle action
- FR-ED-05: store.addSubtitle action
- FR-ED-06: store.deleteSubtitle action
- FR-ED-07 (partial): store.saveProject action
- FR-ED-08 (partial): store.updateStyle, store.selectPreset actions
- FR-ED-09 (partial): store.addOverlay, removeOverlay, updateOverlay, toggleOverlay actions
- FR-ED-11 (partial): store.loadProject accepts projectId

## Code Location
- **Workspace root**: `/Users/maiphan/n8n/tauri-app/`
- **Target directory**: `src/pages/Editor/`
- **Existing files to modify**: `src/lib/tauri.ts` (add editor invoke wrappers)

---

## Generation Steps

### Step 1: Create TypeScript Type Definitions
- [x] Create `src/pages/Editor/types.ts`
- Interfaces: SubtitleCue, SubtitleStyle, OverlayType, OverlayConfig, OverlayItem, EditorOverlays, EditorProject, ProjectSummary, SaveEditorRequest, LoadEditorResponse
- Match backend model shapes exactly
- Add data-testid naming conventions for UI layer

### Step 2: Create Editor Constants
- [x] Create `src/pages/Editor/constants.ts`
- PRESET_STYLES array (10 presets matching mockup)
- OVERLAY_TYPES enum/array with labels and icons
- MAX_OVERLAY_INSTANCES = 5 (configurable)
- DEFAULT_STYLE (initial subtitle style)
- DEFAULT_FONT_OPTIONS array

### Step 3: Create Mock Data
- [x] Create `src/pages/Editor/mockData.ts`
- MOCK_PROJECT: complete EditorProject with realistic data matching mockup
- MOCK_SUBTITLES: 3+ cues with Chinese original + Vietnamese translation
- Simulates what backend `load_editor_project` would return

### Step 4: Create Zustand EditorStore
- [x] Create `src/pages/Editor/store.ts`
- State: project, subtitles, activeStyle, overlays, currentTime, isPlaying, isDirty, isLoading, error
- Actions: loadProject, loadRecentProject, saveProject, updateSubtitle, addSubtitle, deleteSubtitle, updateStyle, selectPreset, addOverlay, removeOverlay, updateOverlay, toggleOverlay, setCurrentTime, seekTo, setPlaying, resetDirty
- Derived: activeCue (computed from currentTime + subtitles)
- Use mock data as fallback when Tauri not available

### Step 5: Extend Tauri Invoke Wrappers
- [x] Modify `src/lib/tauri.ts` — add 4 editor command wrappers:
  - loadEditorProject(projectId: string): Promise<LoadEditorResponse>
  - saveEditorProject(projectId: string, request: SaveEditorRequest): Promise<void>
  - getRecentProject(): Promise<string | null>
  - listEditorProjects(): Promise<ProjectSummary[]>

### Step 6: Documentation Summary
- [x] Create `aidlc-docs/construction/editor-store/code/summary.md`
- List all created/modified files
- Document store API (actions + state shape)
- Note integration points for Unit 2

---

## Estimated Scope
- **New files**: 4 (types.ts, constants.ts, mockData.ts, store.ts)
- **Modified files**: 1 (tauri.ts)
- **Total steps**: 6
