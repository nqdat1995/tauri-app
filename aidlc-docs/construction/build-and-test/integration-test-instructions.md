# Integration Test Instructions — Video Editor Feature

## Purpose
Verify that Frontend ↔ Backend ↔ Filesystem work together end-to-end.

## Prerequisites
- A completed STT project must exist in `~/.tauri-translate-app/projects/{id}/`
- The project must have `project.json` and `subtitles.json`

## Test Scenarios

### Scenario 1: Load Project in Editor
1. Start app with `npx tauri dev`
2. Ensure at least one project exists (process a video via Home tab first)
3. Navigate to "Trình chỉnh sửa" tab
4. **Expected**: Editor loads the most recent project (toolbar shows filename, table shows subtitles)

### Scenario 2: Edit and Save
1. Load a project in editor
2. Edit a subtitle text (click on translated text, type new text)
3. Notice: Save button becomes active, dirty dot appears on tab
4. Click "Lưu" button
5. **Expected**: Save succeeds, dirty indicator disappears
6. Reload the tab → edited text persists

### Scenario 3: History → Editor Navigation
1. Navigate to "Lịch sử" tab
2. Find a completed project → click "Chỉnh sửa"
3. **Expected**: App switches to Editor tab, loads that specific project

### Scenario 4: Video Missing Error
1. Load a project in editor
2. Manually delete or rename the source video file on disk
3. Close and reopen the editor (switch tabs)
4. **Expected**: Error dialog "Video không tồn tại" appears → click OK → redirects to History

### Scenario 5: Unsaved Changes Dialog
1. Load a project, make an edit (dirty state)
2. Click a different tab (e.g., "Trang chủ")
3. **Expected**: Confirm dialog appears ("Bạn có thay đổi chưa lưu...")
4. Click Cancel → stays on editor
5. Click OK → discards changes, navigates away

### Scenario 6: Style Persistence
1. Load project, change subtitle style (select different preset)
2. Save
3. Reload editor
4. **Expected**: Previously selected style is still active

## Cleanup
No special cleanup needed — all changes are to local project files.
