# Execution Plan — Refactor src-tauri/src

## Intent Analysis

- **User Request**: Refactor code trong `src-tauri/src`, chia lại cấu trúc thư mục và các file theo đúng chức năng
- **Request Type**: Refactoring (Brownfield)
- **Scope**: Multiple Components — toàn bộ src-tauri/src/ (trừ translation/ đã hoàn thiện)
- **Complexity**: Moderate — không thay đổi logic, chỉ tổ chức lại cấu trúc
- **Risk**: Low — pure structural refactor, không thay đổi behavior

---

## Vấn đề cấu trúc hiện tại

| File | Vấn đề |
|---|---|
| `orchestrator.rs` (~500 dòng) | God object: trộn lẫn AppState, job queue, sidecar management, STT pipeline, project creation, SRT parsing |
| `storage.rs` | Import `AppData` từ `orchestrator` — coupling sai hướng |
| `commands.rs` | Flat, không phân nhóm theo domain |
| `lib.rs` | Import thủ công từng function — fragile khi thêm commands mới |

---

## Cấu trúc mới đề xuất

```
src-tauri/src/
├── main.rs                   (không thay đổi)
├── lib.rs                    (cập nhật: dùng glob imports)
├── state.rs                  (MỚI: AppState, AppData, SidecarState)
├── commands/
│   ├── mod.rs                (MỚI: re-export tất cả commands)
│   ├── project.rs            (MỚI: greet, save_project, get_file_metadata)
│   ├── job.rs                (MỚI: enqueue_job, cancel_pending_jobs)
│   ├── sidecar.rs            (MỚI: start_sidecar)
│   └── translation.rs        (MỚI: translate_project)
├── job/
│   ├── mod.rs                (MỚI: re-export)
│   ├── models.rs             (MỚI: UploadJob, JobStatus, JobEvent, QueueRequest)
│   ├── queue.rs              (MỚI: enqueue_job fn, cancel_pending_jobs fn)
│   └── processor.rs          (MỚI: start_processing_thread, process_job, update_job_status, emit_job_event)
├── sidecar/
│   ├── mod.rs                (MỚI: re-export + pub use ensure_sidecar_running_pub)
│   └── manager.rs            (MỚI: ensure_sidecar_running, bind_free_port, spawn, health check)
├── stt/
│   ├── mod.rs                (MỚI: re-export)
│   ├── whisper_client.rs     (MỚI: call_whisper, WhisperResponse)
│   └── srt_parser.rs         (MỚI: parse_srt, parse_timecode, SubtitleCue)
├── project/
│   ├── mod.rs                (MỚI: re-export)
│   └── builder.rs            (MỚI: create_project, generate_thumbnail, AppData usage)
├── storage.rs                (SỬA: bỏ AppData import từ orchestrator, import từ state)
└── translation/              (KHÔNG THAY ĐỔI — đã hoàn thiện)
    └── ...
```

---

## Code Generation Plan

### Step 1 — Tạo `src/state.rs`
- [ ] Tạo file mới `src-tauri/src/state.rs`
- [ ] Di chuyển: `AppState`, `AppData`, `SidecarState` từ `orchestrator.rs`
- [ ] Đảm bảo derive macros và imports đầy đủ

### Step 2 — Tạo `src/job/models.rs`
- [ ] Tạo thư mục `src-tauri/src/job/`
- [ ] Tạo `job/models.rs` với: `UploadJob`, `JobStatus`, `JobEvent`, `QueueRequest`
- [ ] Import từ `crate::state`

### Step 3 — Tạo `src/job/queue.rs`
- [ ] Tạo `job/queue.rs`
- [ ] Di chuyển logic: `enqueue_job()`, `cancel_pending_jobs()`
- [ ] Dependencies: `crate::state`, `crate::job::models`

### Step 4 — Tạo `src/sidecar/manager.rs`
- [ ] Tạo thư mục `src-tauri/src/sidecar/`
- [ ] Tạo `sidecar/manager.rs`
- [ ] Di chuyển: `ensure_sidecar_running`, `ensure_sidecar_running_pub`, `bind_free_port`, `spawn_sidecar_process`, `find_sidecar_executable`, `find_sidecar_script`, `spawn_python_sidecar`, `wait_for_sidecar_health`

### Step 5 — Tạo `src/stt/whisper_client.rs` và `src/stt/srt_parser.rs`
- [ ] Tạo thư mục `src-tauri/src/stt/`
- [ ] Tạo `stt/whisper_client.rs`: `call_whisper()`, `WhisperResponse`
- [ ] Tạo `stt/srt_parser.rs`: `parse_srt()`, `parse_timecode()`, `SubtitleCue`

### Step 6 — Tạo `src/project/builder.rs`
- [ ] Tạo thư mục `src-tauri/src/project/`
- [ ] Tạo `project/builder.rs`: `create_project()`, `generate_thumbnail()`

### Step 7 — Tạo `src/job/processor.rs`
- [ ] Tạo `job/processor.rs`
- [ ] Di chuyển: `start_processing_thread`, `process_job`, `update_job_status`, `emit_job_event`, `take_next_queued_job`
- [ ] Dependencies: sidecar, stt, project modules

### Step 8 — Tạo các mod.rs files
- [ ] Tạo `job/mod.rs` — re-export models, queue, processor
- [ ] Tạo `sidecar/mod.rs` — re-export manager
- [ ] Tạo `stt/mod.rs` — re-export whisper_client, srt_parser
- [ ] Tạo `project/mod.rs` — re-export builder

### Step 9 — Tạo `src/commands/` module
- [ ] Tạo thư mục `src-tauri/src/commands/`
- [ ] Tạo `commands/project.rs`: `greet`, `save_project`, `get_file_metadata`, `FileMetadata`
- [ ] Tạo `commands/job.rs`: `enqueue_job`, `cancel_pending_jobs`
- [ ] Tạo `commands/sidecar.rs`: `start_sidecar`
- [ ] Tạo `commands/translation.rs`: `translate_project`
- [ ] Tạo `commands/mod.rs` — re-export tất cả

### Step 10 — Cập nhật `src/storage.rs`
- [ ] Thay `use crate::orchestrator::AppData` thành `use crate::state::AppData`
- [ ] Thay `use crate::translation::models::AppSettings` (giữ nguyên)
- [ ] Verify không còn dependency vào orchestrator

### Step 11 — Cập nhật `src/lib.rs`
- [ ] Thay các mod declarations cũ (commands, orchestrator, storage, translation)
- [ ] Thêm các mod mới (state, job, sidecar, stt, project, commands, storage, translation)
- [ ] Cập nhật invoke_handler để dùng commands từ commands module

### Step 12 — Xóa `orchestrator.rs` và `commands.rs` cũ
- [ ] Xóa `src-tauri/src/orchestrator.rs`
- [ ] Xóa `src-tauri/src/commands.rs`

### Step 13 — Verify
- [ ] Chạy `cargo check` — đảm bảo 0 errors

---

## Phases to Execute

### 🔵 INCEPTION PHASE
- [x] Workspace Detection (COMPLETED)
- [x] Reverse Engineering (COMPLETED)
- [x] Requirements Analysis (COMPLETED)
- [x] User Stories (SKIPPED)
- [x] Workflow Planning (IN PROGRESS)
- [x] Application Design (SKIPPED — pure refactor, no new components)
- [x] Units Generation (SKIPPED — single unit, plan above is sufficient)

### 🟢 CONSTRUCTION PHASE
- [x] Functional Design (SKIPPED — no new business logic)
- [x] NFR Requirements (SKIPPED — no new NFRs)
- [x] NFR Design (SKIPPED)
- [x] Infrastructure Design (SKIPPED)
- [ ] Code Generation — EXECUTE (13 steps)
- [ ] Build and Test — EXECUTE

### 🟡 OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

---

## Success Criteria
- `cargo check` PASSES với 0 errors
- Tất cả Tauri commands vẫn hoạt động (không thay đổi API)
- Không thay đổi behavior — pure structural refactor
- Mỗi file/module có single responsibility rõ ràng
