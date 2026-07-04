# Build Instructions — Video Editor Feature

## Prerequisites
- **Rust**: stable (edition 2021)
- **Node.js**: >=18.x
- **npm**: >=9.x
- **Tauri CLI**: v2.x
- **System**: macOS / Windows / Linux

## Build Steps

### 1. Install Frontend Dependencies
```bash
cd /Users/maiphan/n8n/tauri-app
npm install
```
This installs `zustand`, `react-rnd`, and all existing dependencies.

### 2. Verify TypeScript Compilation
```bash
npx tsc --noEmit
```
**Expected**: 0 errors.

### 3. Build Frontend (Vite)
```bash
npx vite build
```
**Expected**: `✓ built in ~1s`, outputs to `dist/`.

### 4. Check Rust Backend
```bash
cd src-tauri
cargo check
```
**Expected**: `Finished dev profile`, 0 errors, 0 warnings.

### 5. Full Tauri Build (optional — for production)
```bash
cd /Users/maiphan/n8n/tauri-app
npx tauri build
```
**Expected**: Produces platform-specific installer in `src-tauri/target/release/bundle/`.

## Build Artifacts
- `dist/` — Frontend bundle (HTML + JS + CSS)
- `src-tauri/target/debug/tauri-app` — Debug binary
- `src-tauri/target/release/bundle/` — Release installer (after `tauri build`)

## Troubleshooting

### `Command get_recent_project not found`
This occurs if running the frontend without the Rust backend (dev mode without `tauri dev`). Use `npx tauri dev` to run both together.

### Missing `zustand` or `react-rnd`
Run `npm install` to ensure all dependencies are installed.
