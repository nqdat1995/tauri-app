# Technology Stack

## Programming Languages
- Rust (edition 2021) — Backend, business logic, Tauri commands
- TypeScript/JavaScript — Frontend (Tauri webview)

## Frameworks
- Tauri 2.x — Desktop app framework (Rust + WebView)
- async_trait — Async trait support in Rust (cần thêm Cargo.toml)

## Core Libraries (Cargo.toml — hiện tại)
- `serde` 1.x + `serde_json` 1.x — JSON serialization
- `dirs` 4.x — Home directory path resolution
- `ureq` 2.x — Synchronous HTTP client (dùng cho sidecar)
- `uuid` 1.x (v4 feature) — UUID generation
- `chrono` 0.4 (serde feature) — Timestamps

## Libraries Cần Thêm
- `reqwest` — Async HTTP client cho AI provider API calls
- `async-trait` — Async fn trong Rust traits
- `anyhow` — Error handling

## Build Tools
- Cargo — Rust package manager
- Tauri Build — Tauri build toolchain
- tauri-build — Build script dependency

## Tauri Plugins
- `tauri-plugin-opener` 2.x — Open files/URLs
- `tauri-plugin-dialog` 2.7.1 — File picker dialogs

## External Services / Integrations
- Whisper (via sidecar HTTP) — Speech-to-text
- OpenAI API — Translation
- Google Gemini API — Translation (TODO)
- DeepSeek API — Translation (TODO)
- FFmpeg (system binary) — Thumbnail generation

## Storage
- Local filesystem (`~/.tauri-translate-app/`) — JSON-based project storage
