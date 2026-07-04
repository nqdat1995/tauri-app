# Unit 1: editor-store — Code Summary

## Files Created
| File | Purpose |
|------|---------|
| `src/pages/Editor/types.ts` | TypeScript interfaces (SubtitleCue, SubtitleStyle, OverlayItem, EditorProject, EditorState, EditorActions, etc.) |
| `src/pages/Editor/constants.ts` | Preset styles (10), overlay type config, MAX_OVERLAY_INSTANCES=5, font options, defaults |
| `src/pages/Editor/mockData.ts` | Mock project with 3 subtitle cues, matching mockup data |
| `src/pages/Editor/store.ts` | Zustand EditorStore with 16 actions + 2 derived selectors |
| `src/pages/Editor/index.tsx` | Minimal placeholder page (connects to store, loads project on mount) |

## Files Modified
| File | Changes |
|------|---------|
| `src/lib/tauri.ts` | Added 4 editor invoke wrappers (loadEditorProject, saveEditorProject, getRecentProject, listEditorProjects) |

## Dependencies Added
| Package | Version |
|---------|---------|
| `zustand` | ^5.x |

## Store API (EditorStore)

### State
- `project` — loaded EditorProject or null
- `subtitles` — array of SubtitleCue
- `activeStyle` — current SubtitleStyle
- `overlays` — EditorOverlays (items array + max config)
- `currentTime` — video playback position (seconds)
- `isPlaying` — playback state
- `isDirty` — unsaved changes flag
- `isLoading` — async operation in progress
- `error` — error string or null

### Actions
- `loadProject(projectId)` — load from backend or mock
- `loadRecentProject()` — get most recent + load
- `saveProject()` — persist to backend
- `updateSubtitle(id, field, value)` — edit cue field
- `addSubtitle(afterId?)` — insert new cue
- `deleteSubtitle(id)` — remove cue
- `updateStyle(updates)` — merge style changes
- `selectPreset(presetId)` — apply preset
- `addOverlay(type)` — add overlay item (max check)
- `removeOverlay(id)` — delete overlay
- `updateOverlay(id, updates)` — update overlay config/position/size
- `toggleOverlay(id)` — toggle enabled state
- `setCurrentTime(time)` — from video timeupdate
- `seekTo(time)` — from user action
- `setPlaying(playing)` — toggle playback
- `resetDirty()` — clear dirty flag
- `clearError()` — clear error

### Derived Selectors
- `useActiveCue()` — current subtitle cue based on time
- `useOverlayTypeCount(type)` — count of instances for a type

## Build Verification
- `tsc --noEmit`: PASS (0 errors)
- `vite build`: PASS (built in 1.03s)

## Integration Points for Unit 2
- Import `useEditorStore` and `useActiveCue` from `./store`
- Import types from `./types`
- Import constants/presets from `./constants`
- Store actions handle all business logic — UI just dispatches actions
