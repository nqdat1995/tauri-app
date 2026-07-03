# Integration Test Instructions

## Purpose

Kiểm tra toàn bộ translation pipeline end-to-end: từ đọc subtitles.json → gọi AI provider → ghi kết quả.

## Test Scenarios

### Scenario 1: TranslationService với Mock Provider

Tạo một mock `Translator` trả về kết quả cố định mà không cần gọi API thực:

```rust
// src-tauri/src/translation/service_test.rs (hoặc trong service.rs #[cfg(test)])

#[cfg(test)]
mod integration_tests {
    use super::*;
    use async_trait::async_trait;
    use crate::translation::models::{TranslationRequest, TranslationResult, TranslationSegment};
    use crate::translation::providers::Translator;

    struct MockTranslator;

    #[async_trait]
    impl Translator for MockTranslator {
        async fn translate(&self, request: TranslationRequest) -> anyhow::Result<TranslationResult> {
            // Giả lập dịch: thêm prefix "[VI]" vào mỗi segment
            let segments = request.segments.into_iter().map(|s| {
                TranslationSegment {
                    id: s.id,
                    start: s.start,
                    end: s.end,
                    text: format!("[VI] {}", s.text),
                }
            }).collect();
            Ok(TranslationResult { segments })
        }
    }

    // Test: chunk splitting và merging kết quả đúng thứ tự
    #[tokio::test]
    async fn test_chunked_translation_preserves_order() {
        let translator = MockTranslator;
        let segments: Vec<TranslationSegment> = (0..10)
            .map(|i| TranslationSegment {
                id: i, start: "".into(), end: "".into(),
                text: format!("segment {}", i),
            }).collect();

        let builder = crate::translation::chunk_builder::ChunkBuilder::new(3);
        let chunks = builder.split(&segments);
        assert_eq!(chunks.len(), 4); // ceil(10/3) = 4

        let mut results = Vec::new();
        for chunk in chunks {
            let req = TranslationRequest {
                source_language: "en".into(),
                target_language: "vi".into(),
                segments: chunk,
            };
            let res = translator.translate(req).await.unwrap();
            results.extend(res.segments);
        }

        assert_eq!(results.len(), 10);
        assert_eq!(results[0].text, "[VI] segment 0");
        assert_eq!(results[9].text, "[VI] segment 9");
    }
}
```

### Scenario 2: E2E Pipeline với file thực (manual test)

**Setup**:
1. Tạo file `settings.json` ở `~/.tauri-translate-app/settings.json`:
```json
{
  "provider": "openai",
  "api_key": "sk-...",
  "model": "gpt-4o-mini",
  "target_language": "Vietnamese",
  "chunk_size": 30
}
```

2. Tạo một project test với `subtitles.json` có vài cues:
```json
[
  {"cue_id":"abc","sequence":1,"start_time":0,"end_time":3000,"duration":3000,"content":"Hello world","translated_content":null},
  {"cue_id":"def","sequence":2,"start_time":3000,"end_time":6000,"duration":3000,"content":"How are you","translated_content":null}
]
```

3. Gọi Tauri command từ frontend: `invoke("translate_project", { projectId: "test-id" })`

**Expected**:
- `subtitles.json` cập nhật với `translated_content` đã được điền
- `project.json` có `processing.translation_status = "completed"`

### Scenario 3: Partial Failure Handling

**Test**: Mock provider ném lỗi cho chunk đầu tiên, thành công cho chunk còn lại.

**Expected**:
- Segments từ chunk lỗi có `translated_content = null`
- Segments từ chunk thành công có `translated_content` được điền
- `project.json` có `translation_status = "partial"`
- `translation_errors` array chứa thông tin lỗi

## Chạy Integration Tests

```bash
cd src-tauri
cargo test integration_tests -- --nocapture
```

## Cleanup sau test

```bash
# Xóa project test
rm -rf ~/.tauri-translate-app/projects/test-id/
```
