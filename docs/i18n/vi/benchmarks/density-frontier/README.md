# density-frontier — chi phí × độ chính xác theo độ phân giải

Bộ khung đo **biên Pareto giữa chi phí và khả năng đọc** của các bản
render văn bản→hình ảnh, theo từng nhà cung cấp (Anthropic / OpenAI /
Gemini), hình học trang, ô glyph, và style atlas.

Sự bất đối xứng trung tâm: kể từ billing sweep (2026-07-05,
`benchmarks/billing-sweep/`), **chi phí có thể dự đoán chính xác offline**
— patch 28 px + 4/khối trên Anthropic (`src/core/anthropic-vision.ts`),
profile patch/tile trên OpenAI (`src/core/openai.ts`), tile/media_resolution
trên Gemini (`gemini-cost.ts`). Chỉ **độ chính xác đọc** cần đến API.

## Thiết kế

- **Corpus** (`corpus.ts`): phần đệm dày đặc kiểu log/JSON + các needle
  được cấy từ các lớp mà ma trận nhầm lẫn cho biết là thất bại (hex 12
  ký tự, camelCase, chữ số 6/8/5/3) + **distractor gần-giống** được xây
  dựng từ các cặp dễ nhầm lẫn đã đo lường. Nếu mô hình trả lời bằng
  distractor, sự nhầm lẫn đó đã được *dự đoán* — đó chính là chế độ lỗi
  âm thầm cần phát hiện, không chỉ đếm là sai. Tất định (mulberry32).
- **Cấu hình** (`configs.ts`): lưới được tuyển chọn — trang tiêu chuẩn
  1568×728 so với độ phân giải cao 1928×1928 (A/B quyết định hình học
  theo tier), AA vs 1-bit (giải quyết mâu thuẫn render dày đặc), ô
  7×10/10×16 (chế độ an toàn Opus), dải GPT, và hai cược Gemini (≤384² =
  258 cố định; `media_resolution: low` = 280 cố định → ~116
  ký tự/token *nếu* đọc được).
- **Chấm điểm** (`score.ts`): so khớp chính xác tất định, không có LLM
  làm giám khảo. Ba kết quả: `correct` / `abstained` (sentinel ILEGIVEL —
  thất bại trung thực) / `silent_wrong` (chế độ nguy hiểm), kèm cờ
  distractor.

## Chạy

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # bảng chi phí, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needle+3 gist × cấu hình × trial
```

Cấu hình cụ thể: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Câu trả lời nằm trong `results/*.jsonl` (một dòng mỗi câu hỏi, kèm câu
trả lời thô để kiểm toán).

## Ngưỡng chấp nhận (kế thừa từ PR upstream #35/#36)

Một cấu hình chỉ trở thành giá trị mặc định sản xuất nếu: **gist ==
đường cơ sở văn bản** VÀ **không có chuỗi chính xác sai âm thầm nào** VÀ
**mức tiết kiệm dương**. Lần chạy bắt buộc đầu tiên là
`anthropic-std-5x8-aa` so với `anthropic-hires-5x8-aa` trên Fable — kiểm
tra nhanh khả năng đọc của trang lớn trước khi bật tier độ phân giải
cao.

## `--via-omniroute` — end-to-end qua OmniRoute (P3: chứng minh không
thoái lui)

Các tầng vận chuyển ở trên render văn bản→PNG **trong bộ khung** và gửi
hình ảnh. `--via-omniroute` làm điều ngược lại, đó chính là đường dẫn sản
xuất: nó gửi **văn bản dày đặc** đến một instance OmniRoute đang chạy,
để **engine `omniglyph` render** các trang và chuyển tiếp chúng đến
Anthropic, rồi đo các lần đọc + mức tiết kiệm. Nếu các lần đọc giữ nguyên
so với đường dẫn trực tiếp **và** OmniRoute báo cáo có nén, điều đó chứng
minh rằng việc render+chuyển tiếp của OmniRoute **không làm suy giảm**
các trang.

Điều kiện tiên quyết (vận hành):

1. **OmniRoute đang chạy** (`npm run dev`, mặc định
   `http://localhost:20128`).
2. Một **nhà cung cấp Anthropic** được cấu hình trong OmniRoute với một
   **khóa thật** (route trực tiếp — gate
   `providerTransport==='direct'` chỉ vượt qua với nhà cung cấp
   `anthropic`).
3. **Engine `omniglyph` ĐƯỢC BẬT** trong cấu hình nén của OmniRoute
   (`config.engines.omniglyph.enabled = true`) — header `engine:omniglyph`
   chỉ xuất hiện khi engine được bật. (Engine này là
   `stable:false`/preview; cần bật rõ ràng.)
4. Một **khóa API OmniRoute** trong `OMNIROUTE_API_KEY` (khóa mà client
   dùng để xác thực với OmniRoute, không phải khóa Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<khóa-omniroute-của-bạn> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Mỗi câu trả lời ghi lại `omnirouteSavings: { originalTokens,
compressedTokens, savingsPercent }` (từ header phản hồi
`X-OmniRoute-Compression`) trong JSONL; hàng bảng cho biết có bao nhiêu
câu trả lời quay lại đã được nén + mức tiết kiệm trung vị. **Ngưỡng
P3**: cùng số lần đọc verbatim/gist như route trực tiếp (không thoái
lui) **kèm** `omnirouteSavings` khác null (chứng minh một lần render đã
xảy ra, không phải đọc văn bản thô). Nếu xuất hiện `did NOT compress`,
nghĩa là engine chưa được bật trong OmniRoute (hoặc body không vượt qua
các gate fail-closed).

Bài kiểm thử cho phần thuần túy:
`tests/density-frontier.test.ts` (bao gồm `buildOmnirouteRequest` và
`parseCompressionSavings` từ tầng vận chuyển via-omniroute).
