# Unit Test Instructions — Video Editor Feature

## Frontend Tests

### Run TypeScript Type Checking (Static Analysis)
```bash
cd /Users/maiphan/n8n/tauri-app
npx tsc --noEmit
```
**Expected**: 0 errors. This verifies all type contracts between store, components, and Tauri wrappers.

### Manual Verification (No automated test runner configured)
Since no test framework (vitest/jest) is currently configured in this project, verify manually:

1. **Store Actions**: Open app, navigate to Editor tab → should load mock project data
2. **Subtitle CRUD**: Edit text in table → `isDirty` indicator appears on tab
3. **Style Presets**: Click different presets in right panel → subtitle overlay changes style
4. **Overlay Panel**: Click effect buttons → items appear in list, eye toggle works
5. **Save**: Click "Lưu" button → saves (once backend is connected)

## Backend Tests

### Run Rust Compilation Check
```bash
cd /Users/maiphan/n8n/tauri-app/src-tauri
cargo check
```
**Expected**: 0 errors, 0 warnings.

### Validation Unit Tests (Future)
The validation module (`editor/validation.rs`) has pure functions suitable for unit testing:
- `validate_subtitles` — test with valid/invalid timing
- `validate_style` — test with out-of-range values
- `validate_overlays` — test with over-limit instances

To add tests later:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_subtitles_valid() {
        let cues = vec![SubtitleCue { id: "1".into(), start_time: 0.0, end_time: 3.0, .. }];
        assert!(validate_subtitles(&cues).is_ok());
    }

    #[test]
    fn test_validate_subtitles_invalid_timing() {
        let cues = vec![SubtitleCue { id: "1".into(), start_time: 5.0, end_time: 2.0, .. }];
        assert!(validate_subtitles(&cues).is_err());
    }
}
```
