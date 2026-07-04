# Unit of Work → Requirements Map — Video Editor Feature

## Mapping: Functional Requirements → Units

| Requirement | Unit 1 (Store) | Unit 2 (UI) | Unit 3 (Backend) |
|-------------|:--------------:|:-----------:|:----------------:|
| FR-ED-01: Load Project into Editor | ✓ (store.loadProject) | ✓ (mount logic) | ✓ (load_editor_project cmd) |
| FR-ED-02: Video Playback | — | ✓ (VideoPlayer) | — |
| FR-ED-03: Subtitle Overlay | ✓ (derived activeCue) | ✓ (CSS overlay on video) | — |
| FR-ED-04: Subtitle Table (Read/Edit) | ✓ (store.updateSubtitle) | ✓ (SubtitleTable) | — |
| FR-ED-05: Add New Subtitle | ✓ (store.addSubtitle) | ✓ (add button UI) | — |
| FR-ED-06: Delete Subtitle | ✓ (store.deleteSubtitle) | ✓ (delete button UI) | — |
| FR-ED-07: Manual Save | ✓ (store.saveProject) | ✓ (Save button) | ✓ (save_editor_project cmd) |
| FR-ED-08: Subtitle Style Config | ✓ (store.updateStyle) | ✓ (StylePanel) | ✓ (persist in project.json) |
| FR-ED-09: Overlay Tab | ✓ (store.overlay actions) | ✓ (OverlayPanel + Viewport) | ✓ (persist in project.json) |
| FR-ED-10: Editor Toolbar | — | ✓ (EditorToolbar) | — |
| FR-ED-11: Navigate History→Editor | ✓ (store.loadProject) | ✓ (App.tsx + History mod) | ✓ (get_recent_project cmd) |

## Mapping: Non-Functional Requirements → Units

| NFR | Unit 1 (Store) | Unit 2 (UI) | Unit 3 (Backend) |
|-----|:--------------:|:-----------:|:----------------:|
| NFR-ED-01: Performance | — | ✓ (efficient render) | ✓ (fast read/write) |
| NFR-ED-02: Data Integrity | — | ✓ (isDirty tracking) | ✓ (atomic write) |
| NFR-ED-03: UX | — | ✓ (keyboard shortcuts, toast, responsive) | — |

## Coverage Verification

- **All 11 FRs mapped**: ✓ (every FR has at least one unit responsible)
- **No orphan requirements**: ✓
- **Primary ownership clear**: Each FR has a primary unit (marked in bold below)

### Primary Ownership
| FR | Primary Unit |
|----|-------------|
| FR-ED-01 | Unit 3 (backend does the loading) |
| FR-ED-02 | Unit 2 (video playback is pure UI) |
| FR-ED-03 | Unit 2 (overlay rendering is UI) |
| FR-ED-04 | Unit 2 (table editing is UI) |
| FR-ED-05 | Unit 1 (store action adds to state) |
| FR-ED-06 | Unit 1 (store action removes) |
| FR-ED-07 | Unit 3 (backend does the persisting) |
| FR-ED-08 | Unit 2 (StylePanel UI is primary) |
| FR-ED-09 | Unit 2 (OverlayPanel UI is primary) |
| FR-ED-10 | Unit 2 (toolbar is pure UI) |
| FR-ED-11 | Unit 2 (navigation is App/UI level) |
