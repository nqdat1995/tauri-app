# Component Inventory

## Application Packages
- `tauri-app` (src-tauri/) — Rust backend Tauri application

## Frontend (chưa khám phá chi tiết)
- Frontend web app (TypeScript/React hoặc Svelte — cần xác nhận)

## Shared / Domain Modules
- `translation/models.rs` — Domain models (TranslationSegment, TranslationRequest, TranslationResult)
- `translation/providers/mod.rs` — Translator trait interface

## Infrastructure / Adapter Modules
- `storage.rs` — File system adapter
- `translation/providers/openai.rs` — OpenAI HTTP adapter
- `translation/providers/gemini.rs` — Gemini HTTP adapter (TODO)
- `translation/providers/deepseek.rs` — DeepSeek HTTP adapter (TODO)

## Business Logic Modules
- `orchestrator.rs` — STT job queue + pipeline
- `translation/service.rs` — Translation pipeline coordinator
- `translation/chunk_builder.rs` — Segment chunking logic
- `translation/provider_factory.rs` — Provider creation factory

## External Services
- Whisper Sidecar (Python/executable) — STT processing
- OpenAI API — AI translation
- Google Gemini API — AI translation
- DeepSeek API — AI translation

## Total Count
- **Total Files (src-tauri/src/)**: 11 files
- **Complete/Working**: 4 (lib.rs, commands.rs, storage.rs, providers/mod.rs)
- **Incomplete/Skeleton**: 5 (service.rs, chunk_builder.rs, provider_factory.rs, openai.rs, models.rs)
- **Empty/TODO**: 2 (gemini.rs, deepseek.rs)
