# Unit of Work Definitions

## Unit 1: translation-module

### Overview
- **Name**: translation-module
- **Type**: Module (logical grouping within single Rust crate)
- **Purpose**: Hoàn thiện toàn bộ translation pipeline — từ đọc subtitles, chunking, gọi AI providers, đến ghi kết quả vào disk

### Responsibilities
1. **Config loading**: Đọc `AppSettings` từ `~/.tauri-translate-app/settings.json`
2. **Chunking**: Chia `Vec<SubtitleCue>` thành chunks theo `chunk_size` trong settings
3. **Provider abstraction**: Tạo đúng provider (OpenAI/Gemini/DeepSeek) với credentials
4. **Translation**: Gọi AI provider cho từng chunk, collect results và errors
5. **Merging**: Gộp translated chunks theo thứ tự, điền `translated_content` vào subtitles
6. **Persistence**: Ghi đè `subtitles.json`, cập nhật `project.json` translation status
7. **Error resilience**: Skip failed chunks, tiếp tục, báo partial status

### Files Owned
| File | Status | Change Type |
|------|--------|-------------|
| `src-tauri/Cargo.toml` | Exists | Modify — add 3 deps |
| `src-tauri/src/translation/mod.rs` | Missing | Create NEW |
| `src-tauri/src/translation/models.rs` | Skeleton | Modify — add AppSettings |
| `src-tauri/src/translation/chunk_builder.rs` | Partial | Modify — fix imports + new() |
| `src-tauri/src/translation/providers/openai.rs` | Skeleton | Modify — full impl |
| `src-tauri/src/translation/providers/gemini.rs` | Empty | Create full impl |
| `src-tauri/src/translation/providers/deepseek.rs` | Empty | Create full impl |
| `src-tauri/src/translation/provider_factory.rs` | Incomplete | Modify — fix factory |
| `src-tauri/src/translation/service.rs` | Skeleton | Modify — full pipeline |
| `src-tauri/src/lib.rs` | Exists | Modify — add mod + command |
| `src-tauri/src/commands.rs` | Exists | Modify — add command handler |

### Entry Points
- **Tauri Command**: `translate_project(project_id: String) -> Result<(), String>`
- Called from frontend via `invoke("translate_project", { projectId })`

### Key Interfaces
- **Translator trait** (`providers/mod.rs`): `async fn translate(request: TranslationRequest) -> anyhow::Result<TranslationResult>`
- **TranslationService**: `async fn translate_project(&self, project_id: &str) -> anyhow::Result<()`

### Data Contracts
- **Input**: `subtitles.json` array of `SubtitleCue` with `content` field
- **Output**: Same `subtitles.json` with `translated_content` field populated
- **Config**: `~/.tauri-translate-app/settings.json` with provider config
- **Status update**: `project.json` → `processing.translation_status`
