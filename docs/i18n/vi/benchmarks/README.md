# Benchmark

Mọi con số mà OmniGlyph công bố đều đến từ một trong hai bộ khung dưới
đây — có thể chạy lại, tất định khi có thể, với bằng chứng thô cho từng
câu trả lời trong `*/results/*.jsonl`. Phân tích hợp nhất:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — một hình ảnh thực sự tốn bao nhiêu?

Các phép thử `count_tokens` miễn phí trên API Anthropic trực tiếp, so
sánh công thức đã bị loại bỏ `w·h/750` với mô hình patch 28 px hiện tại
trên 11 hình học phép thử, 2 mô hình × 2 tier độ phân giải.

**Kết quả (2026-07-05): mô hình patch khớp với độ dư BẰNG KHÔNG trên mọi
phép thử** — mức tính phí = `⌈w/28⌉ × ⌈h/28⌉` sau khi resize theo tier,
cộng thêm +3/+4 token cố định cho mỗi khối hình ảnh. Trang sản xuất
(1568×728) tốn đúng 1.460 token và chứa 28.080 ký tự ≈ **19,2
ký tự/token** so với ~2 ký tự/token khi là văn bản dày đặc.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # chỉ dự đoán, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # sweep trực tiếp, vẫn $0 (count_tokens miễn phí)
```

## 2. `density-frontier/` — mô hình có thực sự ĐỌC được không?

Chi phí (offline, chính xác) × độ chính xác đọc (trực tiếp) trên các cấu
hình render, hình học trang, atlas glyph và nhà cung cấp. Corpus cấy các
needle chuỗi chính xác (id hex 12 ký tự, camelCase, dãy chữ số) cộng với
**distractor gần-giống được xây dựng từ các cặp glyph dễ nhầm lẫn đã đo
lường** — để phát hiện bịa đặt âm thầm, không chỉ đếm là sai. Chấm điểm
tất định (không có LLM làm giám khảo): `correct` / `abstained` (`ILEGIVEL`
trung thực) / `silent_wrong` / `no_answer`.

**Kết quả chính** (n=30 mỗi nhánh):

| nhánh | đọc chính xác | ghi chú |
|---|---:|---|
| Fable 5 · trang tiêu chuẩn · atlas 1-bit (sản xuất) | **30/30** | không lỗi, không bịa đặt |
| Fable 5 · trang tiêu chuẩn · atlas AA (mặc định cũ) | 25/30 | 5 lần từ chối đọc trung thực — lý do sản xuất chuyển sang 1-bit |
| Fable 5 · trang độ phân giải cao 1928² | 1–2/30 | tính phí gấp 3,3× nhưng bị resample bởi bộ mã hóa — cái bẫy tính phí, không được kích hoạt |
| Opus 4.8 · glyph 10×16 | 23–26/30 | chế độ an toàn tùy chọn |
| GPT-5.5 · dải 768px (cả hai atlas) | 0/60 | + thổi phồng token output ~40× so với đối chứng văn bản của chính nó (30/30, 62 tok) |
| Gemini 2.5-flash (một phần, hạn ngạch) | 0/26 | bịa đặt thay vì từ chối trả lời |

Ba tầng vận chuyển: API trực tiếp (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), và `--via-cli` (gói đăng ký Claude
Code — $0). Bài học đắt giá: các bên trung gian (OpenRouter, công cụ Read
của CLI) resample các hình ảnh lớn; chỉ kết quả từ API trực tiếp mới đáng
tin cậy cho khả năng đọc.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # bảng chi phí, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # qua đăng ký, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Các bài kiểm thử đơn vị ghim phần thuần túy (corpus, chấm điểm, công thức
chi phí): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
