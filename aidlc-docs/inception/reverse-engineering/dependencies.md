# Dependencies

## Internal Module Dependencies

```
lib.rs
  --> commands.rs
  --> orchestrator.rs
  --> storage.rs

commands.rs
  --> orchestrator.rs
  --> storage.rs

orchestrator.rs
  --> storage.rs

translation/service.rs (planned)
  --> translation/models.rs
  --> translation/chunk_builder.rs
  --> translation/provider_factory.rs
  --> translation/providers/mod.rs
  --> storage.rs

translation/provider_factory.rs
  --> translation/providers/openai.rs
  --> translation/providers/gemini.rs
  --> translation/providers/deepseek.rs
  --> translation/providers/mod.rs (Translator trait)

translation/chunk_builder.rs
  --> translation/models.rs

providers/openai.rs
  --> translation/providers/mod.rs (Translator trait)
  --> translation/models.rs
```

## External Dependencies (Cargo.toml)

### Hiện có:
- `tauri` 2 — App framework
- `tauri-plugin-opener` 2 — File opener
- `tauri-plugin-dialog` 2.7.1 — Dialog UI
- `serde` 1 (derive) — Serialization
- `serde_json` 1 — JSON
- `dirs` 4 — Home directory
- `ureq` 2 — Sync HTTP (sidecar calls)
- `uuid` 1 (v4) — UUID generation
- `chrono` 0.4 (serde) — Datetime

### Cần thêm:
- `reqwest` (features: json, blocking hoặc async) — Async HTTP cho AI APIs
- `async-trait` — Cho `Translator` trait
- `anyhow` — Error type trong providers
- `tokio` (có thể đã có qua Tauri, cần verify) — Async runtime

## Build Dependencies
- `tauri-build` 2 — Build scripts cho Tauri
