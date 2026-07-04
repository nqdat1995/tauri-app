# Unit 2: editor-ui — Code Summary

## Files Created
| File | Purpose |
|------|---------|
| `src/pages/Editor/EditorToolbar.tsx` | Project info, status badge, Save/Export buttons |
| `src/pages/Editor/VideoPlayer.tsx` | HTML5 video playback, controls, seekbar, CSS subtitle overlay |
| `src/pages/Editor/SubtitleTable.tsx` | Editable subtitle table with add/delete, active highlight |
| `src/pages/Editor/StylePanel.tsx` | Style/Overlay tabs, preset grid, font settings |
| `src/pages/Editor/OverlayPanel.tsx` | Effect buttons, active list, eye toggle, per-type config |
| `src/pages/Editor/OverlayViewport.tsx` | react-rnd drag/resize overlay items on video viewport |
| `src/pages/Editor/index.tsx` | Main page layout (3-panel), project loading, error handling |
| `src/pages/Editor/editor.css` | Complete styling for all editor components |

## Files Modified
| File | Changes |
|------|---------|
| `src/App.tsx` | Added activeEditorProjectId state, unsaved changes dialog, conditional rendering |
| `src/pages/History/index.tsx` | Added onOpenInEditor prop, "Chỉnh sửa" button per completed project |
| `src/components/Sidebar.tsx` | Added isDirty prop, dirty dot indicator on editor tab |
| `src/styles.css` | Added sidebar-dirty-dot animation + history-edit-btn styles |

## Dependencies Added
| Package | Version |
|---------|---------|
| `react-rnd` | ^10.x |

## Component Architecture
```
Editor page (index.tsx)
├── EditorToolbar — status + save + disabled export
├── editor-video-area (relative container)
│   ├── VideoPlayer — <video> + controls + subtitle overlay
│   └── OverlayViewport — react-rnd items (drag/resize)
├── SubtitleTable — editable cue list
└── Right Panel
    ├── StylePanel — presets + font settings
    └── OverlayPanel — effect management (when tab = overlay)
```

## Key Interactions
- Video playback syncs with store.currentTime → subtitle overlay + table active row
- Click subtitle row → seekTo → video seeks + overlay updates
- Style changes → immediately reflected in subtitle overlay
- Overlay drag/resize → store.updateOverlay → position/size persisted
- Save button → store.saveProject (will call backend in Unit 3)
- Tab switch with isDirty → confirm dialog
- History "Chỉnh sửa" → sets projectId → switches to editor tab

## Build Verification
- `tsc --noEmit`: PASS (0 errors)
- `vite build`: PASS (built in 1.13s)
