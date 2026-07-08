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

# ⚙️ Cách hoạt động

```
khối request cồng kềnh ──► gate lợi nhuận ──► reflow + render (atlas 1-bit 5×8)
                       (công thức tính phí chính xác)     ──► trang PNG 1568×728 ──► ghép lại, thân thiện với cache
```

- **Phí được tính chính xác, trước khi chuyển đổi**: Anthropic tính `⌈w/28⌉ × ⌈h/28⌉ + 4` token cho mỗi hình ảnh (patch 28 px — đo được với độ dư bằng không). Một trang đầy đủ chứa 28.080 ký tự cho 1.460 token ≈ **19 ký tự/token**, so với ~2 ký tự/token cho văn bản dày đặc. Gate chỉ chuyển đổi khi phép tính có lợi.
- **Những gì được chuyển đổi**: system prompt tĩnh + tài liệu công cụ, lịch sử cũ đã thu gọn, kết quả công cụ lớn.
- **Những gì không bao giờ được chuyển đổi**: tin nhắn của bạn, các lượt gần đây, đầu ra của mô hình, văn xuôi thưa thớt, giá trị chính xác từng byte (hash/ID đi kèm dưới dạng văn bản), và bất kỳ mô hình nào không vượt qua benchmark đọc.

# 🧭 Phần trung thực

- **Đây là kỹ thuật lossy.** Khả năng nhớ chính xác từng byte từ hình ảnh vốn không đáng tin cậy. Các biện pháp giảm thiểu đã triển khai: các định danh chính xác đi kèm dưới dạng văn bản bên cạnh hình ảnh, và cấu hình sản xuất đã đo lường cho ra **không có bịa đặt âm thầm nào** — các lần đọc thất bại đều tự nhận là không đọc được.
- **Chỉ Fable 5 được phê duyệt hiện nay**, có bằng chứng. GPT-5.5 và Gemini 2.5-flash được đo lường là không đọc được render dày đặc; Opus 4.8 cần glyph lớn hơn 4×. Gate thực thi điều này.
- **Chúng tôi đã phát hiện và tránh một cái bẫy tính phí**: tier hình ảnh độ phân giải cao tính phí gấp 3,3× mỗi trang, nhưng bộ mã hóa thị giác không nhận được độ phân giải bổ sung đó — trang lớn hơn lại đọc *tệ hơn*. Đã đo lường, ghi lại trong [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), không được kích hoạt.
- Giá cả thay đổi; chỉ số bền vững là mức cắt giảm token, được proxy ghi lại cho mỗi request so với một phép đối chứng `count_tokens` miễn phí.

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

## 📄 Giấy phép

MIT — xem [LICENSE](../../../LICENSE).
