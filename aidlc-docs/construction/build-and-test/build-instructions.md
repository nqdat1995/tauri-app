# Build Instructions

## Prerequisites

- **Build Tool**: Cargo (Rust) + Tauri CLI v2
- **Rust**: stable toolchain (1.77+)  —  `rustup update stable`
- **Node.js**: 18+ (cho Tauri frontend build)
- **Environment Variables**: không bắt buộc cho build; API keys được đọc từ `~/.tauri-translate-app/settings.json` ở runtime
- **System Requirements**: Windows 10+, 4GB RAM, 2GB disk

## Build Steps

### 1. Cài đặt Rust dependencies

```bash
cd src-tauri
cargo fetch
```

### 2. Check compilation (nhanh, không tạo binary)

```bash
cd src-tauri
cargo check
```

**Expected output**: `Finished \`dev\` profile [unoptimized + debuginfo] target(s) in Xs`

### 3. Build debug binary

```bash
cd src-tauri
cargo build
```

**Expected output**: `Finished \`dev\` profile ... target(s) in Xs`
**Artifact**: `src-tauri/target/debug/tauri-app.exe` (Windows)

### 4. Build release binary

```bash
cd src-tauri
cargo build --release
```

**Artifact**: `src-tauri/target/release/tauri-app.exe`

### 5. Full Tauri app build (với frontend)

```bash
# Từ workspace root
npm install        # hoặc yarn / pnpm install
npm run tauri build
```

**Artifacts**: `src-tauri/target/release/bundle/`

### 6. Verify Build Success

- `cargo check` — không có errors, chỉ warnings là OK
- `cargo build` — binary được tạo trong `target/debug/`
- Không có `error[EXXXX]` trong output

## Troubleshooting

### `error[E0432]: unresolved import`
- **Cause**: Module chưa được khai báo trong `mod.rs` hoặc `lib.rs`
- **Solution**: Kiểm tra `src/lib.rs` có `mod translation;` và `src/translation/mod.rs` có các `pub mod` đầy đủ

### `error[E0425]: cannot find function`
- **Cause**: Function chưa được import hoặc tên sai
- **Solution**: Kiểm tra `use` statements ở đầu file

### `reqwest` SSL errors khi build
- **Cause**: Missing OpenSSL dev headers
- **Solution**: Cargo feature `rustls-tls` đã được dùng thay vì native-tls — không cần OpenSSL

### `async-trait` not found
- **Cause**: Dependency chưa được thêm vào Cargo.toml
- **Solution**: Kiểm tra `Cargo.toml` có dòng `async-trait = "0.1"`
