# Billing sweep tính phí vision Anthropic

Sweep `count_tokens` miễn phí quyết định hai câu hỏi hình học còn mở:

1. **Công thức** — API tính phí theo patch `ceil(w/28) × ceil(h/28)`
   (tài liệu hiện tại) hay công thức đã bị loại bỏ `w·h/750`? Bộ phép thử
   phân tách hai công thức bằng 25–180 token mỗi hàng.
2. **Tier** — `claude-fable-5` có nhận được giới hạn độ phân giải cao
   (cạnh dài ≤ 2576 px, ≤ 4784 token thị giác) không? Hàng
   `page-old-1928x1928` là hàng quyết định: ≈ **4761** đo được nghĩa là
   độ phân giải cao WYSIWYG (trang lớn cũ chứa ~3,3× nhiều ký tự hơn mỗi
   hình ảnh so với trang 1568×728 hiện tại, ở cùng tỷ lệ ký tự/token); ≈
   **1521** nghĩa là resample tier tiêu chuẩn, và 1568×728 vẫn đúng.

Bối cảnh: sweep ngày 2026-07-01 đứng sau trang 1568×728 hiện tại (kiểm
toán khả năng đọc, 2026-07-01) được đo trên `claude-sonnet-4-5` — một mô
hình tier tiêu chuẩn — trong khi sản xuất nhắm đến Fable 5, mô hình mà
tài liệu vision xếp vào tier độ phân giải cao. Kiểm toán đó cũng đo được
trang hiện tại ở 1460 token: gần với 1456 của công thức patch hơn là
1522 của /750, gợi ý rằng API đã chuyển sang tính phí theo patch.

## Chạy

```bash
pnpm run build                              # tiền đề dist/ (như mọi eval)
node benchmarks/billing-sweep/run.mjs --dry-run   # chỉ dự đoán, không cần khóa, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Phải gọi API **trực tiếp** — không bao giờ qua proxy OmniGlyph, vì nó sẽ
biến đổi body. `count_tokens` miễn phí; sweep đầy đủ tạo ra ~25 request.

## Đọc hiểu output

Với mỗi mô hình, mỗi hàng phép thử hiển thị số token hình ảnh đo được
(có-hình-ảnh trừ đường cơ sở chỉ-văn-bản) đối chiếu với cả bốn dự đoán
(`patch`/`legacy750` × `standard`/`highres`); phần tóm tắt xếp hạng các
giả thuyết theo độ dư tuyệt đối trung bình. `--probe-multi` kiểm tra giới
hạn mỗi hình ảnh (2×1092² ≈ 2×1521); `--probe-20plus` kiểm tra quy tắc
>20 hình ảnh (một cạnh >2000 px phải bị từ chối, không phải resample).
Các hàng nằm trong `results/*.jsonl`; công thức dự đoán nằm trong
`formulas.mjs`, được ghim bởi `tests/billing-sweep-formulas.test.ts`.

## Sau khi có kết luận

- Công thức patch được xác nhận → port OmniGlyph PR #27 (chuyển đổi
  resize chính xác) và khớp gate toán `ANTHROPIC_PIXELS_PER_TOKEN` trong
  `src/core/transform.ts`.
- Tier độ phân giải cao được xác nhận trên Fable → đưa lại hình học trang
  theo từng tier (trang cỡ 1928×1928 cho Fable/Opus 4.8/Sonnet 5, 1568×728
  cho tiêu chuẩn), phản chiếu cách đường dẫn GPT vẫn giữ
  `GPT_MAX_HEIGHT_PX` riêng của nó.
