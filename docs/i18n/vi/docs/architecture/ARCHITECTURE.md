# Kiến trúc

Bản đồ một trang của codebase.

## Pipeline request

```
client (Claude Code / bất kỳ SDK nào)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  một trình xử lý fetch chuẩn Web duy nhất:
  │                                định tuyến, chuyển tiếp xác thực, phép
  │                                đối chứng count_tokens, sự kiện
  │                                usage/telemetry
  ▼
src/core/transform.ts              PIPELINE CHÍNH (đường dẫn Anthropic):
  │   1. phân tích body, xác định vision tier từ mô hình
  │   2. gate lợi nhuận — chi phí hình ảnh chính xác so với chi phí văn bản
  │   3. chuyển đổi: slab tĩnh · tool_results lớn · lịch sử đã thu gọn
  │   4. ghép lại, giữ nguyên các mốc cache_control của client
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## Tính phí (chính xác, đã đo lường)

| module | nhà cung cấp | mô hình |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patch 28 px + 4/khối, giới hạn resize theo từng tier; hình học trang (cả hai tier đều render trang tiêu chuẩn 1568×728 — tier độ phân giải cao là một cái bẫy tính phí, xem [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | chế độ patch/tile theo từng mô hình, `detail` theo profile, hình học dải |
| `src/core/gemini-model-profiles.ts` | Google | công thức tile (đơn vị crop `floor(min/1.5)`) + chi phí cố định `media_resolution` |

## Render

- `src/core/render.ts` — văn bản → PNG qua một atlas glyph đã build sẵn
  (Spleen 5×8 + dự phòng Unifont), reflow với sentinel dòng mới `↵`, atlas
  1-bit trong sản xuất (đo được là tốt hơn AA trên Fable).
- `src/core/render-cache.ts` — ghi nhớ LRU cho các bản render tất định
  (nếu không, slab tĩnh + đoạn lịch sử đông cứng sẽ render lại ở mỗi
  request).
- `src/core/history.ts` — thu gọn các lượt cũ thành các đoạn hình ảnh
  đông cứng chỉ-thêm-vào, giữ nguyên byte để prompt caching tiếp tục
  khớp.
- `src/core/png.ts` — bộ mã hóa PNG tất định tối giản (không phụ thuộc
  native).

## Guard rails

- Danh sách cho phép mô hình (`src/core/applicability.ts`): chỉ những mô
  hình đã vượt qua benchmark đọc mới được ảnh hóa; mọi thứ khác đi qua
  nguyên vẹn byte.
- Các giá trị chính xác từng byte (SHA, id) đi kèm dưới dạng văn bản
  trong một factsheet cạnh hình ảnh (`src/core/factsheet.ts`); bản gốc có
  thể khôi phục qua `emitRecoverable`.
- Các công cụ có kiểu gốc (`type !== 'custom'`) không bao giờ bị viết lại
  (guard 400).

## Benchmark & bằng chứng

`benchmarks/` chứa hai bộ khung đã tạo ra mọi con số trong README — xem
[benchmarks/README.md](../../benchmarks/README.md).
