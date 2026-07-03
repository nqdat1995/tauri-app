# Execution Plan

## Detailed Analysis Summary

### Transformation Scope
- **Transformation Type**: Single module completion (Brownfield — translation module)
- **Primary Changes**: Implement 7 skeleton/empty files trong `src-tauri/src/translation/`, thêm 3 Cargo dependencies, khai báo module trong `lib.rs`, thêm Tauri command
- **Related Components**: `lib.rs`, `commands.rs`, `Cargo.toml`, `storage.rs` (minor additions)

### Change Impact Assessment
- **User-facing changes**: Yes — thêm Tauri command `translate_project` để frontend gọi được
- **Structural changes**: No — architecture đã có sẵn, chỉ implement
- **Data model changes**: Minor — `subtitles.json` sẽ có `translated_content` field populated sau khi dịch; thêm `AppSettings` struct mới
- **API changes**: Yes — thêm 1 Tauri command mới, thêm `settings.json` global config
- **NFR impact**: Low — async I/O, error resilience đã trong requirements

### Component Relationships
- **Primary Component**: `src-tauri/src/translation/` (7 files)
- **Supporting Components**: `lib.rs`, `commands.rs`, `Cargo.toml` (minor changes)
- **Unchanged Components**: `orchestrator.rs`, `storage.rs` (đọc thêm settings thôi)

### Risk Assessment
- **Risk Level**: Low-Medium
- **Rollback Complexity**: Easy — translation module độc lập, không ảnh hưởng STT pipeline
- **Testing Complexity**: Moderate — cần mock API calls để test

---

## Workflow Visualization

```
INCEPTION PHASE
  [x] Workspace Detection      -- COMPLETED
  [x] Reverse Engineering      -- COMPLETED
  [x] Requirements Analysis    -- COMPLETED
  [ ] User Stories             -- SKIP (no user personas, clear technical scope)
  [x] Workflow Planning        -- IN PROGRESS
  [ ] Application Design       -- SKIP (component boundaries already defined)
  [ ] Units Generation         -- EXECUTE (7 interdependent files need ordered impl plan)

CONSTRUCTION PHASE (per-unit loop)
  [ ] Functional Design        -- SKIP (data models already in models.rs, business logic straightforward)
  [ ] NFR Requirements         -- SKIP (NFRs already captured in requirements.md, no new infra)
  [ ] NFR Design               -- SKIP (no new NFR patterns needed)
  [ ] Infrastructure Design    -- SKIP (no cloud/infra changes, just Cargo deps)
  [ ] Code Generation          -- EXECUTE (always)
  [ ] Build and Test           -- EXECUTE (always)

OPERATIONS PHASE
  [ ] Operations               -- PLACEHOLDER
```

---

## Phases to Execute

### INCEPTION PHASE
- [x] Workspace Detection — COMPLETED
- [x] Reverse Engineering — COMPLETED
- [x] Requirements Analysis — COMPLETED
- [ ] User Stories — **SKIP**
  - **Rationale**: Không có user personas mới. Scope hoàn toàn kỹ thuật: hoàn thiện implementation của module đã thiết kế sẵn.
- [x] Workflow Planning — IN PROGRESS
- [ ] Application Design — **SKIP**
  - **Rationale**: Component boundaries đã rõ ràng từ reverse engineering. Không tạo component mới, chỉ implement các methods còn thiếu trong cấu trúc hiện có.
- [ ] Units Generation — **EXECUTE**
  - **Rationale**: Có 7 files cần viết theo thứ tự dependency chặt chẽ (models → trait → providers → chunk_builder → factory → service → wiring). Cần plan rõ ràng để tránh circular imports và đảm bảo thứ tự implement đúng.

### CONSTRUCTION PHASE
- [ ] Functional Design — **SKIP**
  - **Rationale**: Data models đã có trong `models.rs`. Business logic (chunking, merging, pipeline) đơn giản, không cần separate design document.
- [ ] NFR Requirements — **SKIP**
  - **Rationale**: NFRs đã được capture đầy đủ trong `requirements.md` (async, resilience, correctness). Không có performance/security requirements mới cần assess thêm.
- [ ] NFR Design — **SKIP**
  - **Rationale**: Không có NFR patterns mới cần thiết kế (caching, circuit breaker, etc. không trong scope).
- [ ] Infrastructure Design — **SKIP**
  - **Rationale**: Không thay đổi cloud infrastructure. Chỉ thêm Cargo dependencies là HTTP client (`reqwest`) — không cần infra design doc.
- [ ] Code Generation — **EXECUTE** (ALWAYS)
  - **Rationale**: Implement tất cả 7 files + wiring vào lib.rs/commands.rs/Cargo.toml.
- [ ] Build and Test — **EXECUTE** (ALWAYS)
  - **Rationale**: Verify compilation, tạo build/test instructions.

### OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

---

## Units of Work (từ Units Generation — preview)

Dự kiến 1 unit duy nhất: **"translation-module"** với thứ tự implement:

1. `Cargo.toml` — thêm `reqwest`, `async-trait`, `anyhow`
2. `translation/mod.rs` — module declarations
3. `translation/models.rs` — thêm `AppSettings` struct
4. `translation/chunk_builder.rs` — hoàn thiện với constructor và imports
5. `translation/providers/openai.rs` — full implementation
6. `translation/providers/gemini.rs` — full implementation
7. `translation/providers/deepseek.rs` — full implementation
8. `translation/provider_factory.rs` — hoàn thiện factory với credentials
9. `translation/service.rs` — full pipeline implementation
10. `lib.rs` — khai báo `mod translation`, thêm command
11. `commands.rs` — thêm `translate_project` command

---

## Success Criteria
- **Primary Goal**: `cargo build` thành công, translation module hoạt động end-to-end
- **Key Deliverables**: 11 files updated/created, Tauri command `translate_project` hoạt động
- **Quality Gates**:
  - Compile without errors or warnings
  - TranslationService pipeline đọc config → chunk → translate → save đúng
  - Partial error handling: chunk lỗi không fail toàn bộ job
  - Tất cả 3 providers implement `Translator` trait
