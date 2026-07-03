# Performance Test Instructions

## Scope

Translation module này là I/O bound (HTTP calls đến external AI APIs). Bottleneck chủ yếu là API latency, không phải CPU hay memory của app.

## Key Performance Considerations

| Metric | Notes |
|--------|-------|
| Chunk translation time | ~1-5s per chunk tùy model và chunk size |
| Total translation time | `num_chunks × avg_latency_per_chunk` |
| Memory usage | Proportional to `total_subtitle_text_size` — thường < 10MB |
| API rate limits | OpenAI: 500 RPM (tier 1); DeepSeek/Gemini: varies |

## Bottleneck: Sequential Chunk Processing

Hiện tại, các chunks được xử lý **tuần tự** (một chunk xong mới làm chunk tiếp theo). Với file 100 segments và chunk_size=30 → 4 chunks × ~2s = ~8s.

**Tối ưu tiềm năng (future)**: Xử lý chunks song song với `futures::join_all()` — có thể giảm 60-70% thời gian nhưng cần xử lý rate limiting.

## Manual Performance Test

### Test 1: Thời gian dịch một file nhỏ

**Setup**: File có 30 segments, chunk_size=30 (1 chunk)

**Steps**:
1. Ghi lại thời gian bắt đầu
2. Gọi `translate_project`
3. Ghi lại thời gian kết thúc

**Expected**: < 5 giây với gpt-4o-mini

### Test 2: Thời gian dịch file lớn

**Setup**: File có 300 segments, chunk_size=30 (10 chunks)

**Expected**: < 60 giây (10 × ~5s)

### Test 3: Behavior với chunk_size lớn

**Setup**: chunk_size=100, file có 100 segments (1 chunk)

**Risk**: Một số models có context limit. Nếu prompt quá lớn, API sẽ trả về lỗi.

**Recommendation**: Giữ chunk_size ≤ 50 để tránh context limit với các models nhỏ.

## N/A Tests

- **Load testing**: N/A — app là single-user desktop app
- **Concurrent users**: N/A — không có server
- **Throughput RPS**: N/A — không phải web service
