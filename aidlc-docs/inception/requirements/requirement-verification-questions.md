# Requirements Verification Questions — Video Editor Feature

Dựa trên mockup `video-editor-design.png` và kiến trúc hiện tại, vui lòng trả lời các câu hỏi sau để làm rõ phạm vi và yêu cầu cho tính năng "Trình chỉnh sửa video".

---

## Question 1
Phạm vi chức năng video editor bao gồm những gì?

A) Chỉ chỉnh sửa phụ đề (text, timing) + style phụ đề (font, màu, nền) — không xuất video thực tế

B) Chỉnh sửa phụ đề + style + xuất video mới có burn-in phụ đề (dùng FFmpeg render)

C) Chỉnh sửa phụ đề + style + xuất video + tạo lại audio (TTS từ phụ đề dịch)

D) Toàn bộ: chỉnh sửa phụ đề + style + overlay (logo/watermark) + xuất video + tạo lại audio

E) Other (please describe after [Answer]: tag below)

[Answer]: Chia làm 2 giai đoạn:
- Giai đoạn 1: A + lưu lại thông tin mà người dùng edit nhằm mục đích sử dụng cho việc xuất video trong tương lai
- Giai đoạn 2: Thực hiện xuất video theo đúng những gì mà người dùng đã edit

---

## Question 2
Video player trong editor có cần phát video thực tế (real playback) hay chỉ cần hiển thị UI placeholder (mockup)?

A) Phát video thực tế từ file local (sử dụng HTML5 video + asset:// protocol)

B) UI placeholder — không cần phát video thực, chỉ cần giao diện đẹp để demo

C) Phát video thực tế + hiển thị subtitle overlay đồng bộ theo thời gian

D) Other (please describe after [Answer]: tag below)

[Answer]: C + hiển thị subtitle với đúng style mà người dùng đã chọn

---

## Question 3
Dữ liệu cho editor lấy từ đâu?

A) Từ project đã hoàn thành STT (load từ `projects/{id}/subtitles.json` + `project.json`)

B) Từ project trong History — user chọn project từ tab Lịch sử rồi mở trong Editor

C) Cả hai: có thể mở từ History hoặc tự động mở sau khi STT hoàn thành

D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 4
Chức năng "Xuất Video" cụ thể làm gì ở backend (Rust)?

A) Gọi FFmpeg để burn-in subtitle vào video gốc → tạo file video mới

B) Chỉ xuất file SRT/ASS (file phụ đề) — không render video

C) Xuất file SRT + option burn-in video (user chọn)

D) Xuất video + tạo audio mới từ TTS (text-to-speech từ bản dịch)

E) Other (please describe after [Answer]: tag below)

[Answer]: Chỉ thực hiện xuất video trong giai đoạn 2. Thực hiện gọi sidecar để tạo audio mới từ TTS, sau đó thực hiện gọi FFmpeg để tạo file video mới

---

## Question 5
Chức năng "Tạo lại âm thanh" (Recreate Audio) hoạt động thế nào?

A) Gọi TTS API (text-to-speech) từ văn bản dịch → tạo audio track mới → ghép vào video

B) Chỉ là placeholder/UI button — chưa cần implement backend

C) Gọi TTS API + cho phép user chọn giọng/ngôn ngữ trước khi tạo

D) Other (please describe after [Answer]: tag below)

[Answer]: Gọi sidecar để tạo audio mới từ TTS. Tôi sẽ cung cấp thông tin API khi thực hiện tới giai đoạn 2

---

## Question 6
Subtitle style (font, màu, nền, vị trí) được lưu trữ như thế nào?

A) Lưu vào `project.json` → mỗi project có style riêng

B) Lưu riêng thành file style preset (`styles.json`) ở app level — dùng chung cho mọi project

C) Cả hai: có global presets + mỗi project lưu active style trong `project.json`

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
Khi user chỉnh sửa phụ đề (thay đổi text, timing, xóa), thay đổi được lưu khi nào?

A) Auto-save: mỗi thay đổi lưu ngay vào `subtitles.json`

B) Manual save: user bấm nút "Lưu" mới persist

C) Auto-save sau debounce (vd: 2 giây không thay đổi thì lưu)

D) Other (please describe after [Answer]: tag below)

[Answer]: B + ngoài phụ đề có sẵn thì cho phép người dùng thêm mới phụ đề

---

## Question 8
Tab "Overlay" trong Style Panel (như mockup) cần implement gì?

A) Implement đầy đủ: thêm hình ảnh/logo/watermark lên video

B) Chỉ tạo UI shell (placeholder) — implement sau

C) Không cần — bỏ tab Overlay

D) Other (please describe after [Answer]: tag below)

[Answer]: Cho phép người dùng thêm:
- Nền phủ: Chọn màu + Độ rõ
- Kính mờ: Chọn màu + Độ rõ
- Hiệu ứng gương
- Chữ
- Logo
- Watermark
Tất cả các hiệu ứng đều có các tính năng chung sau: Thay đổi kích cỡ, vị trí, enable/disable

---

## Question 9
Editor mở project nào khi user click vào tab "Trình chỉnh sửa"?

A) Mở project gần nhất (most recently processed)

B) Hiển thị danh sách project để user chọn

C) Trống (empty state) — user phải chọn project từ History trước

D) Mở project cuối cùng mà user đã edit

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
Backend Tauri commands cần thêm cho editor — xác nhận phạm vi:

A) Chỉ cần commands đọc/ghi subtitle + style (CRUD cơ bản) — không cần FFmpeg export trong phase này

B) Cần full commands: đọc/ghi subtitle + style + FFmpeg video export + TTS audio

C) CRUD subtitle + style + FFmpeg video export (không TTS)

D) Other (please describe after [Answer]: tag below)

[Answer]: Chia làm 2 giai đoạn:
- Giai đoạn 1: A + lưu lại thông tin mà người dùng edit nhằm mục đích sử dụng cho việc xuất video trong tương lai
- Giai đoạn 2: Thực hiện xuất video theo đúng những gì mà người dùng đã edit

---
