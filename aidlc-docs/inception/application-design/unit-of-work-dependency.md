# Unit of Work — Dependency Matrix

## Unit Dependencies

| Unit | Depends On | Type | Notes |
|------|-----------|------|-------|
| translation-module | storage.rs | Runtime | Đọc/ghi subtitles.json, project.json, settings.json |
| translation-module | Cargo deps (reqwest, async-trait, anyhow) | Build | HTTP client + error handling |
| translation-module | OpenAI API | External | HTTPS REST API |
| translation-module | Gemini API | External | HTTPS REST API |
| translation-module | DeepSeek API | External | HTTPS REST API |

## File-Level Dependency Order (trong unit)

```
Cargo.toml
    |
    v
translation/mod.rs
    |
    v
translation/models.rs  (TranslationSegment, TranslationRequest, TranslationResult, AppSettings)
    |
    +---> translation/chunk_builder.rs  (uses TranslationSegment)
    |
    +---> translation/providers/mod.rs  (Translator trait — đã có)
              |
              +---> translation/providers/openai.rs    (implements Translator)
              +---> translation/providers/gemini.rs    (implements Translator)
              +---> translation/providers/deepseek.rs  (implements Translator)
                        |
                        v
              translation/provider_factory.rs  (uses all providers + Translator trait)
                        |
                        v
              translation/service.rs  (uses factory + chunk_builder + storage + models)
                        |
                        v
              lib.rs  (mod translation declaration)
                        |
                        v
              commands.rs  (translate_project command)
```

## External Dependencies to Add (Cargo.toml)

| Crate | Version | Features | Reason |
|-------|---------|----------|--------|
| `reqwest` | `0.11` | `json`, `rustls-tls` | Async HTTP client cho AI APIs |
| `async-trait` | `0.1` | — | Cho `Translator` trait async fn |
| `anyhow` | `1` | — | Error type trong providers |
| `tokio` | `1` | `full` | Async runtime (có thể đã có qua Tauri — verify) |

## No Cross-Unit Dependencies
Chỉ có 1 unit nên không có inter-unit dependencies.
