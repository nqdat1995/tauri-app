# Business Overview

## Business Context Diagram

```
+-----------------------------------------------+
|            Tauri Translate App                |
|   Desktop app: Video STT + AI Translation     |
+-----------------------------------------------+
          |                        |
          v                        v
  +---------------+      +------------------+
  |  Whisper STT  |      |  AI Translators  |
  |  (Sidecar)    |      |  OpenAI/Gemini/  |
  |               |      |  DeepSeek        |
  +---------------+      +------------------+
          |                        |
          v                        v
  +-----------------------------------------------+
  |           Local File Storage                  |
  |  ~/.tauri-translate-app/projects/             |
  +-----------------------------------------------+
```

## Business Description

- **Business Description**: Ứng dụng desktop dùng để xử lý video — tự động nhận dạng giọng nói (STT) qua Whisper, tạo phụ đề SRT, sau đó dịch phụ đề sang ngôn ngữ khác bằng các AI provider (OpenAI, Gemini, DeepSeek).

- **Business Transactions**:
  1. **Video Upload & STT**: Người dùng chọn video → app gửi lên Whisper sidecar → nhận lại SRT → lưu project
  2. **Subtitle Translation**: Người dùng chọn project có phụ đề → chọn ngôn ngữ đích + AI provider → dịch từng chunk phụ đề → lưu kết quả
  3. **Project Management**: Tạo, lưu, đọc thông tin project (video metadata, subtitles, translation status)

- **Business Dictionary**:
  - **Project**: Đơn vị lưu trữ gồm video metadata + subtitles.json + translation output
  - **Segment/Subtitle Cue**: Một dòng phụ đề với cue_id, thời gian bắt đầu/kết thúc, nội dung text
  - **Chunk**: Nhóm nhiều segments gộp lại để gửi 1 lần lên AI provider (giảm số lần API call)
  - **Translation Request**: Thông tin gửi đến AI provider: ngôn ngữ nguồn/đích + danh sách segments
  - **Translation Result**: Danh sách segments sau khi được dịch
  - **Provider**: AI backend để dịch (OpenAI, Gemini, DeepSeek)
  - **Sidecar**: Process Python/executable chạy Whisper STT song song với Tauri app

## Component Level Business Descriptions

### orchestrator.rs
- **Purpose**: Quản lý upload job queue và điều phối toàn bộ pipeline STT
- **Responsibilities**: Enqueue jobs, spawn sidecar, call Whisper, parse SRT, create project

### translation/service.rs
- **Purpose**: Điều phối pipeline dịch thuật cho một project
- **Responsibilities**: Load subtitles, load settings, chunk subtitles, gọi AI provider, merge results, lưu file

### translation/providers/
- **Purpose**: Tầng abstraction để giao tiếp với các AI translation APIs
- **Responsibilities**: Tạo prompt, gọi HTTP API, parse response, validate output

### translation/chunk_builder.rs
- **Purpose**: Chia danh sách segments thành các batch nhỏ
- **Responsibilities**: Tránh vượt quá token limit của AI provider

### translation/provider_factory.rs
- **Purpose**: Factory để khởi tạo đúng provider dựa trên config
- **Responsibilities**: Map ProviderType enum sang implementation cụ thể

### storage.rs
- **Purpose**: Tầng truy xuất file system
- **Responsibilities**: Đọc/ghi JSON files, quản lý đường dẫn project directory
