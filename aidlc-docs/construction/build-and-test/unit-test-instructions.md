# Unit Test Execution Instructions

## Trạng thái hiện tại

Unit tests chưa được viết trong codebase này. Phần này hướng dẫn cách thêm và chạy tests.

## Cấu trúc Test Đề nghị

Thêm `#[cfg(test)]` modules vào cuối mỗi file nguồn:

```
src-tauri/src/translation/
├── chunk_builder.rs        ← thêm tests cho split logic
├── models.rs               ← thêm tests cho AppSettings default
├── provider_factory.rs     ← thêm tests cho ProviderType::from_str
└── service.rs              ← integration test với mock provider
```

## Test Cases Ưu tiên

### chunk_builder.rs

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::translation::models::TranslationSegment;

    fn make_segments(n: usize) -> Vec<TranslationSegment> {
        (0..n).map(|i| TranslationSegment {
            id: i, start: "00:00:00,000".into(),
            end: "00:00:01,000".into(), text: format!("line {}", i),
        }).collect()
    }

    #[test]
    fn split_exact_multiple() {
        let builder = ChunkBuilder::new(3);
        let segs = make_segments(6);
        let chunks = builder.split(&segs);
        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks[0].len(), 3);
    }

    #[test]
    fn split_with_remainder() {
        let builder = ChunkBuilder::new(3);
        let segs = make_segments(7);
        let chunks = builder.split(&segs);
        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[2].len(), 1);
    }

    #[test]
    fn split_empty() {
        let builder = ChunkBuilder::new(10);
        let chunks = builder.split(&[]);
        assert!(chunks.is_empty());
    }

    #[test]
    fn split_smaller_than_chunk_size() {
        let builder = ChunkBuilder::new(10);
        let segs = make_segments(3);
        let chunks = builder.split(&segs);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].len(), 3);
    }
}
```

### provider_factory.rs

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn from_str_case_insensitive() {
        assert!(matches!(ProviderType::from_str("openai"), Some(ProviderType::OpenAI)));
        assert!(matches!(ProviderType::from_str("OpenAI"), Some(ProviderType::OpenAI)));
        assert!(matches!(ProviderType::from_str("GEMINI"), Some(ProviderType::Gemini)));
        assert!(matches!(ProviderType::from_str("deepseek"), Some(ProviderType::DeepSeek)));
        assert!(ProviderType::from_str("unknown").is_none());
    }
}
```

### models.rs

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_settings_defaults() {
        let s = AppSettings::default();
        assert_eq!(s.provider, "openai");
        assert_eq!(s.chunk_size, 30);
        assert!(s.api_key.is_empty());
    }
}
```

## Chạy Tests

```bash
cd src-tauri
cargo test
```

**Expected output khi tests được thêm**:
```
running X tests
test translation::chunk_builder::tests::split_exact_multiple ... ok
test translation::chunk_builder::tests::split_with_remainder ... ok
...
test result: ok. X passed; 0 failed; 0 ignored
```

## Chạy Test Cụ Thể

```bash
# Chỉ chạy tests trong module translation
cargo test translation::

# Chạy một test cụ thể
cargo test split_exact_multiple

# Với output
cargo test -- --nocapture
```

## Coverage (tùy chọn)

```bash
# Cài tarpaulin
cargo install cargo-tarpaulin

# Chạy coverage
cargo tarpaulin --out Html
# Kết quả: tarpaulin-report.html
```
