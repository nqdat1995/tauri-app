# Unit of Work Plan

## Context
- **Project**: Tauri Translate App — Translation Module Completion
- **Scope**: 1 brownfield unit, tất cả changes nằm trong `src-tauri/src/translation/` và wiring files

## Decomposition Decision
Hệ thống này là **monolith Tauri app** với 1 Rust crate duy nhất. Translation module là 1 logical grouping bên trong crate đó. Không có independently deployable services → **1 unit of work duy nhất**.

Không cần hỏi thêm về story grouping / team alignment vì:
- Không có user stories (skipped)
- Scope 100% kỹ thuật, 1 developer, 1 crate

---

## Unit of Work Plan Checkboxes

### Part 1: Planning
- [x] Xác định số lượng units: 1 unit ("translation-module")
- [x] Xác định file artifacts cần tạo
- [x] Xác định dependency ordering

### Part 2: Generation
- [x] Generate `unit-of-work.md`
- [x] Generate `unit-of-work-dependency.md`
- [x] Generate `unit-of-work-story-map.md`
---

## Approved Decomposition

**1 Unit**: `translation-module`

**Files trong unit (ordered by dependency)**:
1. `src-tauri/Cargo.toml` — add reqwest, async-trait, anyhow
2. `src-tauri/src/translation/mod.rs` — module declarations (NEW)
3. `src-tauri/src/translation/models.rs` — add AppSettings struct
4. `src-tauri/src/translation/chunk_builder.rs` — fix imports + constructor
5. `src-tauri/src/translation/providers/openai.rs` — full implementation
6. `src-tauri/src/translation/providers/gemini.rs` — full implementation
7. `src-tauri/src/translation/providers/deepseek.rs` — full implementation
8. `src-tauri/src/translation/provider_factory.rs` — fix factory with credentials
9. `src-tauri/src/translation/service.rs` — full pipeline implementation
10. `src-tauri/src/lib.rs` — declare mod translation, add command
11. `src-tauri/src/commands.rs` — add translate_project command
