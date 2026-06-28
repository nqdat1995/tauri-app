# STACK

## Frontend
- React 18
- TypeScript 5
- Vite 6 as the frontend bundler/dev server
- Browser DOM APIs for file selection, video metadata, and object URL handling
- CSS via `src/styles.css` and component-level class names

## Desktop Shell
- Tauri 2 for desktop packaging and runtime
- Rust backend with `tauri` crate
- `@tauri-apps/api` for frontend-to-native integration
- `@tauri-apps/plugin-opener` for opening external URLs/files from the app

## Build & Tooling
- npm package manager
- Vite development server and production build
- TypeScript compiler for type checking
- Tauri CLI for bundling native desktop artifacts

## Runtime
- `npm run dev` starts Vite and serves the frontend at the Tauri dev URL
- `npm run build` compiles the frontend assets and packages with Tauri
- The app is designed to run as a fullscreen native window
