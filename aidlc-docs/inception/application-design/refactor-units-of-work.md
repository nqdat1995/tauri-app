# Units of Work — Video Editor Refactoring (Foundation)

> Ngày: 2026-07-07
> Total Units: 6 (sequential execution)

---

## Dependency Graph

```text
Unit 1: Project Model
    │
    ├──→ Unit 2: Asset Registry + Style System
    │        │
    │        ▼
    ├──→ Unit 3: Coordinate Space (Viewport)
    │        │
    │        ▼
    ├──→ Unit 4: Scene Graph (Builder + Nodes)
    │        │
    │        ▼
    └──→ Unit 5: Migration Adapter + Store Refactor
             │
             ▼
         Unit 6: Renderer Adapter (HTMLRenderer) + Integration
```

---

## Unit 1: Project Model (Types + Defaults)

**Scope**: Định nghĩa toàn bộ interfaces và factory functions cho Project Model.

**Files to CREATE**:
| File | Nội dung |
|------|----------|
| `src/pages/Editor/model/types.ts` | All interfaces: Project, ProjectMetadata, CoordinateSpace, Point, Size, Transform, Asset, AssetMetadata, Track, EditorObject, ObjectConfig variants, EditorStyle, ProjectSettings, SubtitlePosition |
| `src/pages/Editor/model/defaults.ts` | Factory functions: createProject(), createObject(), createTrack(), createStyle(), getDefaultTransform(), getDefaultConfig() |
| `src/pages/Editor/model/index.ts` | Re-exports |

**Dependencies**: None (pure types, no runtime deps)

**FRs Covered**: FR-RF-01, FR-RF-02, FR-RF-04, FR-RF-05, FR-RF-08

**Tiêu chí hoàn thành**:
- `tsc --noEmit` PASS
- All interfaces match Application Design spec
- Factory functions produce valid default Project

---

## Unit 2: Asset Registry + Style System

**Scope**: Asset CRUD operations + Style management utilities.

**Files to CREATE**:
| File | Nội dung |
|------|----------|
| `src/pages/Editor/assets/AssetRegistry.ts` | Functions: addAsset(), removeAsset(), findAsset(), createVideoAsset(), createImageAsset() |
| `src/pages/Editor/assets/index.ts` | Re-exports |

**Style utilities integrated into model/defaults.ts** (already in Unit 1 scope, extended here):
- `createSubtitleStyle()`, `createTextStyle()`
- Convert existing PRESET_STYLES → EditorStyle format

**Dependencies**: Unit 1 (model/types)

**FRs Covered**: FR-RF-06, FR-RF-07

**Tiêu chí hoàn thành**:
- `tsc --noEmit` PASS
- addAsset returns valid Asset with generated ID
- createVideoAsset / createImageAsset work correctly
- Presets converted to new EditorStyle format

---

## Unit 3: Coordinate Space (Viewport)

**Scope**: Viewport abstraction + coordinate conversion utilities.

**Files to CREATE**:
| File | Nội dung |
|------|----------|
| `src/pages/Editor/viewport/types.ts` | Viewport interface |
| `src/pages/Editor/viewport/viewport.ts` | createViewport(), updateViewport(container, videoAspect) |
| `src/pages/Editor/viewport/convert.ts` | projectToScreen(point, viewport), screenToProject(point, viewport), scaleSize() |
| `src/pages/Editor/viewport/index.ts` | Re-exports |

**Dependencies**: Unit 1 (model/types — Point, Size, CoordinateSpace)

**FRs Covered**: FR-RF-08, FR-RF-09

**Tiêu chí hoàn thành**:
- `tsc --noEmit` PASS
- projectToScreen(960, 540) with 960×540 viewport → (480, 270)
- screenToProject(480, 270) with 960×540 viewport → (960, 540)
- Viewport correctly handles letterboxing (16:9 video in non-16:9 container)

---

## Unit 4: Scene Graph (Builder + Nodes)

**Scope**: Scene node types + Scene Builder function.

**Files to CREATE**:
| File | Nội dung |
|------|----------|
| `src/pages/Editor/scene/types.ts` | SceneNode, SceneNodeType, ScreenTransform, SceneNodeData variants, SceneGraph |
| `src/pages/Editor/scene/nodes.ts` | Factory: createVideoNode(), createTextNode(), createGroupNode(), createImageNode(), createBlurNode(), createMirrorNode(), createBackgroundNode() |
| `src/pages/Editor/scene/builder.ts` | buildScene(project, currentTime, viewport): SceneGraph — visibility filter + style resolve + coord convert + node tree |
| `src/pages/Editor/scene/index.ts` | Re-exports |

**Dependencies**: Unit 1 (model/types), Unit 3 (viewport/convert)

**FRs Covered**: FR-RF-10, FR-RF-11

**Tiêu chí hoàn thành**:
- `tsc --noEmit` PASS
- buildScene filters objects by currentTime correctly
- Subtitle → GroupNode(BackgroundNode + TextNode) correctly resolved
- Style resolved via styleId lookup
- Positions converted from design → screen coords

---

## Unit 5: Migration Adapter + Store Refactor

**Scope**: Legacy format converters + refactored Zustand store using Project Model.

**Files to CREATE**:
| File | Nội dung |
|------|----------|
| `src/pages/Editor/adapter/legacy.ts` | legacyToProject(data: EditorProjectData): Project, projectToLegacy(project: Project): SaveEditorRequest |
| `src/pages/Editor/adapter/index.ts` | Re-exports |

**Files to MODIFY**:
| File | Changes |
|------|---------|
| `src/pages/Editor/store.ts` | Rewrite store state to EditorStoreState (project: Project). Actions operate on project.objects/styles/assets. loadProject uses adapter. saveProject uses adapter. |
| `src/pages/Editor/mockData.ts` | Update mock data to new Project format |

**Dependencies**: Unit 1, Unit 2, Unit 3, Unit 4

**FRs Covered**: FR-RF-01, FR-RF-03, FR-RF-13

**Tiêu chí hoàn thành**:
- `tsc --noEmit` PASS
- legacyToProject converts old EditorProjectData → valid Project
- projectToLegacy converts Project → valid SaveEditorRequest
- Store exposes new actions (addObject, updateObject, etc.)
- Existing loadProject/saveProject flow works via adapters

---

## Unit 6: Renderer Adapter (HTMLRenderer) + Integration

**Scope**: Formal Renderer interface + HTMLRenderer implementation + wire everything together in components.

**Files to CREATE**:
| File | Nội dung |
|------|----------|
| `src/pages/Editor/renderer/types.ts` | Renderer interface |
| `src/pages/Editor/renderer/HTMLRenderer.tsx` | HTMLRenderer: render(scene) → React elements using existing CSS + react-rnd. Migrates current VideoPlayer rendering logic. |
| `src/pages/Editor/renderer/index.ts` | Re-exports |

**Files to MODIFY**:
| File | Changes |
|------|---------|
| `src/pages/Editor/VideoPlayer.tsx` | Refactor: use buildScene + HTMLRenderer. Remove inline store reads for overlay data. Keep video element + playback controls + bounds calculation. Delegate overlay/subtitle rendering to HTMLRenderer. |
| `src/pages/Editor/OverlayPanel.tsx` | Update: read/write via project.objects instead of flat overlays state |
| `src/pages/Editor/SubtitleTable.tsx` | Update: read/write subtitle objects from project.objects |
| `src/pages/Editor/StylePanel.tsx` | Update: read/write project.styles, support Apply All toggle |
| `src/pages/Editor/index.tsx` | Minor: pass viewport context if needed |
| `src/pages/Editor/types.ts` | Keep as thin re-export from model/types for backward compat |

**Files to DELETE (or deprecate)**:
| File | Reason |
|------|--------|
| `src/pages/Editor/OverlayViewport.tsx` | Merged into HTMLRenderer |

**Dependencies**: ALL previous units (1-5)

**FRs Covered**: FR-RF-12, NFR-RF-02

**Tiêu chí hoàn thành**:
- `tsc --noEmit` PASS
- `cargo check` PASS (backend unaffected)
- App starts, editor page loads project correctly
- Subtitles display at correct positions
- Overlays render identically to before refactor
- Drag/resize overlays work (positions persist in design coords)
- Fullscreen/resize does NOT corrupt positions
- Save/load round-trip works (legacy format via adapter)
- CSS unchanged, visual output identical

---

## Summary Table

| Unit | Files Created | Files Modified | Dependencies | Estimated Complexity |
|------|:---:|:---:|---|---|
| 1 — Project Model | 3 | 0 | None | Low |
| 2 — Asset + Style | 2 | 0 | Unit 1 | Low |
| 3 — Viewport | 4 | 0 | Unit 1 | Low |
| 4 — Scene Graph | 4 | 0 | Units 1, 3 | Medium |
| 5 — Adapter + Store | 2 | 2 | Units 1-4 | High |
| 6 — Renderer + Integration | 3 | 6 (+ 1 delete) | Units 1-5 | High |

**Total new files**: 18
**Total modified files**: 8
**Total deleted files**: 1

---

*Awaiting user approval before proceeding to CONSTRUCTION — Code Generation Unit 1.*
