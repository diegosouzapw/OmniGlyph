🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Một bản render thực tế: system prompt + tài liệu công cụ được nén vào một trang dày đặc 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — Ngữ cảnh dưới dạng hình ảnh

### Cắt giảm hóa đơn Claude của bạn **59–70%** bằng cách render ngữ cảnh cồng kềnh thành các trang PNG dày đặc — cùng một nội dung, chỉ với một phần nhỏ số token.

**Các mô hình tính phí văn bản theo token, nhưng tính phí hình ảnh theo kích thước — không phải theo lượng văn bản chứa bên trong.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-cc-con-s---o-lng-khng-phi-c-tnh)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](../../../benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](../../../benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-phn-trung-thc)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Một phần của gia đình [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Tất cả ngôn ngữ](../README.md)

</div>

---

# 📊 Các con số — đã đo lường, không phải ước tính

| chỉ số | kết quả | bằng chứng |
|---|---|---|
| Giảm hóa đơn đầu-cuối | **59–70%** | trace sản xuất, 13.709 request |
| Token trên mỗi khối được chuyển đổi | **giảm 10×** (28.080 ký tự: 14.040 → 1.460 token) | [billing sweep](../../../benchmarks/billing-sweep/README.md) |
| Độ chính xác công thức tính phí | dư **bằng không** trên 22 phép thử `count_tokens`, 2 mô hình × 2 tier | `benchmarks/billing-sweep/results/` |
| Độ chính xác đọc tuyệt đối, cấu hình sản xuất | **30/30 (100%)** trên Claude Fable 5 | [density frontier](../../../benchmarks/density-frontier/README.md) |
| Bịa đặt âm thầm trong ~300 phép thử đọc | **0** — mọi lần đọc trượt đều tự nhận là `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Bảng xếp hạng mô hình** (có đọc được render dày đặc không? n=30 mỗi nhánh, chấm điểm tất định):

| mô hình | khả năng đọc | kết luận |
|---|---|---|
| Claude **Fable 5** | **100%** chính xác | ✅ mục tiêu sản xuất |
| Claude Opus 4.8 | 77–87% với glyph cỡ 4× | ⚠️ chế độ an toàn tùy chọn (mức tiết kiệm giảm còn ~2×) |
| GPT-5.5 | 0/60 — và thổi phồng câu trả lời ~40× khi cố đọc | ❌ bị chặn bởi gate, có bằng chứng |
| Gemini 2.5-flash | 0/26 — và bịa đặt thay vì từ chối trả lời | ❌ bị chặn (thử nghiệm một phần, giới hạn hạn ngạch) |

Lợi thế này **hiện chỉ đúng với Fable** — các bộ mã hóa thị giác khác chưa giải mã được glyph dày đặc. [Bộ khung benchmark](../../../benchmarks/README.md) kiểm tra lại bất kỳ mô hình mới nào chỉ bằng một lệnh.

# 🤔 Tại sao chọn OmniGlyph?

Mọi phiên làm việc dài của agent đều kéo theo cùng một khối lượng chết trên mỗi request: system prompt, tài liệu công cụ, và lịch sử cũ — bị tính phí lại theo token, ở mỗi lượt. OmniGlyph là một **proxy chạy cục bộ** viết lại những phần cồng kềnh đó thành các trang PNG dày đặc *trước khi chúng rời khỏi máy của bạn*:

- **Công thức tính phí chính xác, không phải suy đoán** — nó tính toán công thức token hình ảnh thực tế của nhà cung cấp (đo được với độ dư bằng không) và chỉ chuyển đổi khi phép tính có lợi.
- **Fail-closed theo thiết kế** — các mô hình không đọc được render dày đặc sẽ bị một gate chặn lại, có bằng chứng benchmark. Không có mất mát chất lượng âm thầm.
- **Riêng tư và ưu tiên cục bộ** — việc viết lại diễn ra trên `127.0.0.1`; không có gì thêm được gửi đi đâu cả.
- **Có thể tái tạo** — mọi con số ở trên đều có bằng chứng trong `benchmarks/*/results/`, có thể chạy lại chỉ bằng một lệnh.

# ⚡ Bắt đầu nhanh

```bash
npx omniglyph                                     # proxy trên 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # trỏ Claude Code đến nó
```

![Bắt đầu nhanh: khởi động proxy, kiểm tra dashboard, trỏ Claude Code đến nó](../../../docs/assets/demo-quickstart.gif)

Hoạt động theo cả hai cách:
- **Khóa API** (trả tiền theo token): hóa đơn của bạn giảm 59–70% đầu-cuối.
- **Phiên đăng ký**: bạn không trả ít hơn, nhưng giới hạn sử dụng được tính theo token — vì vậy giới hạn của bạn kéo dài **~2–3×**.

Dashboard tại <http://127.0.0.1:47821/>: token đã tiết kiệm, từng lần chuyển đổi văn bản→hình ảnh đặt cạnh nhau, công tắc tắt khẩn cấp, chip mô hình trực tiếp. Phản hồi vẫn stream bình thường — chỉ *request* bị nén, không bao giờ là đầu ra của mô hình.

# 🔌 Sử dụng với các client Claude

Start the proxy in one terminal, then point the client at it.

**Claude Code CLI (macOS/Linux):**

```bash
npx omniglyph
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude
```

**Claude Code CLI (Windows PowerShell):**

```powershell
npx omniglyph
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:47821"
claude
```

**Claude Desktop** uses the same `ANTHROPIC_BASE_URL` environment variable for its bundled Claude Code runtime — start `omniglyph` first, then launch Claude Desktop from an environment where `ANTHROPIC_BASE_URL` is set to `http://127.0.0.1:47821`.

# 🖥️ Dashboard

Một dashboard cục bộ đầy đủ được đóng gói sẵn trong package — hoạt động offline, một tệp duy nhất, không có request ra bên ngoài. Sáu trang, cập nhật trực tiếp qua SSE khi request diễn ra:

![Overview: các thẻ KPI kiểu trung tâm điều hành, biểu đồ tiết kiệm dạng sparkline và luồng sự kiện trực tiếp](../../assets/dashboard-overview.png)

- **Overview** — trung tâm điều hành: % tiết kiệm, số tiền tiết kiệm, độ trễ p95, cache hit, lỗi, luồng sự kiện trực tiếp.
- **Live Flow** — pipeline hiển thị dưới dạng đồ thị node: client → gate → renderer / passthrough → API, với một hạt cho mỗi request thực.
- **Telemetry** — đồng hồ đo token/$ và dòng thời gian request trực tiếp; nhấp vào bất kỳ request nào để xem chính xác phần nào đã trở thành hình ảnh và đọc văn bản gốc đằng sau mỗi trang.
- **Benchmarks** — các bằng chứng của harness được hiển thị từ `benchmarks/*/results/`, mỗi dòng ứng với một thử nghiệm mô hình·cấu hình, và **chạy benchmark ngay từ UI**: dry-run `$0` stream kết quả trực tiếp; các lần chạy thật vẫn bị khóa sau khóa API của bạn cộng với xác nhận chi phí rõ ràng.
- **Sessions / History** — các session tiết kiệm token nhiều nhất và mọi sự kiện lưu trên đĩa.

| Live Flow | Benchmarks |
|---|---|
| ![Pipeline request dưới dạng đồ thị node trực tiếp](../../assets/dashboard-flow.png) | ![Bằng chứng benchmark và dry-run ngay trong UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: đồng hồ đo và dòng thời gian request trực tiếp](../../assets/dashboard-telemetry.png)

# ⚙️ Cách hoạt động

```
khối request cồng kềnh ──► gate lợi nhuận ──► reflow + render (atlas 1-bit 5×8)
                       (công thức tính phí chính xác)     ──► trang PNG 1568×728 ──► ghép lại, thân thiện với cache
```

- **Phí được tính chính xác, trước khi chuyển đổi**: Anthropic tính `⌈w/28⌉ × ⌈h/28⌉ + 4` token cho mỗi hình ảnh (patch 28 px — đo được với độ dư bằng không). Một trang đầy đủ chứa 28.080 ký tự cho 1.460 token ≈ **19 ký tự/token**, so với ~2 ký tự/token cho văn bản dày đặc. Gate chỉ chuyển đổi khi phép tính có lợi.
- **Những gì được chuyển đổi**: system prompt tĩnh + tài liệu công cụ, lịch sử cũ đã thu gọn, kết quả công cụ lớn.
- **Những gì không bao giờ được chuyển đổi**: tin nhắn của bạn, các lượt gần đây, đầu ra của mô hình, văn xuôi thưa thớt, giá trị chính xác từng byte (hash/ID đi kèm dưới dạng văn bản), và bất kỳ mô hình nào không vượt qua benchmark đọc.

# 📚 Sử dụng dưới dạng thư viện (không cần proxy)

Mọi thứ mà proxy làm cho mỗi request cũng là một API đã được tài liệu hóa, có thể import:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render bất kỳ văn bản nào thành các trang PNG dày đặc 1-bit
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Hoặc tự chạy toàn bộ transform cho request — gate, công thức tính phí và mọi thứ
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // JSON body /v1/messages gốc
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` ghim các khối lại dưới dạng văn bản; `options.emitRecoverable` trả về bản gốc của các khối đã bị chuyển thành hình ảnh. Công thức tính phí chính xác cũng được xuất ở gốc package (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — đó là những gì [OmniRoute](https://github.com/diegosouzapw/OmniRoute) sử dụng. Runtime thuần JS (Node và edge/Workers). Toàn bộ bề mặt API: `src/core/index.ts`.

# 📤 Xuất offline — không cần proxy, không cần Claude Code

Không dùng Claude Code? Hãy render ngữ cảnh thành các trang PNG **ngay trên máy của bạn** rồi dán chúng vào Cursor, ChatGPT, hoặc bất kỳ khung chat nào chấp nhận tải lên hình ảnh. Không cần proxy, không cần khóa API, không cần thiết lập tài khoản nào:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Bạn nhận được một thư mục chứa mọi thứ để thả vào khung chat:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` render diff chưa commit của bạn, `--diff <ref>` một khoảng commit, `--open` mở thư mục ra (macOS). Tất cả đều chạy trên máy của bạn — luồng export không bao giờ khởi động proxy và không bao giờ gọi đến mô hình. Chạy `omniglyph export --help` để xem mọi cờ dòng lệnh.

# 🧭 Phần trung thực

- **Đây là kỹ thuật lossy.** Khả năng nhớ chính xác từng byte từ hình ảnh vốn không đáng tin cậy. Các biện pháp giảm thiểu đã triển khai: các định danh chính xác đi kèm dưới dạng văn bản bên cạnh hình ảnh, và cấu hình sản xuất đã đo lường cho ra **không có bịa đặt âm thầm nào** — các lần đọc thất bại đều tự nhận là không đọc được.
- **Chỉ Fable 5 được phê duyệt hiện nay**, có bằng chứng. GPT-5.5 và Gemini 2.5-flash được đo lường là không đọc được render dày đặc; Opus 4.8 cần glyph lớn hơn 4×. Gate thực thi điều này.
- **Chúng tôi đã phát hiện và tránh một cái bẫy tính phí**: tier hình ảnh độ phân giải cao tính phí gấp 3,3× mỗi trang, nhưng bộ mã hóa thị giác không nhận được độ phân giải bổ sung đó — trang lớn hơn lại đọc *tệ hơn*. Đã đo lường, ghi lại trong [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), không được kích hoạt.
- Giá cả thay đổi; chỉ số bền vững là mức cắt giảm token, được proxy ghi lại cho mỗi request so với một phép đối chứng `count_tokens` miễn phí.

# 🧠 Câu hỏi thường gặp (FAQ)

**Con số 59–70% là đầu-cuối, hay chỉ tính trên các request đã được xử lý?**
Đầu-cuối — toàn bộ hóa đơn. Hầu hết các công cụ nén khác chỉ báo cáo mức tiết kiệm trên phần mà chúng đã xử lý, điều này làm con số trông đẹp hơn thực tế. Mẫu số của chúng tôi là *mọi* request: cả những request nhỏ mà gate đã đúng đắn để nguyên không đụng tới, mọi lần ghi và đọc cache, và mọi token đầu ra (mà proxy không bao giờ nén). Con số chỉ tính trên phần đã nén thì cao hơn và được nêu riêng, không bao giờ dùng làm con số chính.

**Mức tiết kiệm được đo như thế nào?**
Cả hai phía của cùng một request, tại cùng một thời điểm. Với mỗi POST `/v1/messages`, proxy gửi một phép thử `count_tokens` miễn phí trên body gốc chưa nén (kịch bản đối chứng) song song với lượt chuyển tiếp thật, rồi đọc khối usage thực tế đã được nhà cung cấp tính phí từ phản hồi — cả hai đều nằm trong cùng một dòng sự kiện. Giá cache được áp dụng như nhau cho cả hai phía, nên mức chiết khấu cache tự triệt tiêu và không thể bị tính trùng như "tiết kiệm". Công thức nằm trong `src/core/baseline.ts`; bạn có thể tự suy ra lại từ nhật ký sự kiện của mình.

**Tại sao một lần đọc trượt lại là bịa đặt thay vì lỗi đọc?**
Vì thị giác của mô hình không phải OCR: trang hình ảnh trở thành các patch embedding, không bao giờ là các ký tự rời rạc, nên không có độ tin cậy theo từng glyph để báo lỗi rõ ràng — khi các pixel không đủ để xác định một glyph, ưu tiên ngôn ngữ (language prior) sẽ lấp đầy khoảng trống bằng thứ gì đó nghe có vẻ hợp lý. Chính cơ chế đó là lý do OmniGlyph áp dụng fail-closed: các giá trị chính xác từng byte luôn đi kèm dưới dạng văn bản bên cạnh hình ảnh, các mô hình đọc sai bị gate chặn lại, và cấu hình sản xuất đã đo lường cho ra **không** có bịa đặt âm thầm nào trong ~300 phép thử đọc — các lần đọc thất bại đều tự nhận là không đọc được.

**Còn công việc cần chính xác từng byte (hash, ID, secret) thì sao?**
Theo thiết kế, các lượt gần đây và định danh chính xác luôn ở dạng văn bản. Với các workload mà *toàn bộ* đều cần chính xác từng byte, hãy định tuyến chúng đến một mô hình không nằm trong allowlist (ví dụ một subagent chạy trên một mô hình Claude khác) — bất cứ thứ gì ngoài allowlist đều đi qua nguyên vẹn, giống hệt byte gốc, không bị đụng tới.

**Chẳng phải DeepSeek-OCR đã chứng minh điều này hoạt động rồi sao?**
Nó chứng minh *kênh truyền* hoạt động — với một cặp encoder/decoder được huấn luyện riêng cho việc đó. Sự hoài nghi bắt nguồn từ thời điểm chưa có mô hình sản xuất tiêu chuẩn nào đọc được render dày đặc; điều đó đã thay đổi, và [bảng xếp hạng mô hình](../../../README.md#-the-numbers--measured-not-estimated) ở trên cho thấy chính xác ai đọc được chúng ngày nay, có bằng chứng đi kèm. [Bộ khung benchmark](../../../benchmarks/README.md) kiểm tra lại bất kỳ mô hình mới nào chỉ bằng một lệnh — gate đi theo dữ liệu, không theo lời đồn.

**Tôi có thể dùng nó mà không cần Claude Code — với Cursor, ChatGPT, hay một pipe thuần túy không?**
Có, theo hai cách. Ở dạng **proxy**, nó hoạt động với bất kỳ client nào cho phép bạn đặt API base URL (`ANTHROPIC_BASE_URL`, hoặc base URL của OpenAI) — Claude Code, các script của riêng bạn, bất cứ thứ gì dùng HTTP. Và với các công cụ không thể dùng proxy, mục **Xuất offline** ở trên sẽ render ngữ cảnh thành các trang PNG để bạn tự dán vào bằng tay — `omniglyph export --stdin` thậm chí đọc thẳng từ một pipe Unix.

**Nó thực sự biến văn bản thành hình ảnh như thế nào?**
Nó reflow văn bản rồi vẽ lên bằng một atlas glyph 1-bit 5×8 pixel trên các trang PNG dày đặc 1568×728 — một bit cho mỗi pixel, không khử răng cưa (anti-aliasing), nên mô hình tính phí trang theo kích thước của nó, chứ không phải theo số lượng ký tự bên trong. **Cách hoạt động** ở trên có mô tả pipeline; tài liệu benchmark có phần hình học và lý do vì sao dày đặc hơn không phải lúc nào cũng rẻ hơn.

# 🔬 Tái tạo mọi con số

```bash
pnpm install && pnpm test                                     # bộ kiểm thử đầy đủ
node benchmarks/billing-sweep/run.mjs --dry-run               # dự đoán tính phí, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # bảng chi phí, $0
# với khóa API: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (hoặc --via-cli cho gói đăng ký Claude Code)
```

![Hai bộ khung benchmark đang chạy ở chế độ dry-run](../../../docs/assets/demo-benchmarks.gif)

Phương pháp đầy đủ và mọi bảng kết quả: [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md). Bằng chứng thô cho từng câu trả lời: `benchmarks/*/results/*.jsonl`.

# 🚀 Gia đình OmniRoute

OmniGlyph cũng được phân phối như một **engine nén gốc bên trong [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — gateway AI miễn phí. Ở đó nó chạy như engine `omniglyph` (chế độ độc lập hoặc xếp chồng với các engine khác), với các gate fail-closed và tính toán token nhận biết hình ảnh.

# 🛠️ Ngăn xếp công nghệ

| lớp | công nghệ |
|---|---|
| Ngôn ngữ | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Render | atlas glyph 1-bit tự phát triển (bắt nguồn từ Spleen/Unifont, giấy phép trong `assets/`) → PNG |
| Kiểm thử | Vitest — TDD, cùng với các guard toàn vẹn tài liệu và guard đổi thương hiệu |
| Benchmark | các bộ khung trong `benchmarks/` (billing-sweep, density-frontier) với bằng chứng JSONL |

## Cấu trúc dự án

| đường dẫn | nội dung |
|---|---|
| `src/` | proxy: pipeline biến đổi, tính phí chính xác theo từng nhà cung cấp, bộ render, host (Node + Cloudflare Workers) |
| `benchmarks/` | các bộ khung đã tạo ra mọi con số ở trên — có thể chạy lại |
| `docs/` | [BENCHMARKS](../../../docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](../../../docs/architecture/ARCHITECTURE.md) · [ROADMAP](../../../docs/ROADMAP.md) |

# 📧 Hỗ trợ & Cộng đồng

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — lỗi và yêu cầu tính năng
- 🔒 [SECURITY.md](SECURITY.md) — báo cáo lỗ hổng bảo mật
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD nghiêm ngặt + đo lường trước khi khẳng định
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Lời cảm ơn

OmniGlyph được xây dựng dựa trên nền tảng của một dự án đặc biệt — đây là lời cảm ơn thường trực của chúng tôi.

| Dự án | Đã định hình OmniGlyph như thế nào |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Khám phá mà toàn bộ dự án này được xây dựng dựa trên.** pxpipe đã chứng minh, có bằng chứng, rằng kênh thị giác của một LLM sản xuất có thể mang ngữ cảnh văn bản dày đặc chỉ với một phần nhỏ chi phí token — và việc chuyển đổi phải được quyết định theo từng request bằng công thức tính phí chính xác, không bao giờ theo cảm tính. Việc render 1-bit dày đặc, gate lợi nhuận, phép đối chứng `count_tokens`, allowlist mô hình fail-closed, và văn hóa tài liệu "đo lường trước khi khẳng định" đều được tiên phong tại đó. OmniGlyph kế thừa trực tiếp từ codebase đó (MIT — dòng bản quyền gốc vẫn được giữ nguyên trong [LICENSE](../../../LICENSE) của chúng tôi). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Họ font bitmap 5×8 mà atlas glyph 1-bit dày đặc của chúng tôi bắt nguồn từ đó (giấy phép trong `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Phủ sóng cho các glyph nằm ngoài phạm vi của Spleen trong cùng atlas đó (giấy phép trong `assets/`). |

Nếu bạn thấy OmniGlyph hữu ích, hãy star cả dự án gốc — khám phá đó là của họ. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Giấy phép

MIT — xem [LICENSE](../../../LICENSE).
