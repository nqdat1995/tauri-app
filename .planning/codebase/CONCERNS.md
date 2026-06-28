# CONCERNS

## Stability and quality
- The app uses browser file APIs and video metadata extraction, which may behave inconsistently across different platforms.
- There is no error handling around video loading, metadata capture, or file selection.
- `URL.createObjectURL()` is revoked, but leaking object URLs is still possible if state changes are mishandled.

## Architecture risks
- The Rust backend is minimal and currently only exposes a single `greet` command.
- Most app logic is in the frontend, which limits reuse of native desktop capabilities.
- The design is tightly coupled to Tauri, so moving away from it would require a significant rewrite.

## Security and packaging
- `tauri.conf.json` disables CSP by setting `csp: null`, which reduces content security protections.
- The app bundles launcher icons for multiple platforms, but there is no explicit packaging policy or code-signing guidance.

## Missing features and gaps
- No persistence layer for history, settings, or processed video outputs.
- `History`, `Editor`, `SRT sang Audio`, and `Settings` pages are currently placeholders.
- No state management or centralized store exists, so cross-page data sharing will require additional infrastructure.

## Future concerns
- Adding real translation, speech, or SRT processing will require careful design around async work, file size handling, and performance.
- If the app adds native file system or external service access, it should enforce strict Tauri security settings and avoid broad CSP disablement.
