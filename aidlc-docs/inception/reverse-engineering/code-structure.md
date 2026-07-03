# Code Structure

## Build System
- **Type**: Cargo (Rust) + Tauri Build
- **Configuration**: `src-tauri/Cargo.toml`
- **Tauri Version**: 2.x

## Key Modules

```
src-tauri/src/
├── lib.rs                          -- Entry point, Tauri builder, module declarations
├── commands.rs                     -- Tauri IPC command handlers
├── orchestrator.rs                 -- STT job queue + pipeline
├── storage.rs                      -- File system abstraction
└── translation/
    ├── mod.rs                      -- (chưa tìm thấy — cần tạo)
    ├── models.rs                   -- Domain data structures
    ├── service.rs                  -- Translation pipeline (SKELETON)
    ├── chunk_builder.rs            -- Segment chunking (PARTIAL)
    ├── provider_factory.rs         -- Provider factory (INCOMPLETE)
    └── providers/
        ├── mod.rs                  -- Translator trait (COMPLETE)
        ├── openai.rs               -- OpenAI impl (SKELETON)
        ├── gemini.rs               -- Gemini impl (EMPTY)
        └── deepseek.rs             -- DeepSeek impl (EMPTY)
```

## Existing Files Inventory

- `src-tauri/src/lib.rs` — Tauri app setup, plugin registration, command registration
- `src-tauri/src/commands.rs` — Tauri command wrappers cho orchestrator functions
- `src-tauri/src/orchestrator.rs` — Job queue, sidecar management, STT pipeline, SRT parsing
- `src-tauri/src/storage.rs` — PathBuf helpers, JSON read/write, project directory management
- `src-tauri/src/translation/models.rs` — TranslationSegment, TranslationRequest, TranslationResult structs
- `src-tauri/src/translation/service.rs` — TranslationService::translate_project() skeleton với comment outline
- `src-tauri/src/translation/chunk_builder.rs` — ChunkBuilder với split() logic, thiếu import
- `src-tauri/src/translation/provider_factory.rs` — ProviderType enum + create_provider() factory, INCOMPLETE
- `src-tauri/src/translation/providers/mod.rs` — Translator async trait
- `src-tauri/src/translation/providers/openai.rs` — OpenAIProvider struct + impl skeleton
- `src-tauri/src/translation/providers/gemini.rs` — EMPTY
- `src-tauri/src/translation/providers/deepseek.rs` — EMPTY

## Issues Found in Current Code

### Critical Issues (blocking compilation):
1. **`translation/` module chưa được khai báo trong `lib.rs`** — không có `mod translation;`
2. **`chunk_builder.rs` thiếu import** cho `TranslationSegment`
3. **`provider_factory.rs` thiếu imports** cho `Translator`, `OpenAIProvider`, `GeminiProvider`, `DeepSeekProvider`
4. **`provider_factory.rs` thiếu `DeepSeek` arm** trong match expression
5. **`openai.rs` thiếu imports** cho `async_trait`, `Translator`, models
6. **`service.rs` là empty skeleton** — chưa có implementation gì
7. **`gemini.rs` và `deepseek.rs` hoàn toàn trống**

### Design Issues:
1. **`TranslationService` thiếu dependencies injection** — cần `storage`, `api_key`, `provider config`
2. **`ChunkBuilder` thiếu constructor** `new(max_segments)`
3. **`OpenAIProvider` thiếu constructor** `new()` với API key
4. **`create_provider()` không nhận API key** — provider không biết credentials từ đâu
5. **Không có `translation/mod.rs`** để re-export các modules

## Design Patterns Used

### Factory Pattern
- **Location**: `provider_factory.rs`
- **Purpose**: Tạo đúng provider implementation từ enum

### Trait Object (Strategy Pattern)
- **Location**: `providers/mod.rs` — `Translator` trait
- **Purpose**: Cho phép swap provider implementation tại runtime

### Repository Pattern (Partial)
- **Location**: `storage.rs`
- **Purpose**: Abstraction cho file system access

### Job Queue Pattern
- **Location**: `orchestrator.rs`
- **Purpose**: Async job processing với status tracking

## Critical Dependencies

### reqwest (MISSING — cần thêm)
- **Purpose**: HTTP client để gọi OpenAI/Gemini/DeepSeek APIs
- **Note**: Hiện tại `ureq` đang dùng cho sidecar calls (sync), cần `reqwest` cho async HTTP

### async-trait
- **Version**: Cần thêm vào Cargo.toml
- **Usage**: `providers/mod.rs` import nhưng chưa có trong Cargo.toml
- **Purpose**: Cho phép async fn trong trait definitions

### anyhow
- **Version**: Cần thêm vào Cargo.toml
- **Usage**: `providers/mod.rs` dùng `anyhow::Result`
- **Purpose**: Ergonomic error handling

### serde_json
- **Version**: 1 (đã có)
- **Usage**: JSON serialization cho API requests/responses
