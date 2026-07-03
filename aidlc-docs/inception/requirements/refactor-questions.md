# Câu hỏi xác nhận — Refactor src-tauri/src

Tôi đã phân tích codebase và đề xuất kế hoạch refactor bên dưới. Vui lòng trả lời để xác nhận hướng đi.

---

## Question 1
Tôi đề xuất tách `orchestrator.rs` (~500 dòng) thành các module nhỏ hơn theo chức năng. Bạn muốn tiếp cận nào?

A) Tách hoàn toàn theo đề xuất bên dưới (state, job, sidecar, stt, project)

B) Tách một phần — chỉ tách các module lớn nhất, giữ nguyên một số phần trong orchestrator.rs

C) Giữ nguyên orchestrator.rs, chỉ tổ chức lại translation/ và commands/

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
Với module `commands/`, bạn muốn cấu trúc như thế nào?

A) Tách thành nhiều file theo domain (project.rs, job.rs, sidecar.rs, translation.rs) trong thư mục commands/

B) Giữ một file commands.rs duy nhất nhưng tổ chức lại code bên trong

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
`AppData` struct hiện đang ở trong `orchestrator.rs` nhưng được dùng bởi `storage.rs` (circular coupling). Bạn muốn đặt nó ở đâu?

A) Chuyển vào `state.rs` (module riêng cho application state types)

B) Chuyển vào `storage.rs` (nơi nó được sử dụng nhiều nhất)

C) Chuyển vào `models.rs` tại root level

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
Sau khi refactor, bạn muốn verify kết quả như thế nào?

A) Chạy `cargo check` để đảm bảo compile thành công là đủ

B) Chạy `cargo build` đầy đủ

C) Chạy cả `cargo check` + `cargo clippy` để check style

D) Other (please describe after [Answer]: tag below)

[Answer]: A
