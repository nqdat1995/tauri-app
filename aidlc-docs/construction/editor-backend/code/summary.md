# Unit 3: editor-backend — Code Summary

## Files Created
| File | Purpose |
|------|---------|
| `src-tauri/src/editor/mod.rs` | Module declaration (commands, models, validation) |
| `src-tauri/src/editor/models.rs` | Rust structs: SubtitleCue, EditorStyle, OverlayItem, EditorOverlays, SaveEditorRequest, EditorProjectResponse, ProjectSummary |
| `src-tauri/src/editor/commands.rs` | 4 Tauri commands: load_editor_project, save_editor_project, get_recent_project, list_editor_projects |
| `src-tauri/src/editor/validation.rs` | Validation: validate_subtitles (timing ranges), validate_style (size/opacity), validate_overlays (max instances) |

## Files Modified
| File | Changes |
|------|---------|
| `src-tauri/src/lib.rs` | Added `mod editor;`, imported 4 commands, registered in invoke_handler |

## Tauri Commands Registered
| Command | Description |
|---------|-------------|
| `load_editor_project` | Reads project.json + subtitles.json, checks video existence |
| `save_editor_project` | Validates + writes subtitles.json + updates project.json (style, overlays, timestamp) |
| `get_recent_project` | Scans projects/ directory, returns most recently modified project ID |
| `list_editor_projects` | Lists all projects with name/status/updated_at for picker |

## Validation Rules
- **Subtitles**: id required, start_time < end_time, non-negative times
- **Style**: fontSize 1-200, bgOpacity 0-100, valid bgShape/position values
- **Overlays**: max instances per type enforced (default 5)

## Build Verification
- `cargo check`: PASS (0 errors, 0 warnings)
- Frontend `tsc --noEmit`: PASS
- Frontend `vite build`: PASS

## Integration
- Frontend store calls these commands via `invoke()` (wrappers in `src/lib/tauri.ts`)
- Commands read/write to `~/.tauri-translate-app/projects/{id}/` directory
- Atomic save: writes subtitles.json first, then updates project.json
- Video existence check returns `videoMissing: true` flag for frontend error handling
