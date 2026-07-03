# API Documentation

## Tauri IPC Commands (Frontend → Backend)

### greet
- **Purpose**: Demo/test command
- **Request**: `{ name: string }`
- **Response**: `string`

### enqueue_job
- **Purpose**: Bắt đầu upload + STT processing cho một video
- **Request**: `QueueRequest { job_id, video_path, video_name, language, size, duration?, width?, height? }`
- **Response**: `Result<String, String>` — job_id nếu success

### cancel_pending_jobs
- **Purpose**: Cancel tất cả jobs đang ở trạng thái Queued
- **Request**: Không có params
- **Response**: `Result<usize, String>` — số jobs đã cancel

### start_sidecar
- **Purpose**: Đảm bảo Whisper sidecar đang chạy
- **Request**: Không có params
- **Response**: `Result<u16, String>` — port number

### save_project
- **Purpose**: Lưu project JSON vào file system
- **Request**: `{ json: string }` — serialized project JSON với `id` field
- **Response**: `Result<String, String>` — file path

### get_file_metadata
- **Purpose**: Lấy metadata của file (hiện tại chỉ có size)
- **Request**: `{ path: string }`
- **Response**: `Result<FileMetadata, String>` — `{ size: u64 }`

## Tauri Events (Backend → Frontend)

### upload_progress
- **Payload**: `JobEvent { job_id, status, message?, progress?, updated_at }`
- **Status values**: `queued | running | calling_whisper | parsing_subtitle | creating_project | extracting_thumbnail | saving_files | completed | cancelled | failed`
- **Purpose**: Real-time job progress updates

## External APIs (Translation Providers)

### OpenAI Chat Completions
- **URL**: `https://api.openai.com/v1/chat/completions`
- **Method**: POST
- **Auth**: Bearer token (API key)
- **Request Format**:
  ```json
  {
    "model": "gpt-4o-mini",
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "..." }
    ],
    "temperature": 0.3
  }
  ```
- **Response**: Parsed translated segments JSON

### Google Gemini
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Method**: POST
- **Auth**: API key in URL query param or header
- **Purpose**: AI translation (TO BE IMPLEMENTED)

### DeepSeek
- **URL**: `https://api.deepseek.com/chat/completions`
- **Method**: POST
- **Auth**: Bearer token
- **Note**: OpenAI-compatible API format
- **Purpose**: AI translation (TO BE IMPLEMENTED)

## Internal APIs (Rust Traits & Structs)

### Translator trait
```rust
#[async_trait]
pub trait Translator: Send + Sync {
    async fn translate(
        &self,
        request: TranslationRequest
    ) -> anyhow::Result<TranslationResult>;
}
```

### TranslationService (target interface)
```rust
impl TranslationService {
    pub async fn translate_project(
        &self,
        project_id: &str
    ) -> anyhow::Result<()>
}
```

## Data Models

### TranslationSegment
```rust
pub struct TranslationSegment {
    pub id: usize,
    pub start: String,    // timecode "00:00:01,000"
    pub end: String,      // timecode "00:00:03,500"
    pub text: String,     // original subtitle text
}
```

### TranslationRequest
```rust
pub struct TranslationRequest {
    pub source_language: String,
    pub target_language: String,
    pub segments: Vec<TranslationSegment>,
}
```

### TranslationResult
```rust
pub struct TranslationResult {
    pub segments: Vec<TranslationSegment>, // same segments with translated text
}
```

### Project JSON Schema (project.json)
```json
{
  "id": "uuid",
  "name": "video_name",
  "project_type": "video",
  "schema_version": 2,
  "status": "completed",
  "source": { "path": "...", "size": 0 },
  "media": { "duration": 0, "width": 0, "height": 0, "thumbnail_path": "..." },
  "assets": { "subtitle_json": "subtitles.json" },
  "processing": {
    "stt_status": "completed",
    "translation_status": "pending",
    "error": null
  }
}
```
