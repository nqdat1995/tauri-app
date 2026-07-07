# Execution Plan — Video Editor Refactoring (Foundation)

> Workflow Planning cho AI-DLC lifecycle: Video Editor Refactoring
> Ngày: 2026-07-07

---

## Tổng quan

**Mục tiêu**: Refactor kiến trúc Editor frontend — xây dựng Project Model, Coordinate Space, Scene Graph mà KHÔNG thay đổi giao diện hiện tại.

**Phạm vi**: Chỉ frontend (TypeScript/React). Backend Rust giữ nguyên.

**Ràng buộc**:
- HTML/CSS/react-rnd rendering giữ nguyên
- Giao diện user không thay đổi
- Backend API calls giữ nguyên format
- Project cũ vẫn load được (read-only compat)

---

## Stages to Execute

| # | Stage | Mô tả |
|---|-------|--------|
| 1 | Application Design | Thiết kế interfaces, module structure, dependencies |
| 2 | Units Generation | Chia thành implementation units |
| 3 | Code Generation | Implement từng unit |
| 4 | Build and Test | Verify build + backward compat |

## Stages Skipped

| Stage | Lý do |
|-------|--------|
| User Stories | Refactor internal — không có user story mới |
| Functional Design | Requirements đủ chi tiết |
| NFR Requirements | NFRs đã nêu trong requirements |
| NFR Design | Không có infrastructure change |
| Infrastructure Design | Không thay đổi infrastructure |

---

## Implementation Units (Preview)

Dựa trên dependency analysis:

```text
Unit 1: Project Model (types + interfaces)
    ↓ (foundation — mọi unit khác phụ thuộc)
Unit 2: Asset Registry + Style System
    ↓ (depends on Project Model types)
Unit 3: Coordinate Space (viewport + conversion)
    ↓ (depends on Project Model transforms)
Unit 4: Scene Graph (builder + nodes)
    ↓ (depends on Project Model + Coordinate Space)
Unit 5: Migration Adapter + Store Refactor
    ↓ (depends on all above — connects new model to existing UI)
Unit 6: Renderer Adapter (HTMLRenderer)
    ↓ (depends on Scene Graph — final integration)
```

**Execution Order**: Sequential (Unit 1 → 2 → 3 → 4 → 5 → 6)

Lý do: Mỗi unit phụ thuộc vào output của unit trước. Không thể parallelize.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing rendering | High | Unit 6 giữ nguyên JSX/CSS, chỉ đổi data source |
| Performance regression (Scene rebuild) | Medium | Simple useMemo rebuild, benchmark < 1ms |
| Type incompatibility with backend | Medium | Adapter pattern (Unit 5) convert hai chiều |
| Scope creep (thêm features trong lúc refactor) | Low | Strict: chỉ refactor structure, không thêm feature |

---

## Definition of Done

- [ ] `tsc --noEmit` PASS (0 errors)
- [ ] `cargo check` PASS (0 errors — verify backend unaffected)
- [ ] App start và hiển thị editor bình thường
- [ ] Load project cũ → hiển thị đúng subtitles + overlays
- [ ] Drag/resize overlay → position persist sau save/load
- [ ] Fullscreen/resize → coordinates không bị lệch
- [ ] Save project → backend nhận đúng format cũ

---

*Awaiting user approval before proceeding to Application Design.*
