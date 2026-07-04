# Video Editor UI - Construction Plan

## Goal
Build the "Trình chỉnh sửa" (Video Editor) tab UI based on the design mockup at `aidlc-docs/mockup/video-editor-design.png`.

## Design Analysis (from mockup)

### Layout Structure
The editor uses a **3-panel layout**:
1. **Main Content Area (left, ~70% width)**:
   - Top toolbar: project filename, metadata (duration, file size, resolution, processing time), status badge, action buttons ("Tạo lại âm thanh", "Xuất Video")
   - Video preview: large video player with overlay subtitle text
   - Playback controls: previous/play/next buttons, progress bar/timeline, current time / total time, volume, speed, subtitle toggle, fullscreen
   - Subtitle tab bar: "Phụ đề" tab active, "Sẵn sàng xuất file" status
   - Subtitle table: columns TIME | VĂN BẢN GỐC (original text) | VĂN BẢN DỊCH (translated text), each row has delete button

2. **Right Panel (~30% width)**:
   - Top actions: "Lưu preset" button, "Áp dụng" button
   - Tabs: "Style" | "Overlay"
   - Section: "Style phụ đề" with description
   - Preset grid: 4x3 grid of subtitle style presets (different background colors, text styles)
   - Selected preset indicator (checkmark)
   - Font settings section ("CHỮ"):
     - FONT CHỮ: dropdown "Hệ thống - Mặc định của hệ điều hành"
     - KÍCH THƯỚC: slider with value "22px"
     - MÀU CHỮ / MÀU NỀN: color pickers (yellow text, red background shown)
     - NỀN: dropdown "Hộp bo" | VỊ TRÍ: dropdown "Dưới"
     - ĐỘ MỜ NỀN: slider "92%"

3. **Page Header (top)**:
   - "Trình chỉnh sửa video" title
   - Right side: "Bản mới nhất" indicator, notification bell, settings gear, refresh

### UI Details
- Status badge: "Đã có phụ đề/giọng" (purple badge)
- File info: filename (UUID format), "13s · 5.9 MB · 2160x3840 · Xử lý: 31 giây"
- Video player has dark background with video centered
- Subtitle overlay shows styled text (red bg, white text in example)
- Timeline/seekbar: blue progress line with draggable handle
- Subtitle table rows are editable with inline text
- Right panel uses card-style containers with soft shadows

## Component Architecture

```
Editor/
├── index.tsx              — Main page layout orchestrator
├── EditorToolbar.tsx      — Top bar with file info + actions
├── VideoPlayer.tsx        — Video preview + controls + timeline
├── SubtitleTable.tsx      — Editable subtitle list
├── StylePanel.tsx         — Right sidebar (style presets + font settings)
└── editor.css             — All editor-specific styles
```

## Implementation Tasks

### 1. EditorToolbar
- Status badge ("Đã có phụ đề/giọng")
- Project filename display
- Metadata line (duration, size, resolution, processing time)
- "Tạo lại âm thanh" button
- "Xuất Video" primary button

### 2. VideoPlayer
- Video element with poster/thumbnail
- Subtitle overlay text (positioned bottom-center on video)
- Seekbar/timeline (custom styled progress bar)
- Control bar: skip prev, play/pause, skip next, time display, volume, speed selector, subtitle toggle, fullscreen

### 3. SubtitleTable
- Tab bar ("Phụ đề" active tab, export status indicator)
- Table header: TIME | VĂN BẢN GỐC | VĂN BẢN DỊCH
- Subtitle rows with:
  - Timecode (editable or display)
  - Original text (read-only or editable)
  - Translated text (editable)
  - Delete button per row
- Scrollable list

### 4. StylePanel
- "Lưu preset" / "Áp dụng" top action buttons
- "Style" / "Overlay" tab toggle
- Style phụ đề section:
  - 4x3 grid of preset style cards
  - Each card shows "Xin chào" with different styling
  - Selected state with checkmark
- Font settings ("CHỮ"):
  - Font family dropdown
  - Font size slider (px)
  - Text color picker
  - Background color picker
  - Background shape dropdown ("Hộp bo")
  - Position dropdown ("Dưới")
  - Background opacity slider (%)

## Data Model (for demo/mock state)
```typescript
interface SubtitleCue {
  id: string;
  startTime: number; // seconds
  endTime: number;
  originalText: string;
  translatedText: string;
}

interface SubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  bgColor: string;
  bgShape: 'box' | 'rounded' | 'none';
  position: 'top' | 'bottom';
  bgOpacity: number;
}

interface EditorProject {
  id: string;
  filename: string;
  duration: number;
  fileSize: number;
  width: number;
  height: number;
  processingTime: number;
  status: 'has_subtitle' | 'processing' | 'ready';
  videoPath: string;
  subtitles: SubtitleCue[];
  activeStyle: SubtitleStyle;
}
```

## Verification Criteria
- [ ] Editor page renders the 3-panel layout matching the mockup
- [ ] Video player area shows video with overlay subtitle
- [ ] Playback controls are functional (play/pause, seek, time display)
- [ ] Subtitle table displays rows with time, original, translated columns
- [ ] Right panel shows style presets grid and font settings
- [ ] All components use the existing design system (CSS variables, border-radius, shadows)
- [ ] Build compiles without errors
- [ ] Tab navigation from sidebar correctly shows the editor page
