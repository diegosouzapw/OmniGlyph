# Đóng góp cho OmniGlyph

Cảm ơn bạn đã quan tâm! Dự án này có hai quy tắc văn hóa không thể thương
lượng — đó là lý do mọi con số trong README đều có thể được tin tưởng.

## Quy tắc 1 — TDD nghiêm ngặt

Mọi mã sản xuất đều bắt nguồn từ một bài kiểm thử thất bại trước:

1. Viết bài kiểm thử và **xem nó thất bại vì đúng lý do**.
2. Viết mã tối thiểu để nó vượt qua.
3. Tái cấu trúc trong khi vẫn giữ trạng thái xanh.

Ngưỡng đầy đủ là: `pnpm run typecheck && pnpm test && pnpm run build` — cả
ba, luôn luôn (kiểm tra liên kết tài liệu và guard đổi thương hiệu chạy bên
trong `pnpm test` thông qua `tests/docs-integrity.test.ts`).

## Quy tắc 2 — Đo lường trước khi khẳng định

Không có thay đổi nào về hình học, atlas, công thức tính phí, hoặc phạm vi
mô hình được đưa vào mà không có con số đo lường. Kho lưu trữ được xây dựng
xoay quanh kỷ luật này:

- Chi phí tính phí → chứng minh bằng `benchmarks/billing-sweep/`
  (`count_tokens` miễn phí; độ dư kỳ vọng: bằng không).
- Khả năng đọc → chứng minh bằng `benchmarks/density-frontier/` (n≥30 mỗi
  nhánh, chấm điểm tất định, bằng chứng JSONL được commit vào
  `benchmarks/*/results/`).
- Ngưỡng chấp nhận để thay đổi một giá trị mặc định sản xuất: gist ==
  đường cơ sở văn bản **VÀ** không có lỗi chuỗi chính xác âm thầm **VÀ**
  mức tiết kiệm dương.

Các giả thuyết không có con số sẽ vào `docs/ROADMAP.md` dưới dạng giả
thuyết — không bao giờ vào README như sự thật. Hai ý tưởng "hiển nhiên" đã
bị bác bỏ bằng dữ liệu (trang độ phân giải cao, atlas khử răng cưa); quy
trình này hiệu quả.

## Thiết lập

```bash
pnpm install
pnpm test              # bộ kiểm thử đầy đủ, ~40–90s
pnpm run dev:node      # proxy cục bộ ở chế độ watch
```

Node ≥18 (CI kiểm thử 20/22/24), pnpm 10 (được ghim bởi `packageManager`
trong package.json).

## Cấu trúc

| thư mục | quy tắc |
|---|---|
| `src/core/` | không phụ thuộc runtime (chỉ Web API — chạy trên cả Node và Workers) |
| `src/node.ts` / `src/worker.ts` | chỉ chứa phần đấu nối host |
| `benchmarks/` | các bộ khung có thể chạy lại; kết quả JSONL là bằng chứng, được commit |
| `docs/` | benchmarks/ (con số), architecture/ (bản đồ), ROADMAP (giả thuyết), ops/ (OmniRoute) |

## Commit và PR

- Commit theo quy ước (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), phần thân giải thích *lý do* kèm các con số liên
  quan.
- PR nhỏ, tập trung; các thay đổi hành vi đi kèm bài kiểm thử ghim chúng
  lại và, khi áp dụng được, benchmark biện minh cho chúng.
- Không viết lại các khối `cache_control` của client, không thêm phụ thuộc
  runtime mà không thảo luận trước (core được thiết kế có chủ đích ít phụ
  thuộc), không dùng `Math.random`/timestamp trong đường dẫn render (tính
  tất định là một bất biến cứng, được kiểm thử bằng đồng nhất byte).
