# Requirements Document

## Intent Analysis Summary

- **User Request**: Hoàn thiện các tính năng trong thư mục `src-tauri/src/translation`
- **Request Type**: Enhancement / Feature Completion (Brownfield)
- **Scope Estimate**: Multiple Components — toàn bộ translation module (service, providers, chunk_builder, provider_factory, models, lib.rs, Cargo.toml)
- **Complexity Estimate**: Moderate — kiến trúc đã có sẵn, cần implement đầy đủ logic cho từng component

---

## Context từ Reverse Engineering

Translation module hiện tại có kiến trúc đúng hướng (Strategy + Factory pattern) nhưng tất cả implementations đều là skeleton hoặc trống. Module cũng chưa được khai báo trong `lib.rs` và thiếu 3 Cargo dependencies.

---

## Functional Requirements

### FR-01: Module Registration
Translation module phải được khai báo trong `lib.rs` và có `translation/mod.rs` để re-export submodules. Cargo.toml phải có đủ dependencies: `reqwest` (async HTTP), `async-trait`, `anyhow`.

### FR-02: Global Config
App phải đọc/ghi settings từ file `~/.tauri-translate-app/settings.json`. Settings bao gồm:
- `provider`: loại provider (`"openai"`, `"gemini"`, `"deepseek"`)
- `api_key`: API key của provider đang dùng
- `model`: tên model (ví dụ `"gpt-4o-mini"`, `"gemini-1.5-flash"`, `"deepseek-chat"`)
- `target_language`: ngôn ngữ đích mặc định
- `chunk_size`: số segments tối đa mỗi chunk (default: 30)

### FR-03: TranslationService — Pipeline Orchestration
`TranslationService::translate_project(project_id)` phải thực hiện đầy đủ pipeline:
1. Đọc `subtitles.json` từ project directory
2. Đọc settings từ global config (FR-02)
3. Tạo provider instance qua `provider_factory`
4. Chia segments thành chunks theo `chunk_size` từ config
5. Với mỗi chunk: gọi `provider.translate()`, thu thập kết quả và lỗi riêng
6. Merge tất cả translated segments lại theo thứ tự
7. Ghi đè `subtitles.json` với `translated_content` đã được điền vào từng cue
8. Cập nhật `project.json`: set `processing.translation_status = "completed"` (hoặc `"partial"` nếu có chunk lỗi)

### FR-04: Error Handling — Partial Translation
Khi một hoặc nhiều chunks bị lỗi (timeout, API error, parse failure):
- KHÔNG fail toàn bộ job
- Tiếp tục dịch các chunks còn lại
- Segments của chunk lỗi giữ `translated_content = null`
- Khi hoàn thành, nếu có chunk lỗi: `translation_status = "partial"`, lưu danh sách lỗi
- Nếu tất cả chunks thành công: `translation_status = "completed"`

### FR-05: ChunkBuilder
`ChunkBuilder` phải:
- Có constructor `ChunkBuilder::new(max_segments: usize)`
- Method `split()` chia `&[TranslationSegment]` thành `Vec<Vec<TranslationSegment>>`
- Đọc `max_segments` từ settings khi khởi tạo (được inject từ service)
- Import đúng `TranslationSegment` từ `crate::translation::models`

### FR-06: ProviderFactory
`create_provider()` phải:
- Nhận `provider_type: ProviderType`, `api_key: String`, `model: String` làm params
- Handle tất cả 3 variants: `OpenAI`, `Gemini`, `DeepSeek`
- Return `Box<dyn Translator>`

### FR-07: OpenAI Provider
`OpenAIProvider` phải implement đầy đủ:
- `new(api_key: String, model: String) -> Self`
- `build_prompt(request: &TranslationRequest) -> String`: tạo JSON array của segments gửi lên AI
- `call_api(prompt: String) -> anyhow::Result<String>`: gọi `https://api.openai.com/v1/chat/completions` với `reqwest`, bearer auth
- `parse_response(response: String) -> anyhow::Result<TranslationResult>`: parse JSON array trả về từ AI
- `validate(result: &TranslationResult) -> anyhow::Result<()>`: kiểm tra segment count khớp với request

### FR-08: Gemini Provider
`GeminiProvider` phải implement đầy đủ tương tự OpenAI:
- `new(api_key: String, model: String) -> Self`
- Gọi Gemini API: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Cùng structured JSON prompt/response format
- Implement `Translator` trait

### FR-09: DeepSeek Provider
`DeepSeekProvider` phải implement đầy đủ:
- `new(api_key: String, model: String) -> Self`
- Gọi `https://api.deepseek.com/chat/completions` (OpenAI-compatible format)
- Có thể tái dùng logic từ OpenAI provider (chỉ khác base URL)
- Implement `Translator` trait

### FR-10: Translation Prompt Format
Prompt gửi lên AI provider phải theo structured JSON format:
- **System message**: Hướng dẫn AI dịch phụ đề, giữ nguyên timing, trả về JSON array
- **User message**: JSON array `[{"id": N, "text": "..."}]`
- **Expected response**: JSON array `[{"id": N, "text": "...translated..."}]`
- Validate response: số phần tử trả về phải bằng số phần tử gửi đi, `id` phải khớp

### FR-11: Tauri Command — translate_project
Thêm Tauri command `translate_project(project_id: String)` để frontend có thể gọi. Command này gọi `TranslationService::translate_project()` và trả `Result<(), String>`.

### FR-12: SubtitleCue — translated_content
`subtitles.json` lưu array `SubtitleCue`. Mỗi cue có field `translated_content: Option<String>`. Sau khi dịch, field này được điền. File được ghi đè lên disk.

---

## Non-Functional Requirements

### NFR-01: Async / Non-blocking
Toàn bộ translation pipeline phải async (`async fn`). Không block Tauri main thread. Sử dụng `reqwest` với async feature, `tokio` runtime (có sẵn qua Tauri).

### NFR-02: Resilience
Mỗi chunk được xử lý độc lập. Lỗi ở chunk N không ảnh hưởng chunks khác. Lỗi được ghi lại và aggregated, không bị silently dropped.

### NFR-03: Correctness của Translation Output
Segment count sau khi dịch phải bằng segment count đầu vào. Thứ tự segments phải được bảo toàn. ID mapping phải chính xác.

### NFR-04: Code Consistency
Translation module sử dụng `anyhow::Result` cho error type (consistent với `providers/mod.rs` hiện tại). Storage layer giữ `Result<T, String>`. Có conversion tại boundary.

### NFR-05: Compilable
Sau khi hoàn thiện, toàn bộ codebase phải compile thành công (`cargo build`). Không còn unresolved imports hay missing implementations.

---

## Out of Scope
- Frontend UI changes (không thuộc `src-tauri/src/translation/`)
- Rate limiting / request throttling (có thể add sau)
- Caching translation results
- Translation memory / glossary support
- Progress events đến frontend (không cần theo Q6)
