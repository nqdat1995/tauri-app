# System Architecture

## System Overview

Tauri Translate App là desktop application kết hợp Tauri v2 (Rust backend + Web frontend). Backend Rust xử lý hai pipeline chính:
1. **STT Pipeline**: Video → Whisper sidecar → SRT → Project JSON
2. **Translation Pipeline** (đang phát triển): Project subtitles → AI chunk translation → translated subtitles

## Architecture Diagram

```
+---------------------------+
|   Web Frontend (UI)       |
|   (TypeScript/React/etc.) |
+---------------------------+
             |  Tauri IPC (invoke_handler)
             v
+---------------------------+     +------------------+
|   commands.rs             |     |   AppState       |
|   - greet                 |     |   - queue        |
|   - save_project          |     |   - processing   |
|   - enqueue_job           |     |   - sidecar_state|
|   - cancel_pending_jobs   |     +------------------+
|   - start_sidecar         |
|   - get_file_metadata     |
+---------------------------+
             |
             v
+---------------------------+      +-------------------+
|   orchestrator.rs         |----->|  Whisper Sidecar  |
|   - Job Queue             |      |  (HTTP :PORT)     |
|   - STT Pipeline          |      |  /stt/whisper     |
|   - create_project()      |      |  /health          |
+---------------------------+      +-------------------+
             |
             v
+---------------------------+
|   translation/            |  (ĐANG PHÁT TRIỂN)
|   - service.rs            |----> OpenAI API
|   - chunk_builder.rs      |----> Gemini API
|   - provider_factory.rs   |----> DeepSeek API
|   - models.rs             |
|   - providers/            |
|     - mod.rs (trait)      |
|     - openai.rs           |
|     - gemini.rs (trống)   |
|     - deepseek.rs (trống) |
+---------------------------+
             |
             v
+---------------------------+
|   storage.rs              |
|   ~/.tauri-translate-app/ |
|   ├── app_data.json       |
|   └── projects/           |
|       └── {job_id}/       |
|           ├── project.json|
|           ├── subtitles.json|
|           └── media/      |
|               └── thumbnail.jpg|
+---------------------------+
```

## Component Descriptions

### commands.rs
- **Purpose**: Tauri command handlers — bridge giữa frontend và Rust logic
- **Dependencies**: orchestrator, storage
- **Type**: Application / IPC Layer

### orchestrator.rs
- **Purpose**: Job queue processor cho STT pipeline
- **Responsibilities**: Spawn sidecar, call Whisper HTTP, parse SRT, create project artifacts
- **Dependencies**: storage
- **Type**: Application / Business Logic

### translation/service.rs
- **Purpose**: Translation pipeline coordinator
- **Status**: SKELETON — chưa implement
- **Dependencies**: storage, chunk_builder, provider_factory, providers
- **Type**: Application / Business Logic

### translation/models.rs
- **Purpose**: Data structures cho translation domain
- **Responsibilities**: TranslationSegment, TranslationRequest, TranslationResult
- **Type**: Domain Models

### translation/chunk_builder.rs
- **Purpose**: Chia segments thành chunks
- **Status**: PARTIAL — thiếu `use` import cho TranslationSegment
- **Type**: Utility

### translation/provider_factory.rs
- **Purpose**: Factory tạo provider instances
- **Status**: INCOMPLETE — thiếu DeepSeek arm, thiếu imports, thiếu API key/config injection
- **Type**: Factory / DI

### translation/providers/mod.rs
- **Purpose**: Định nghĩa `Translator` trait
- **Status**: COMPLETE — trait đã đầy đủ
- **Type**: Interface / Trait

### translation/providers/openai.rs
- **Purpose**: OpenAI GPT translation implementation
- **Status**: SKELETON — method stubs chưa implement (build_prompt, call_api, parse_response, validate)
- **Type**: Infrastructure / External API Client

### translation/providers/gemini.rs
- **Purpose**: Google Gemini translation implementation
- **Status**: EMPTY — chưa có gì
- **Type**: Infrastructure / External API Client (TODO)

### translation/providers/deepseek.rs
- **Purpose**: DeepSeek translation implementation
- **Status**: EMPTY — chưa có gì
- **Type**: Infrastructure / External API Client (TODO)

### storage.rs
- **Purpose**: File system abstraction
- **Status**: COMPLETE — hoạt động tốt
- **Type**: Infrastructure / Persistence

## Data Flow — Translation Pipeline (Target)

```
Frontend invoke translate_project(project_id)
              |
              v
  TranslationService::translate_project()
              |
    [1] Read subtitles.json from storage
              |
    [2] Read project settings (provider, api_key, target_lang)
              |
    [3] provider_factory::create_provider(provider_type)
              |
    [4] chunk_builder::split(segments, max_segments)
              |
    [5] For each chunk:
          provider.translate(TranslationRequest) -> TranslationResult
              |
    [6] Merge all translated chunks
              |
    [7] Write translation.json to storage
              |
    [8] Update project.json translation_status = "completed"
```

## Integration Points
- **OpenAI API**: `https://api.openai.com/v1/chat/completions`
- **Google Gemini API**: `https://generativelanguage.googleapis.com/v1beta/...`
- **DeepSeek API**: `https://api.deepseek.com/chat/completions` (compatible với OpenAI format)
- **Whisper Sidecar**: Local HTTP server trên random port
