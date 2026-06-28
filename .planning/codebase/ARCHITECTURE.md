# ARCHITECTURE

## High-level architecture
- This is a hybrid desktop app built with Tauri.
- The runtime combines a React-based frontend and a Rust-based native backend.
- The frontend is served by Vite during development and packaged as static assets for production.
- The Rust backend initializes Tauri, registers commands, and exposes native APIs.

## Frontend architecture
- `src/main.ts` boots the React app into the DOM element with id `#app`.
- `src/App.tsx` is the top-level application shell and manages page-level routing via local state.
- Application pages are defined under `src/pages/` and rendered dynamically from `App.tsx`.
- Shared UI pieces live in `src/components/`.
- Theme variables are applied at runtime through `src/config/ui.ts`.

## Backend architecture
- `src-tauri/src/lib.rs` sets up the Tauri builder and loads the `tauri_plugin_opener` plugin.
- A simple `greet` command is exposed for future Rust command invocation from the frontend.
- `src-tauri/src/main.rs` launches the Tauri runtime in production.

## User flow
1. App starts in fullscreen mode and loads the React UI.
2. User navigates between tabs using `Sidebar`.
3. `Home` allows video selection and preview metadata extraction.
4. Additional pages (`History`, `Editor`, `SRT sang Audio`, `Settings`) present scaffolding for future features.

## Deployment flow
- Development: `npm run dev` with Vite and Tauri dev server.
- Production: `npm run build` to compile assets and package via Tauri.

## Architectural constraints
- Strong coupling to Tauri for desktop shell behavior.
- Browser-only video handling is currently the primary content-processing path.
- Native functionality is available but minimal at present.
