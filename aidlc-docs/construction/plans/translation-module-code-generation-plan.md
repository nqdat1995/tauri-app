# Code Generation Plan — translation-module

## Unit Context
- **Unit**: translation-module
- **Type**: Brownfield — hoàn thiện implementation
- **Workspace Root**: `d:\LEARN\tauri-app\`
- **Application Code Location**: `src-tauri/src/` và `src-tauri/Cargo.toml`
- **Requirements Covered**: FR-01 -> FR-12, NFR-01 -> NFR-05

## Dependencies
- `storage.rs` — đọc/ghi project files (đã có, không cần sửa nhiều)
- `reqwest`, `async-trait`, `anyhow` — cần thêm vào Cargo.toml
- Tauri async runtime (qua `tauri::async_runtime::spawn`)

---

## Generation Steps

### Step 1: Update Cargo.toml — Add Missing Dependencies
- [x] **File**: `src-tauri/Cargo.toml` (MODIFY existing)
- [x] Thêm `reqwest = { version = "0.11", features = ["json", "rustls-tls"] }`
- [x] Thêm `async-trait = "0.1"`
- [x] Thêm `anyhow = "1"`
- [x] Kiểm tra `tokio` — Tauri 2 bundled tokio, không cần thêm riêng
- [x] **Covers**: FR-01 (module registration deps), NFR-01 (async)

### Step 2: Create translation/mod.rs — Module Declarations
- [x] **File**: `src-tauri/src/translation/mod.rs` (CREATE new)
- [x] Declare submodules: `pub mod models`, `pub mod chunk_builder`, `pub mod provider_factory`, `pub mod service`
- [x] Declare providers submodule: `pub mod providers`
- [x] **Covers**: FR-01 (module registration)

### Step 3: Update translation/models.rs — Add AppSettings
- [x] **File**: `src-tauri/src/translation/models.rs` (MODIFY existing)
- [x] Giữ nguyên `TranslationSegment`, `TranslationRequest`, `TranslationResult`
- [x] Thêm `AppSettings` struct với `provider`, `api_key`, `model`, `target_language`, `chunk_size`
- [x] Derive `Serialize`, `Deserialize`, `Default` cho `AppSettings`
- [x] **Covers**: FR-02 (global config data model)

### Step 4: Fix translation/chunk_builder.rs — Imports + Constructor
- [x] **File**: `src-tauri/src/translation/chunk_builder.rs` (MODIFY existing)
- [x] Thêm `use crate::translation::models::TranslationSegment;`
- [x] Thêm constructor `pub fn new(max_segments: usize) -> Self`
- [x] Giữ nguyên `split()` logic
- [x] **Covers**: FR-05 (ChunkBuilder)

### Step 5: Implement providers/openai.rs — Full OpenAI Implementation
- [x] **File**: `src-tauri/src/translation/providers/openai.rs` (MODIFY existing)
- [x] Thêm imports: `async_trait`, `reqwest`, `anyhow`, models, Translator trait
- [x] Implement `OpenAIProvider::new(api_key, model)`
- [x] Implement `build_request_body()` — JSON array prompt format
- [x] Implement `call_api()` — POST to OpenAI with bearer auth
- [x] Implement `parse_response()` — extract translated segments from JSON
- [x] Implement `validate()` — segment count check
- [x] Implement `Translator` trait
- [x] **Covers**: FR-07, FR-10, NFR-01 (async)

### Step 6: Create providers/gemini.rs — Full Gemini Implementation
- [x] **File**: `src-tauri/src/translation/providers/gemini.rs` (CREATE full impl)
- [x] `GeminiProvider` struct, `new()`, full API call implementation
- [x] Gemini generateContent endpoint with API key in URL
- [x] Same JSON array prompt/parse format
- [x] Implement `Translator` trait
- [x] **Covers**: FR-08, FR-10

### Step 7: Create providers/deepseek.rs — Full DeepSeek Implementation
- [x] **File**: `src-tauri/src/translation/providers/deepseek.rs` (CREATE full impl)
- [x] `DeepSeekProvider` struct, `new()`, OpenAI-compatible format
- [x] POST to `https://api.deepseek.com/chat/completions`
- [x] Implement `Translator` trait
- [x] **Covers**: FR-09, FR-10

### Step 8: Fix provider_factory.rs — Complete Factory with Credentials
- [x] **File**: `src-tauri/src/translation/provider_factory.rs` (MODIFY existing)
- [x] Add imports for all 3 providers and Translator trait
- [x] `create_provider(provider, api_key, model) -> Box<dyn Translator>`
- [x] All 3 arms in match (OpenAI, Gemini, DeepSeek)
- [x] `ProviderType::from_str()` helper
- [x] **Covers**: FR-06

### Step 9: Implement translation/service.rs — Full Pipeline
- [x] **File**: `src-tauri/src/translation/service.rs` (MODIFY existing)
- [x] Read settings, read subtitles.json, create provider, chunk, translate, merge, write
- [x] Error resilience: skip failed chunks, report partial status
- [x] Update project.json `translation_status`
- [x] **Covers**: FR-03, FR-04, FR-12, NFR-01, NFR-02, NFR-03

### Step 10: Update storage.rs — Settings Helpers
- [x] **File**: `src-tauri/src/storage.rs` (MODIFY existing)
- [x] `settings_file_path() -> Result<PathBuf, String>`
- [x] `read_settings() -> Result<AppSettings, String>`
- [x] **Covers**: FR-02 (config reading)

### Step 11: Update lib.rs — Register Translation Module + Command
- [x] **File**: `src-tauri/src/lib.rs` (MODIFY existing)
- [x] `mod translation;`
- [x] Import and register `translate_project` command
- [x] **Covers**: FR-01, FR-11

### Step 12: Update commands.rs — Add translate_project Command
- [x] **File**: `src-tauri/src/commands.rs` (MODIFY existing)
- [x] Import `TranslationService`
- [x] `pub async fn translate_project(project_id: String) -> Result<(), String>`
- [x] **Covers**: FR-11, NFR-01

---

## Summary
- **12 steps** — ALL COMPLETE
- **Files modified**: Cargo.toml, models.rs, chunk_builder.rs, openai.rs, provider_factory.rs, service.rs, storage.rs, lib.rs, commands.rs (9 files)
- **Files created**: translation/mod.rs, gemini.rs, deepseek.rs (3 files), providers/mod.rs (updated)
- **No files deleted**
- **Build status**: cargo check PASSED
