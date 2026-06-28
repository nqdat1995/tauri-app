# INTEGRATIONS

## Tauri Integration
- `src-tauri/tauri.conf.json` configures the desktop app shell, dev URL, build assets, and window settings
- `src-tauri/src/lib.rs` initializes the Tauri runtime and registers the `greet` command
- `src-tauri/src/main.rs` is the platform entrypoint that launches the library backend

## Tauri Plugins
- `tauri-plugin-opener` is integrated and initialized in `src-tauri/src/lib.rs`
  - This plugin enables opening external links or files from inside the Tauri app

## Frontend Native Bridge
- The frontend imports `@tauri-apps/api/window` to call `getCurrentWindow()` and manipulate the browser window
- Window operations include maximizing and toggling fullscreen mode in `src/App.tsx`

## Local Browser Features
- The app uses HTML file input to select local video files
- `URL.createObjectURL()` and `URL.revokeObjectURL()` handle temporary access to selected files
- Video metadata and thumbnail extraction are performed entirely in the browser environment

## External Services
- No third-party cloud APIs or network integrations are present in the current codebase
- There is no existing networking layer or remote backend integration defined yet
