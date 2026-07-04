# Code Generation Plan — Unit 2: editor-ui

## Unit Context
- **Unit Name**: editor-ui
- **Layer**: Frontend (React/TypeScript/CSS)
- **Purpose**: Complete editor UI — all visual components, video playback, overlay drag/resize, navigation integration
- **Dependencies**: Unit 1 (editor-store) — types, store, constants, mock data
- **Provides to**: Unit 3 (defines what backend must produce)

## Stories Covered
- FR-ED-01: Load project on mount, show metadata
- FR-ED-02: Video playback (play/pause, seek, controls)
- FR-ED-03: Subtitle overlay on video (CSS-based, synced to time)
- FR-ED-04: Subtitle table (read/edit)
- FR-ED-05: Add new subtitle button
- FR-ED-06: Delete subtitle button
- FR-ED-07: Save button (manual save)
- FR-ED-08: Style panel (presets + fine-tuning)
- FR-ED-09: Overlay panel (add effects, config, drag/resize on viewport)
- FR-ED-10: Editor toolbar (metadata, status, actions)
- FR-ED-11: History → Editor navigation + auto-load recent

## Code Location
- **Workspace root**: `/Users/maiphan/n8n/tauri-app/`
- **Target directory**: `src/pages/Editor/`
- **Files to modify**: `src/App.tsx`, `src/pages/History/index.tsx`, `src/components/Sidebar.tsx`
- **New dependency**: `react-rnd` (drag + resize)

---

## Generation Steps

### Step 1: Install react-rnd dependency
- [ ] Run `npm install react-rnd`

### Step 2: Create EditorToolbar component
- [ ] Create `src/pages/Editor/EditorToolbar.tsx`
- Status badge, filename, metadata, Save button, disabled Export/Audio buttons
- Uses store: project metadata, isDirty, saveProject action
- data-testid attributes on interactive elements

### Step 3: Create VideoPlayer component
- [ ] Create `src/pages/Editor/VideoPlayer.tsx`
- HTML5 video with asset:// src
- Playback controls (play/pause, skip, volume, fullscreen)
- Seekbar/timeline with drag handle
- Subtitle overlay (CSS positioned div, styled per activeStyle)
- Uses store: currentTime, setCurrentTime, seekTo, setPlaying, activeCue, activeStyle

### Step 4: Create SubtitleTable component
- [ ] Create `src/pages/Editor/SubtitleTable.tsx`
- Tab bar ("Phụ đề" + export status)
- Table: TIME | VĂN BẢN GỐC | VĂN BẢN DỊCH | actions
- Inline editing (contentEditable)
- Add new subtitle button
- Active cue highlight
- Click row → seekTo
- Uses store: subtitles, currentTime, updateSubtitle, addSubtitle, deleteSubtitle, seekTo

### Step 5: Create StylePanel component
- [ ] Create `src/pages/Editor/StylePanel.tsx`
- Style/Overlay tab toggle
- Preset grid (selectable cards with preview)
- Font settings (family, size, color, bg, shape, position, opacity)
- Uses store: activeStyle, updateStyle, selectPreset

### Step 6: Create OverlayPanel component
- [ ] Create `src/pages/Editor/OverlayPanel.tsx`
- Effect type buttons (add to list)
- Active effects list with eye icon toggle
- Config panel per selected effect
- Max instances enforcement (disabled button when limit reached)
- Uses store: overlays, addOverlay, removeOverlay, updateOverlay, toggleOverlay

### Step 7: Create OverlayViewport component
- [ ] Create `src/pages/Editor/OverlayViewport.tsx`
- react-rnd powered drag/resize boxes on video viewport
- Position/size sync with store
- Selected item highlight
- Uses store: overlays.items, updateOverlay

### Step 8: Create main Editor page (full layout)
- [ ] Rewrite `src/pages/Editor/index.tsx`
- 3-panel layout: main (toolbar + video + subtitles) + right (style/overlay)
- Load project on mount (loadRecentProject or from prop)
- Error handling: VIDEO_MISSING → error dialog → redirect to History
- Connects all sub-components to store

### Step 9: Create editor.css
- [ ] Create `src/pages/Editor/editor.css`
- Full styling for all editor components
- Follows existing design system (CSS variables)
- Responsive layout

### Step 10: Modify App.tsx for navigation integration
- [ ] Modify `src/App.tsx`
- Add `activeEditorProjectId` state
- Pass to Editor page as prop
- Unsaved changes dialog (confirm before tab switch when isDirty)
- Pass setActiveEditorProjectId to History page

### Step 11: Modify History page
- [ ] Modify `src/pages/History/index.tsx`
- Add "Chỉnh sửa" (Edit) button per project row
- On click: setActiveEditorProjectId + switch tab to "editor"

### Step 12: Modify Sidebar for dirty indicator
- [ ] Modify `src/components/Sidebar.tsx`
- Show dot indicator on "Trình chỉnh sửa" tab when isDirty

### Step 13: Build verification
- [ ] Run `tsc --noEmit` — must pass
- [ ] Run `vite build` — must succeed

### Step 14: Documentation Summary
- [ ] Create `aidlc-docs/construction/editor-ui/code/summary.md`

---

## Estimated Scope
- **New files**: 8 (EditorToolbar, VideoPlayer, SubtitleTable, StylePanel, OverlayPanel, OverlayViewport, index.tsx rewrite, editor.css)
- **Modified files**: 3 (App.tsx, History/index.tsx, Sidebar.tsx)
- **New dependency**: react-rnd
- **Total steps**: 14
