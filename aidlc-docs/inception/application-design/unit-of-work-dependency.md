# Unit of Work Dependencies — Video Editor Feature

## Dependency Matrix

| Unit | Depends On | Provides To |
|------|-----------|-------------|
| Unit 1: editor-store | — (no dependencies) | Unit 2: types, store, mock data |
| Unit 2: editor-ui | Unit 1: store, types | Unit 3: defines data contract |
| Unit 3: editor-backend | Unit 1: type definitions (mirrored) | Unit 2: real data (replaces mock) |

## Dependency Graph

```
+-------------------+
| Unit 1            |
| editor-store      |
| (Types + Zustand) |
+-------------------+
         |
         | provides types, store, mock data
         v
+-------------------+
| Unit 2            |
| editor-ui         |
| (React + CSS)     |
+-------------------+
         |
         | defines data contract (what backend must provide)
         v
+-------------------+
| Unit 3            |
| editor-backend    |
| (Rust + Storage)  |
+-------------------+
```

## Integration Points

### Unit 1 → Unit 2
- Unit 2 imports types from `types.ts`
- Unit 2 uses Zustand store from `store.ts`
- Unit 2 uses mock data during development
- **Contract**: Store shape and action signatures

### Unit 2 → Unit 3
- Unit 3 must produce JSON matching TypeScript types exactly
- Unit 3 command names must match Tauri invoke wrappers from Unit 1
- After Unit 3 is complete: remove mock fallback, connect real commands
- **Contract**: Tauri command input/output shapes

### Shared Dependencies (across units)
- `project.json` schema (editor_style + editor_overlays fields)
- `subtitles.json` schema (with is_new field)
- Tauri command names: `load_editor_project`, `save_editor_project`, `get_recent_project`, `list_editor_projects`

## Integration Verification Checklist
- [ ] After Unit 1: Store compiles, mock data loads, types consistent
- [ ] After Unit 2: Full UI renders with mock data, all interactions work
- [ ] After Unit 3: Backend compiles, frontend switches to real data, save/load works end-to-end
