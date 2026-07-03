# Bug Fix Plan — Settings UI + History Load

## Bug 1: Tab Lịch sử — Không load được danh sách project

### Root Cause
Path mismatch giữa `create_project` và `load_history`:

- **Write path** (`create_project` trong `project/builder.rs`):
  - Lưu project JSON vào `~/.tauri-translate-app/projects/{id}/project.json` (bên trong subdirectory)
  
- **Read path** (`load_history` trong `commands/project.rs`):
  - Gọi `project_file_path(id)` → resolves thành `~/.tauri-translate-app/projects/{id}.json` (file ở root level)

**Kết quả**: `load_history` tìm `{id}.json` nhưng file thực tế nằm ở `{id}/project.json` → file.exists() = false → skip → trả về empty list.

### Fix
Sửa `project_file_path()` trong `storage.rs` để trỏ đúng vào `projects/{id}/project.json` thay vì `projects/{id}.json`.

---

## Bug 2: Tab Cài đặt — Layout chỉ chiếm ~50% độ rộng

### Root Cause
File `settings.css` có rule:
```css
.settings-page {
  max-width: 780px;
}
```

Trong khi `main` element (parent) có `flex: 1` cho phép chiếm full width. Tab Home và History không có constraint `max-width` nên hiển thị full width. Tab Settings bị giới hạn ở 780px → trên màn hình lớn chỉ hiện ~50%.

### Fix
1. Xóa `max-width: 780px` khỏi `.settings-page`
2. Thay bằng layout full-width tương tự `.history-page` (no max-width constraint)
3. Cải thiện `.settings-card` sử dụng grid layout cho form fields

---

## Bug 3: Danh sách model hardcode — Nên load từ API

### Root Cause
`MODELS_BY_PROVIDER` trong `Settings/index.tsx` là object literal hardcoded. Khi provider thêm model mới, app không tự cập nhật.

### Fix
1. **Backend**: Thêm Tauri command `list_models(provider, api_key)` gọi API của provider để lấy danh sách models
2. **Frontend**: Khi user chọn provider VÀ đã nhập API key → gọi `list_models` để fetch danh sách. Fallback về hardcoded list nếu API call fail hoặc chưa có key.

### API Endpoints:
- **OpenAI**: `GET https://api.openai.com/v1/models` (Header: `Authorization: Bearer {key}`)
- **Gemini**: `GET https://generativelanguage.googleapis.com/v1beta/models?key={key}`
- **DeepSeek**: `GET https://api.deepseek.com/models` (Header: `Authorization: Bearer {key}`)

---

## Execution Steps

| # | File | Change |
|---|------|--------|
| 1 | `src-tauri/src/storage.rs` | Fix `project_file_path()` → `projects/{id}/project.json` |
| 2 | `src/pages/Settings/settings.css` | Remove `max-width: 780px`, adjust layout |
| 3 | `src-tauri/src/commands/project.rs` | Add `list_models` command |
| 4 | `src-tauri/src/commands/mod.rs` | Re-export `list_models` |
| 5 | `src-tauri/src/lib.rs` | Register `list_models` in invoke_handler |
| 6 | `src/lib/tauri.ts` | Add `listModels()` frontend wrapper |
| 7 | `src/lib/types.ts` | Add `ModelInfo` type |
| 8 | `src/pages/Settings/index.tsx` | Use dynamic model loading with fallback |

---

## Verification
- `cargo check` — no Rust compilation errors
- `npx tsc --noEmit` — no TypeScript errors
- Manual: Confirm History loads existing projects
- Manual: Confirm Settings page uses full width
- Manual: Confirm model list loads when API key present
