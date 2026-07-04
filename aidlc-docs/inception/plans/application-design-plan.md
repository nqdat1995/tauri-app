# Application Design Plan — Video Editor Feature

## Plan Overview

This plan defines the high-level component architecture for the Video Editor feature, covering both Backend (Rust/Tauri) and Frontend (React/TypeScript) layers.

## Design Steps

- [x] 1. Define Backend Components (Rust)
  - [x] 1.1 Editor commands module (`commands/editor.rs`)
  - [x] 1.2 Editor storage operations (extend `storage.rs` or new module)
  - [x] 1.3 Data model structs for editor state
- [x] 2. Define Frontend Components (React)
  - [x] 2.1 Editor page layout and sub-components
  - [x] 2.2 State management approach
  - [x] 2.3 Video playback + subtitle sync component
  - [x] 2.4 Overlay panel with drag/resize interaction
- [x] 3. Define Service Layer / Communication
  - [x] 3.1 Tauri IPC contract (command signatures)
  - [x] 3.2 Data flow: FE → BE → Filesystem
  - [x] 3.3 Event system (if needed)
- [x] 4. Define Component Dependencies
  - [x] 4.1 FE ↔ BE dependency matrix
  - [x] 4.2 Integration with existing History/Home pages
- [x] 5. Generate Design Artifacts
  - [x] 5.1 Generate components.md
  - [x] 5.2 Generate component-methods.md
  - [x] 5.3 Generate services.md
  - [x] 5.4 Generate component-dependency.md
  - [x] 5.5 Generate consolidated application-design.md
  - [x] 5.6 Validate design completeness and consistency

---

## Design Questions

Vui lòng trả lời các câu hỏi sau để hướng dẫn thiết kế kiến trúc.

### Component Organization

## Question 1
Backend editor logic nên tổ chức như thế nào trong cấu trúc `src-tauri/src/` hiện tại?

A) Thêm commands vào `commands/editor.rs` (new file) + mở rộng `storage.rs` cho editor read/write

B) Tạo module mới `editor/` riêng biệt (editor/commands.rs, editor/models.rs, editor/storage.rs) — tách hoàn toàn khỏi existing code

C) Thêm commands vào `commands/editor.rs` + tạo riêng `editor/storage.rs` cho editor-specific file operations (tách storage nhưng giữ commands chung)

D) Other (please describe after [Answer]: tag below)

[Answer]: Tạo module mới `editor/`, tuy nhiên mở rộng storage.rs và sử dụng lại

---

## Question 2
Frontend state management cho Editor page — approach nào phù hợp?

A) useState/useReducer local trong Editor page (đơn giản, tất cả state trong 1 component)

B) React Context riêng cho Editor (EditorContext) — share state giữa các sub-components mà không cần prop-drilling

C) Zustand store riêng cho Editor (global-like state, persist-able)

D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3
Overlay drag/resize trên video viewport — thư viện/approach nào?

A) Custom implementation (mousedown/mousemove/mouseup handlers) — không thêm dependency

B) Sử dụng thư viện `react-rnd` (react-resizable-and-draggable) — mature, well-tested

C) Sử dụng thư viện `react-draggable` + `re-resizable` (2 libs nhỏ, flexible)

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Service Layer

## Question 4
Khi save editor project, backend cần validate data không hay chỉ write raw?

A) Chỉ write raw — FE đã validate trước khi gửi, BE chỉ persist

B) BE validate cơ bản (check required fields, valid ranges cho timing) rồi write

C) BE validate nghiêm ngặt (check overlap timing, valid subtitle format, style constraints) + return errors

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
Khi Editor mở (load project), nếu video file gốc không còn tồn tại (user đã xóa/di chuyển), xử lý thế nào?

A) Hiển thị error message + cho phép edit subtitle/style mà không có video preview

B) Hiển thị dialog cho user chọn lại file video mới (re-link)

C) Cả hai: hiển thị warning + option re-link, nhưng vẫn cho edit subtitle

D) Other (please describe after [Answer]: tag below)

[Answer]: Hiển thị error message + sau khi người dùng click `OK` hoặc tắt error popup thì chuyển về tab Lịch sử, không cho người dùng thao tác edit tiếp

---

## Question 6
History → Editor navigation: cách truyền project_id giữa 2 tab?

A) Shared state ở App level (lift state up — App.tsx quản lý `activeEditorProjectId`)

B) Event-based (custom event / Tauri event — Editor listens, History emits)

C) URL-like approach (query param style state, e.g., tab="editor&project=xxx")

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Data Flow

## Question 7
Subtitle overlay styling trên video viewport — render approach?

A) CSS-based overlay (absolute positioned div trên video element, style bằng inline CSS)

B) Canvas-based overlay (draw text lên canvas layer trên video)

C) HTML overlay với CSS + Web Animations API cho transitions

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
Unsaved changes indicator — cần ở mức nào?

A) Đơn giản: dot indicator trên tab "Trình chỉnh sửa" + disabled navigation warning

B) Chi tiết: dot indicator + "Bạn có thay đổi chưa lưu" dialog khi rời editor

C) Minimal: chỉ visual indicator (dot), không block navigation

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---
