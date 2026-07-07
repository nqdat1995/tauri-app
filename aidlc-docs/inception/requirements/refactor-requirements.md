# Requirements — Video Editor Refactoring (Foundation)

> Refactor kiến trúc Editor frontend mà KHÔNG thay đổi giao diện/renderer hiện tại.
> Backend (Rust) giữ nguyên save/load interface.

---

## FR-RF-01: Project Model — Single Source of Truth

**Mô tả**: Toàn bộ dữ liệu editor phải nằm trong một Project Model duy nhất. Không còn state rải rác trong component.

**Chi tiết**:
- Project Model bao gồm: Metadata, Assets, Tracks, Objects, Styles, Settings
- Mọi position/size/config đều lưu trong Project
- Component state chỉ chứa ephemeral UI state (hover, selection, focus)

**Tiêu chí**:
- Không còn `useState` cho position/size trong VideoPlayer
- Store chỉ có 1 `project: Project` + UI state

---

## FR-RF-02: Object System — Subtitle as Object

**Mô tả**: Mỗi subtitle cue là một Object (type: "subtitle") trong Project Model. Overlay items cũng là Objects.

**Chi tiết**:
- Object types: `subtitle`, `background_overlay`, `blur`, `mirror`, `text`, `logo`, `watermark`
- Mỗi Object có: id, type, startTime, endTime, transform (position + size), styleId (optional)
- Subtitle Object chứa thêm: originalText, translatedText, isNew

**Tiêu chí**:
- Subtitle cues nằm trong `project.objects[]` (type: "subtitle")
- Overlay items nằm trong `project.objects[]` (type tương ứng)

---

## FR-RF-03: Subtitle Style — Apply All / Per-Cue

**Mô tả**: Hỗ trợ 2 mode: "Apply All" (tất cả cue dùng chung style/position) và per-cue style (mỗi cue có style riêng).

**Chi tiết**:
- Checkbox "Apply All" trên UI (mặc định: checked)
- Khi Apply All = true: tất cả subtitle objects dùng cùng một styleId
- Khi Apply All = false: mỗi subtitle object có thể override styleId riêng
- Tương tự CapCut

**Tiêu chí**:
- Project Settings có `subtitleApplyAll: boolean`
- UI hiển thị checkbox, khi uncheck cho phép edit style per-cue

---

## FR-RF-04: Subtitle Position — Hybrid (Named + Custom)

**Mô tả**: Subtitle position mặc định là named position (9-grid). Cho phép override bằng design coordinate khi user drag.

**Chi tiết**:
- Default: lấy position từ SubtitleStyle.position (named: "bottom-center", "top-left", etc.)
- Khi user drag subtitle: chuyển sang custom position (x, y trong hệ 1920×1080)
- Object.transform.position có thể là `null` (dùng style default) hoặc `{x, y}` (custom)
- Reset button để quay về named position

**Tiêu chí**:
- Subtitle hiển thị tại named position khi chưa drag
- Sau khi drag, position lưu trong Object.transform (design coordinate)
- Position persist khi save/load

---

## FR-RF-05: Track System — 3 Tracks

**Mô tả**: Project có 3 tracks mặc định: Video, Subtitle, Overlay.

**Chi tiết**:
- Video Track: chứa objectId của video object (1 object duy nhất)
- Subtitle Track: chứa objectIds của tất cả subtitle objects (ordered by startTime)
- Overlay Track: chứa objectIds của tất cả overlay objects
- Track chỉ là ordering/grouping, không chứa data

**Tiêu chí**:
- `project.tracks` là array 3 phần tử
- Track.objectIds reference đến project.objects

---

## FR-RF-06: Style System — Shared Styles

**Mô tả**: Style được tách khỏi Object. Object chỉ lưu styleId reference.

**Chi tiết**:
- Áp dụng cho: subtitle styles + text overlay styles
- Non-text overlays (mirror, blur, background, logo, watermark): config giữ inline trong Object
- `project.styles[]` chứa danh sách style definitions
- Presets (existing) chuyển thành default styles trong project

**Tiêu chí**:
- SubtitleStyle và TextStyle nằm trong `project.styles[]`
- Subtitle Object lưu `styleId` → reference tới style
- Text overlay lưu `styleId` → reference tới style
- CRUD operations cho styles

---

## FR-RF-07: Asset Registry

**Mô tả**: Tạo Asset registry ngay từ đầu. Video, logo, watermark images đều register vào Assets list.

**Chi tiết**:
- Asset types: video, audio, image, font
- Asset: { id, type, source (path/url), metadata (size, duration, dimensions) }
- Object chỉ lưu `assetId` thay vì path trực tiếp
- Video asset: project-level, tạo khi load project
- Image assets: tạo khi user upload logo/watermark

**Tiêu chí**:
- `project.assets[]` chứa danh sách assets
- Logo/Watermark object chỉ lưu `assetId`, không lưu path
- Video object reference assetId
- Chuẩn bị cho: replace, cache, export, preload, hash, thumbnail

---

## FR-RF-08: Coordinate Space — Unified 1920×1080

**Mô tả**: Toàn bộ Editor sử dụng một hệ tọa độ duy nhất (1920×1080). Không phụ thuộc viewport/zoom/fullscreen.

**Chi tiết**:
- `project.metadata.coordinateSpace: { width: 1920, height: 1080 }`
- Mọi Object.transform.position lưu trong hệ này
- Viewport chỉ làm nhiệm vụ coordinate convert (Project ↔ Screen)
- Resize/Fullscreen chỉ thay đổi viewport scale, không sửa Object data

**Tiêu chí**:
- Không còn viewport pixels trong Project/Store
- Convert functions: `projectToScreen(point, viewport)` và `screenToProject(point, viewport)`
- Fullscreen/resize không trigger Object update

---

## FR-RF-09: Viewport Abstraction

**Mô tả**: Viewport là lớp trung gian chuyển đổi giữa design coordinate và screen coordinate.

**Chi tiết**:
- Viewport state: `{ width, height, offsetX, offsetY, scale }`
- Auto-calculated từ container size + video aspect ratio
- Mouse/touch events → viewport coordinate → design coordinate → update Project
- Không lưu viewport state vào Project (ephemeral)

**Tiêu chí**:
- Viewport utilities: `createViewport()`, `updateViewport()`, `toDesign()`, `toScreen()`
- Interaction pipeline: mouse → viewport → project → scene → render
- Subtitle và overlay dùng chung conversion pipeline

---

## FR-RF-10: Scene Graph — Intermediate Layer

**Mô tả**: Scene Graph là lớp trung gian giữa Project và Renderer. Renderer không đọc Project trực tiếp.

**Chi tiết**:
- Scene Builder: nhận Project + currentTime → output Scene Graph
- Scene Graph: tree of nodes representing what to render at current frame
- Rebuild toàn bộ khi store thay đổi (useMemo)
- Visibility filtering: chỉ nodes active tại currentTime

**Tiêu chí**:
- `buildScene(project, currentTime): SceneGraph`
- Renderer nhận SceneGraph, không import store
- Scene rebuild < 1ms cho typical project (10 overlays + 50 subtitles)

---

## FR-RF-11: Scene Node Types — Grouped

**Mô tả**: Scene Graph sử dụng node types theo nhóm chức năng.

**Chi tiết**:
- VideoNode: video playback element
- GroupNode: container cho composite elements (e.g., SubtitleBg + SubtitleText)
- TextNode: rendered text (subtitle text, text overlay)
- ImageNode: rendered image (logo, watermark)
- BlurNode: blur effect
- MirrorNode: mirror canvas effect
- BackgroundNode: background overlay
- Mỗi node có: id, type, transform (screen coords after viewport conversion), visible, children (for GroupNode)

**Tiêu chí**:
- Subtitle render = GroupNode { BackgroundNode + TextNode }
- Text overlay render = GroupNode { BackgroundNode + TextNode }
- Node tree depth ≤ 3

---

## FR-RF-12: Renderer Interface — Formal Abstraction

**Mô tả**: Formal Renderer interface cho phép swap implementation trong tương lai (HTML → Canvas/Konva).

**Chi tiết**:
- Interface: `Renderer { render(scene: SceneGraph, viewport: Viewport): void }`
- Current implementation: HTMLRenderer (JSX + CSS + react-rnd)
- HTMLRenderer giữ nguyên rendering logic hiện tại, chỉ đổi data source từ store → SceneGraph
- Chuẩn bị cho: CanvasRenderer, KonvaRenderer (Phase 2+)

**Tiêu chí**:
- `HTMLRenderer` class/function implement Renderer interface
- Existing CSS/JSX/react-rnd hoạt động không thay đổi
- Giao diện user không thay đổi sau refactor

---

## FR-RF-13: Migration Adapter — Load Legacy Projects

**Mô tả**: Adapter pattern để load project format cũ vào Project Model mới.

**Chi tiết**:
- Read-only compat: load project cũ → convert in-memory → hiển thị bình thường
- Chỉ write format mới khi user bấm Save
- Adapter: `legacyToProject(editorProjectData): Project`
- Reverse: `projectToLegacy(project): SaveEditorRequest` (cho save via existing backend)

**Tiêu chí**:
- Load project cũ (subtitles + editor_style + editor_overlays) hoạt động bình thường
- Save gọi backend với format cũ (adapter convert ngược)
- Không cần thay đổi Rust code

---

## NFR-RF-01: Performance

- Scene Graph rebuild < 1ms cho project với 50 subtitles + 10 overlays
- Coordinate conversion < 0.1ms per point
- No visible jank khi drag/resize overlays

## NFR-RF-02: Backward Compatibility

- Giao diện user KHÔNG thay đổi (pixel-perfect)
- HTML/CSS/react-rnd rendering giữ nguyên
- Backend API calls giữ nguyên format
- Existing tests (nếu có) vẫn pass

## NFR-RF-03: Extensibility

- Thêm Object type mới chỉ cần: define type + add node builder + add renderer case
- Thêm Renderer mới chỉ cần implement Renderer interface
- Asset system ready cho: thumbnail generation, preloading, caching

---

*Document generated: 2026-07-07*
*Based on: refactor-verification-questions.md answers + video-editor-refactor-plan.md*
