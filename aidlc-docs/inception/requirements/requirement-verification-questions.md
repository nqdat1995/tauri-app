# Requirements Verification Questions

Hãy điền câu trả lời vào thẻ `[Answer]:` của từng câu hỏi.
Nếu không có option nào phù hợp, chọn option cuối (X/Other) và mô tả sau thẻ `[Answer]:`.

---

## Question 1
Khi dịch một project, ứng dụng cần đọc thông tin API key và provider từ đâu?

A) Đọc từ file settings/config riêng trong project directory (ví dụ: `settings.json`)

B) Đọc từ một file config global của app (ví dụ: `~/.tauri-translate-app/settings.json`)

C) Frontend truyền thẳng xuống qua Tauri command khi gọi translate (API key, provider, target_lang là params của lệnh)

D) Đọc từ `.env` file trong workspace root

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
Khi dịch, kết quả translation được lưu ở đâu?

A) Ghi đè vào `subtitles.json` (thêm field `translated_content` vào từng cue)

B) Tạo file mới `translation.json` trong project directory (độc lập với subtitles.json)

C) Tạo file mới với tên theo ngôn ngữ đích, ví dụ: `subtitles_vi.json`

D) Ghi vào trong `project.json` trực tiếp

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
Prompt gửi lên AI provider cho việc dịch phụ đề cần theo format nào?

A) Gửi raw text và yêu cầu AI dịch, parse response bằng line matching (segment theo dòng)

B) Gửi JSON array của segments, yêu cầu AI trả về JSON array với các segment đã dịch (structured output)

C) Gửi từng segment một cách độc lập (1 API call / segment)

D) Gửi numbered list dạng `1. [text]`, yêu cầu AI trả về `1. [translated]` để parse theo số thứ tự

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
Với `ChunkBuilder`, tiêu chí split chunk là gì?

A) Chỉ theo số lượng segments (max N segments/chunk) — đơn giản nhất

B) Theo ước tính số tokens (dựa trên độ dài text) để không vượt context limit

C) Theo thời lượng phụ đề (ví dụ: max 2 phút/chunk)

D) Kết hợp: ưu tiên token limit, fallback về segment count

X) Other (please describe after [Answer]: tag below)

[Answer]: A, N sẽ được đọc từ một file config global của app

---

## Question 5
Khi một chunk bị lỗi khi dịch (API timeout, rate limit, bad response), behavior mong muốn là gì?

A) Retry chunk đó (tối đa 3 lần) rồi fail toàn bộ job nếu vẫn không được

B) Skip chunk lỗi, tiếp tục dịch các chunk còn lại, báo lỗi từng phần ở cuối

C) Fail ngay lập tức, không retry, trả về lỗi

D) Retry với exponential backoff (1s, 2s, 4s) rồi mới fail

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6
Frontend cần nhận progress updates khi đang dịch không?

A) Có — emit Tauri events theo từng chunk hoàn thành (tương tự `upload_progress` event trong STT pipeline)

B) Không cần — chỉ cần biết kết quả cuối cùng (success/fail)

C) Có — nhưng chỉ emit event khi bắt đầu và kết thúc (2 events)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7: Security Extension
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (suitable for simple CRUD, UI-only, or thin integration layers)

X) Other (please describe after [Answer]: tag below)

[Answer]: C
