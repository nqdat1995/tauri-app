# Requirement Verification Questions — Video Editor Refactoring

> Trả lời các câu hỏi bên dưới để xác nhận hướng refactoring trước khi thiết kế chi tiết.
> Mỗi câu chọn **một** đáp án (A/B/C) hoặc ghi chú tự do.

---

## Q1: Migration Strategy — Project cũ

Khi chuyển sang Project Model mới, các project đã lưu trên ổ đĩa (format cũ) sẽ xử lý thế nào?

- **A** — Auto-migrate: Khi load project cũ, tự động chuyển đổi sang format mới và lưu lại
- **B** — Read-only compat: Load project cũ vẫn hoạt động (convert in-memory), chỉ save khi user bấm Save
- **C** — Breaking change: Không cần backward compat, project cũ tạo lại từ đầu

**Trả lời**: B

---

## Q2: Subtitle Position trong Project Model

Hiện tại subtitle position là component-local state (viewport pixels). Refactor plan yêu cầu mọi position nằm trong Project. Subtitle position nên lưu thế nào?

- **A** — Design coordinate (x, y trong hệ 1920×1080) giống overlay — cho phép drag tự do
- **B** — Named position (9-grid: top-left, bottom-center, etc.) — giữ nguyên cách tiếp cận hiện tại
- **C** — Hybrid: default là named position (từ SubtitleStyle.position), nhưng cho phép override bằng custom (x, y) khi user drag

**Trả lời**: C

---

## Q3: Scope của "Object" trong Project Model

Refactor plan định nghĩa Object bao gồm text, image, shape. Trong context hiện tại, cụ thể "Object" bao gồm những gì?

- **A** — Chỉ overlay items (background, blur, mirror, text, logo, watermark) — subtitle KHÔNG phải Object
- **B** — Overlay items + mỗi subtitle cue cũng là một Object (type: "subtitle")
- **C** — Overlay items + subtitle cue group (1 object đại diện cho toàn bộ subtitle track, chứa cue list bên trong)

**Trả lời**: B
Giao diện liên quan đến subtitle sẽ có thêm 1 checkbox "Apply All" nếu checkbox đã check thì toàn bộ các cue sử dụng chung style/position, ngược lại thì các cue có thể có style riếng (Tương tự Capcut)

---

## Q4: Track Structure

Refactor plan nêu Track chỉ mô tả Timeline (objectIds). Có bao nhiêu track mặc định cho editor hiện tại?

- **A** — 2 tracks: Video track + Overlay track (subtitle nằm trong overlay track)
- **B** — 3 tracks: Video track + Subtitle track + Overlay track
- **C** — Dynamic: tạo track per type (1 video, 1 subtitle, N overlay tracks tùy loại overlay)
- **D** — Không cần Track concept cho Phase 1, chỉ cần flat list of objects + visibility filtering theo time

**Trả lời**: B

---

## Q5: Style System

Refactor plan yêu cầu tách Style khỏi Object (Object chỉ lưu styleId). Áp dụng thế nào cho overlay configs hiện tại?

- **A** — Chỉ áp dụng cho subtitle style (tách thành shared styles). Overlay config giữ nguyên inline trong Object.
- **B** — Áp dụng cho cả subtitle và overlay: text overlay cũng có styleId reference. Nhưng non-text overlays (mirror, blur, logo) giữ config inline.
- **C** — Full style system: mọi visual property đều tách ra style (kể cả blur opacity, background color). Object chỉ lưu styleId.

**Trả lời**: B

---

## Q6: Asset Management

Refactor plan có Asset concept (video, audio, image, font). Hiện tại video path và logo/watermark path nằm trực tiếp trong object config. Nên refactor thế nào?

- **A** — Tạo Asset registry ngay: video, logo, watermark images đều register vào Assets list. Object chỉ lưu assetId.
- **B** — Asset cho video only (project-level). Logo/watermark path giữ inline trong overlay config (vì đơn giản, không cần reuse).
- **C** — Chưa cần Asset concept cho Phase này. Giữ path trực tiếp. Bổ sung Asset registry ở Phase 2 khi có export.

**Trả lời**: A
Asset registry nên làm ngay.
Sau này:
```
replace asset

cache

export

preload

hash

thumbnail
```
đều dùng Asset.

---

## Q7: Scene Graph — Rebuild Strategy

Scene Graph được build lại sau mỗi thay đổi. Cách trigger rebuild?

- **A** — Mỗi khi store thay đổi → useMemo/useEffect rebuild toàn bộ scene (simple, dễ implement)
- **B** — Selective rebuild: chỉ rebuild nodes bị ảnh hưởng bởi action cụ thể (phức tạp hơn, performant hơn)
- **C** — Rebuild theo frame: mỗi requestAnimationFrame rebuild scene dựa trên currentTime (cho animation-ready)

**Trả lời**: A

---

## Q8: Scene Graph Node Types

Dựa trên editor hiện tại, Scene Graph cần những node types nào?

- **A** — Minimal: VideoNode, SubtitleNode, OverlayNode (generic cho mọi overlay type)
- **B** — Per-type: VideoNode, SubtitleNode, TextNode, ImageNode, BlurNode, MirrorNode, BackgroundNode
- **C** — Grouped: VideoNode + GroupNode(SubtitleBg + SubtitleText) + OverlayNode(per-type visual)

**Trả lời**: C
Group phù hợp với subtitle (nền + chữ) và vẫn đủ linh hoạt cho các overlay khác. Không cần quá nhiều loại node chuyên biệt ngay từ đầu, nhưng cũng không nên gom mọi overlay vào một OverlayNode duy nhất vì sẽ làm Scene Graph mất ý nghĩa.

---

## Q9: Renderer Interface

Refactor plan nói "Renderer chỉ nhận Scene Graph". Renderer adapter nên có interface thế nào?

- **A** — React component nhận `SceneNode[]` props, render bằng JSX + CSS hiện tại. Không cần abstraction layer phức tạp.
- **B** — Formal Renderer interface (`render(scene: SceneGraph): void`) + HTMLRenderer implementation. Chuẩn bị cho swap sang Canvas/Konva sau này.
- **C** — Hook-based: `useSceneRenderer(scene)` trả về React elements. Trong tương lai swap implementation bên trong hook.

**Trả lời**: B

---

## Q10: Phạm vi thay đổi Backend (Rust)

Refactor frontend model có cần thay đổi Rust backend không?

- **A** — Không thay đổi backend. Frontend tự convert giữa new Project Model ↔ old save format (adapter pattern).
- **B** — Cập nhật backend models + commands để match new Project Model format. Project cũ cần migration.
- **C** — Giữ nguyên save/load interface hiện tại. Chỉ thay đổi frontend internal structure. Backend vẫn nhận/trả `{subtitles, style, overlays}`.

**Trả lời**: C

---

*Sau khi trả lời, AI-DLC sẽ phân tích và tiến hành sinh Requirements Document.*
