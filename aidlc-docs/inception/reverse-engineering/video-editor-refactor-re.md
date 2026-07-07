# Reverse Engineering — Video Editor (Pre-Refactor)

## Ngày: 2026-07-07

---

## 1. Tổng quan kiến trúc hiện tại

### Frontend (src/pages/Editor/)
| File | Vai trò |
|------|---------|
| types.ts | Định nghĩa interfaces: SubtitleCue, SubtitleStyle, OverlayItem, EditorProject, EditorState, EditorActions |
| store.ts | Zustand store — single flat store chứa toàn bộ state + actions |
| constants.ts | Presets (styles, overlay types), default values |
| mockData.ts | Mock data cho development ngoài Tauri |
| index.tsx | Page layout orchestrator — load project, error boundary |
| VideoPlayer.tsx | Core renderer: video playback + overlay rendering + subtitle + coordinate conversion |
| OverlayViewport.tsx | Alternative overlay renderer (không dùng trong main flow) |
| OverlayPanel.tsx | UI config panel cho overlays |
| SubtitleTable.tsx | Bảng subtitle CRUD |
| StylePanel.tsx | Panel chỉnh style subtitle |
| EditorToolbar.tsx | Toolbar (save, export, project info) |
| editor.css | CSS toàn bộ editor |

### Backend (src-tauri/src/editor/)
| File | Vai trò |
|------|---------|
| models.rs | Rust structs cho serialize/deserialize |
| commands.rs | Tauri commands: load_editor_project, save_editor_project, get_recent_project, list_editor_projects |
| validation.rs | Validate subtitles, style, overlays trước khi save |
| mod.rs | Module re-exports |

---

## 2. Vấn đề kiến trúc hiện tại

### 2.1 State rải rác trong Component

**VideoPlayer.tsx** chứa state cục bộ:
- `subPos` — vị trí subtitle (viewport pixels)
- `subInit` — flag khởi tạo subtitle position
- `bounds` — kích thước video viewport
- `guides` — hiển thị guides
- `muted` — mute state
- `mirrorCanvasRefs` — map các canvas cho mirror effect
- `prevBoundsRef` — bounds trước đó (dùng cho proportional scaling)

→ **Position của subtitle không nằm trong Project/Store, mà nằm trong Component state.**

### 2.2 Coordinate Space không nhất quán

Hiện tại:
- Overlay: lưu position/size trong hệ **1920×1080** (design coordinate)
- Subtitle: vị trí là **viewport pixels** (component state `subPos`), được proportionally scale khi bounds thay đổi
- Conversion: thực hiện inline tại VideoPlayer (`scaleX = bounds.w / 1920`)

Vấn đề:
- Subtitle position không lưu trong hệ 1920×1080 giống overlay
- Không có abstraction layer cho coordinate conversion
- Fullscreen/resize yêu cầu logic scale riêng cho subtitle vs overlay

### 2.3 Renderer đọc trực tiếp store

**VideoPlayer.tsx** import trực tiếp `useEditorStore` và:
- Đọc `overlays.items`, `activeStyle`, `project`, `currentTime`
- Thực hiện visibility filtering (text overlay startTime/endTime)
- Thực hiện coordinate conversion
- Render visual elements
- Handle interactions (drag, resize, seek, play/pause)

→ **Không có lớp trung gian (Scene Graph) giữa data và renderer.**

### 2.4 Style gắn liền với rendering

- `SubtitleStyle` chỉ có 1 instance (`activeStyle`) — apply cho tất cả subtitles
- Overlay config chứa style properties trực tiếp (text: color, fontSize, bgColor, bgShape, bgOpacity)
- Không có hệ thống Style ID → Style Definition tách biệt

### 2.5 Flat store không phân chia

Store hiện tại:
```
EditorState {
  project, subtitles, activeStyle, overlays,
  currentTime, isPlaying,
  isDirty, isLoading, error
}
```

→ Mọi thứ nằm cùng cấp, không có khái niệm Track, Timeline, hay Asset.

---

## 3. Luồng dữ liệu hiện tại

```text
Load Project (Tauri command)
       ↓
Store (project, subtitles, activeStyle, overlays)
       ↓
Components đọc trực tiếp store
       ↓
VideoPlayer tự scale coordinates + filter visibility + render
       ↓
react-rnd handle drag/resize → inverse scale → updateOverlay(store)
```

### Interaction Flow (drag overlay):
```text
Mouse drag
  → react-rnd onDragStop (viewport px)
  → Inverse scale: x / scaleX, y / scaleY → 1920×1080
  → store.updateOverlay(id, { position: {x, y} })
  → React re-render
  → VideoPlayer re-reads store → re-render Rnd
```

### Subtitle Drag Flow:
```text
Mouse drag
  → react-rnd onDragStop → snap()
  → setSubPos(viewport px)     ← LOCAL STATE, NOT IN STORE
  → Khi fullscreen/resize: proportional scale via prevBoundsRef
```

---

## 4. Persistence Flow

```text
Save Button
  → store.saveProject()
  → { subtitles, style, overlays } → Tauri save_editor_project
  → Backend writes subtitles.json + updates project.json (editor_style, editor_overlays)
```

**Không lưu:**
- Subtitle position (viewport-relative, local state)
- Timeline state (currentTime ephemeral)
- Mirror canvas state (runtime only)

---

## 5. Kết luận — Scope refactoring

| Vấn đề | Phase giải quyết |
|---------|-----------------|
| State rải rác (subtitle pos) | Phase 1 — Project Model |
| Thiếu Asset/Track/Timeline | Phase 1 — Project Model |
| Style gắn Object | Phase 1 — Project Model |
| Coordinate không nhất quán | Phase 2 — Coordinate Space |
| Subtitle dùng viewport px | Phase 2 — Coordinate Space |
| Renderer đọc store trực tiếp | Phase 3 — Scene Graph |
| Visibility filtering inline | Phase 3 — Scene Graph |
| Style resolution inline | Phase 3 — Scene Graph |

---

## 6. Ràng buộc

- HTML/CSS/react-rnd **KHÔNG thay đổi** (giao diện giữ nguyên)
- VideoPlayer vẫn là renderer chính
- Backend (Rust) chỉ cần cập nhật serialize format nếu Project Model thay đổi
- Backward compatible: load được project cũ (migration)
