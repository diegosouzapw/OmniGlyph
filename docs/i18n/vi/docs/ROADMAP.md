# Fork roadmap — "OmniGlyph của chúng ta" + tích hợp OmniRoute

Kế hoạch làm việc hợp nhất (2026-07-05) từ: billing sweep đã đo lường,
kiểm toán OpenAI/Gemini đối chiếu với tài liệu chính thức, phân tích các
công cụ liên quan, và bộ khung density-frontier. Trạng thái từng mục: ☐
đang chờ · ◐ một phần · ☑ đã hoàn thành ở đây.

## Giai đoạn 0 — Nền tảng đo lường (ĐÃ HOÀN THÀNH trong repo này)

- ☑ Tính phí Anthropic chính xác (patch 28px, 2 tier, +4/khối) —
  `src/core/anthropic-vision.ts`, sweep trong `benchmarks/billing-sweep/`.
- ☑ Gate lợi nhuận với chi phí chính xác (thay thế w·h/750 × 1,10).
- ☑ Hình học theo từng tier: Fable/Opus 4.8/Sonnet 5 → trang 1928×1928
  (ít hơn 3,3× số hình ảnh); tiêu chuẩn → 1568×728. 691 bài kiểm thử xanh.
- ☑ Bộ khung `benchmarks/density-frontier/` (chi phí × độ chính xác
  offline qua API, needle với distractor dễ nhầm lẫn, chấm điểm tất
  định).

## Giai đoạn 1 — Sửa lỗi tính phí đa nhà cung cấp (lỗi được xác nhận trong kiểm toán)

Mức ưu tiên được đặt bởi kiểm toán (tài liệu chính thức thu thập ngày
2026-07-05):

1. ☐ **D2 (gate BỊ ĐẢO NGƯỢC)**: `gpt-4o-mini` rơi vào tile mặc định
   85/170, nhưng thực tế tốn **2833 base / 5667 mỗi tile** (ước tính thấp
   hơn ~33×, ~0,8 ký tự/token) — ảnh hóa nó luôn là một tổn thất nhưng
   gate lại phê duyệt. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` được gửi vô điều kiện
   (`src/core/openai.ts:392,402`), nhưng chỉ tồn tại từ gpt-5.4 trở lên;
   cần suy ra nó từ profile.
3. ☐ **D1**: hệ số nhân `o4-mini` 1,62 → **1,72** (ước tính thấp hơn
   5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`
   nằm trong nhóm patch **giới hạn 1536 không có `original`** (mã nguồn
   giả định 10000); `gpt-5-codex-mini` nằm trong sai chế độ (tile → patch).
5. ☐ **Hình học GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (khớp với CẢ HAI
   chế độ: patch 64×32 và tile 4×512; +6,25% ký tự miễn phí). Profile
   `original` riêng cho 5.4/5.5: lên đến 1568×5984 (9.163 patch ≤ 10k,
   ~233k ký tự trong một khối) — cần A/B khả năng đọc trước.
6. ☐ **Hỗ trợ Gemini** (mới): `src/core/gemini.ts` + `gemini-model-profiles.ts`
   + các route `:generateContent`/`:streamGenerateContent` trong proxy.
   Hình học có thể ghi tài liệu: **1152×1536 (đơn vị crop chính xác 768,
   4 tile, 42,2 ký tự/token — tỷ lệ ghi tài liệu tốt nhất trong 3 nhà cung
   cấp)**; các cược cần hiệu chỉnh: 768² với `media_resolution:MEDIUM`
   (56,4) và Gemini 3 HIGH. Lưu ý: endpoint tương thích OpenAI của Gemini
   sẽ đi qua bộ biến đổi OpenAI với tính phí sai.

## Giai đoạn 2 — Chất lượng đọc (bộ khung density-frontier làm giám khảo)

- ◐ A/B quyết định std vs high-res trên Fable (đang chạy; ngưỡng: gist ==
  văn bản VÀ không có lỗi-âm-thầm VÀ mức tiết kiệm > 0).
- ☐ Giải quyết mâu thuẫn AA vs 1-bit trong đường dẫn dày đặc (mã nguồn ghi
  "chỉ dùng để đánh giá", sản xuất lại dùng AA).
- ☐ (HOÃN LẠI với lý do 2026-07-06) Phẫu thuật glyph: cấu hình sản xuất
  đọc được 30/30 — không có lần trượt nào có thể đo được để phẫu thuật
  sửa hôm nay. Xem xét lại nếu mục tiêu dưới-100% vào phạm vi (ví dụ:
  Opus) hoặc nếu các phép đo mới cho thấy sự thoái lui.
- ☑ ~~A/B theme sáng~~ ĐÃ GIẢI QUYẾT bằng kiểm tra (2026-07-06): bản render
  ĐÃ SẴN là đen-trên-trắng (render.ts:635/822, đảo sau khi blit) — khớp
  với tài liệu học thuật; giả thuyết này sinh ra từ một tiền đề sai (hình
  ảnh ví dụ ở thượng nguồn).
- ☐ Danh sách từ có checksum cho ID chính xác từng byte (upstream #38,
  được ủng hộ) + biểu ngữ từ chối trả lời (#31/#32) + camelCase trong
  factsheet (#33/#34).
- ☑ Port #45: $schema/$id được giữ nguyên, tuple bị loại bỏ theo từng
  phần tử (commit trên main).
- ☑ Thử lại khi bị từ chối (#37/H11): bộ dò phát lại không mất dữ liệu +
  thử lại một lần với body gốc; telemetry refusalRetried (commit trên
  main).
- ☐ Công cụ rehydrate (`RecoverableBlock` → công cụ có thể gọi; LensVLM
  xác thực việc mở rộng lại có chọn lọc).

## Giai đoạn 3 — Hiệu năng/độ bền

- ☐ Cache render LRU (tất định theo bất biến; slab + đoạn đông cứng hiện
  render lại ở mỗi request).
- ☐ Mã hóa PNG trong một worker thread; mức deflate có thể cấu hình.
- ☐ Port các bản sửa lỗi mở ở upstream: #44 (công cụ gốc có kiểu → 400),
  #45 (loại bỏ schema draft-07 → vòng lặp 400), #42 (proxy CONNECT cho
  Claude Desktop), #19 (tính phí kép mô tả GPT).
- ☐ Triển khai ADAPTIVE_CPT_PLAN (cpt theo vai trò khối; slab thực =
  1,50).

## Giai đoạn 4 — Chính bản fork

- ☐ Tên/repo riêng (quyết định của Diego) + `git remote` upstream cho
  cherry-pick.
- ☐ **TS ở mọi nơi**: core đã là TS, chuyển đổi `eval/*.mjs`, `demo/`,
  `scripts/*.mjs`, `bench/` (mẫu: tsx + vitest; `benchmarks/density-frontier/`
  đã được sinh ra theo cách đó).
- ☐ Tiêu chuẩn chất lượng OmniRoute: eslint 9 + prettier, CI với
  typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n
  (pt-BR trước), CHANGELOG ngữ nghĩa.
- ☐ **GIF thay vì video** trong README (ghi lại bằng vhs/asciinema+agg;
  so sánh cạnh nhau bình thường vs proxy).
- ☐ Dashboard v2 (triển khai lại qua HTTP API — không kế thừa mã của bên
  thứ ba): launcher "mở terminal với ANTHROPIC_BASE_URL", kiểm tra "lưu
  lượng có đi qua tôi không?", bộ kiểm tra hình ảnh-vs-văn bản, các phiên,
  bảng chi phí theo tiền tệ, i18n nhẹ, SSE thay vì polling, lưu trữ SQLite
  với retention (schema 24 cột hiện tại là một điểm khởi đầu tốt).
- ☐ Các ý tưởng nhỏ từ dense-image-gen: chế độ `lines` (giữ nguyên bố cục
  cho mã/bảng), `--keep-ws`, tiêu đề nguồn gốc trên mỗi trang ("system
  prompt" / "tool docs" / "history turn N"), CLI độc lập
  `render arquivo.md -o out.png`.

## Giai đoạn 5 — Port sang OmniRoute

- ☐ Engine `CompressionEngine` (mẫu `cavemanAdapter.ts`), đăng ký trong
  `engines/index.ts` + `engineCatalog.ts`;
  `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Đấu nối: truyền `supportsVision` trong `chatCore.ts:1297` (1 dòng)
  hoặc suy ra qua `isVisionModelId`.
- ☐ Thứ tự stack: cuối cùng (RTK/Caveman/renderer ngữ nghĩa trước;
  OmniGlyph ảnh hóa phần còn lại).
- ☐ Bất biến: không bao giờ viết lại các khối `cache_control` của client
  (bài học #4560); gate độ trung thực (#5127) cần một miễn trừ đã khai
  báo hoặc một factsheet văn bản thỏa mãn các bất biến; telemetry cố gắng
  với `skip_reason` (bài học #4268).
- ☐ Định tuyến: fallback/retry sau engine phải tôn trọng khả năng vision
  và danh sách cho phép (nén lại hoặc bỏ qua).
- ☐ Cộng hưởng với CCR: `emitRecoverable` → kho CCR với truy xuất theo
  lát (`head/tail/grep`, #5187) = mở rộng lại có chọn lọc đầy đủ.
- ☐ Kéo dài tier miễn phí như một tính năng marketing: mỗi token tier
  miễn phí mang lại ~2-3× số ký tự nhiều hơn trên các mô hình vision;
  tier miễn phí Gemini + hình học 1152×1536 là trường hợp thuyết phục
  nhất.

## Rủi ro đang mở

- Fable từ chối trả lời sau khi redeploy trong ngữ cảnh đã ảnh hóa
  (upstream #37) — cần giảm thiểu trước khi bật mặc định trong OmniRoute.
- Chênh lệch giá: nếu Anthropic định giá lại vision, mức tiết kiệm sẽ
  thay đổi — phép đối chứng theo từng request (`count_tokens`) là biện
  pháp phòng vệ.
- OpenAI: đo lường cộng đồng (PageWatch) thấy token completion tăng và độ
  trễ gấp 2× — cần đo theo từng nhà cung cấp trước khi bật.

## Kết quả A/B 2026-07-05 (qua OpenRouter — CHƯA KẾT LUẬN về hình học, hợp lệ cho các chế độ lỗi)

| cấu hình | chính xác | từ chối đọc | đã lọc | lỗi âm thầm |
|---|---|---|---|---|
| fable std 5×8 (AA và 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 dự đoán được) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 dự đoán được) |
| opus hires 10×16 | **7/9 đọc được** | 0 | 21 hết credit | 2 (chữ số) |

Các phát hiện hợp lệ: (1) bộ phân loại (issue #37) là chế độ lỗi CHIẾM ƯU
THẾ cho các câu hỏi phiên âm trên trang tiêu chuẩn — 100% bị lọc — và
không kích hoạt trên trang lớn; cách diễn đạt quan trọng. (2) Việc từ chối
đọc hoạt động: 20× ILEGIVEL so với 5 lần bịa đặt trên trang lớn. (3) Opus
ở 10×16 đọc chính xác 78% (n=9) so với 0% lịch sử ở 5×8 — bằng chứng trực
tiếp đầu tiên về điểm gấp khúc. (4) Sự khó đọc của trang lớn qua
OpenRouter cho thấy một RESAMPLE ở tầng vận chuyển (Bedrock/Vertex tier
tiêu chuẩn?) — giả thuyết quyết định cần kiểm tra trên API trực tiếp của
Anthropic; A/B hình học vẫn CÒN MỞ cho đến lúc đó. Credit OpenRouter hết
giữa chừng nhánh Opus.

## Ma trận 2×2 cuối cùng (2026-07-05, qua CLI/đăng ký, Fable 5, n=30/nhánh)

| trang × atlas | 1-bit | AA |
|---|---|---|
| tiêu chuẩn 1568×728 | **30/30 (100%)** | 25/30 + 5 từ chối |
| độ phân giải cao 1928×1928 | **20/30 (67%)** + 10 từ chối | 0/30 + 29 từ chối |

Không có bịa đặt nào trên cả 4 nhánh (120 câu hỏi — mọi lần trượt đều là
ILEGIVEL). ĐÃ ÁP DỤNG: DENSE_RENDER_STYLE đổi sang 1-bit (aa:false) với
một ghim trong tests/dense-style.test.ts. Opus 4.8: 26/30 ở 10×16 trên
trang lớn, 30/30 ILEGIVEL ở 5×8 — chế độ an toàn Opus khả thi. Trang độ
phân giải cao vẫn bị suy giảm bởi các tầng vận chuyển (CLI Read/resample
OpenRouter); kết luận hình học WYSIWYG vẫn phụ thuộc vào API trực tiếp.
