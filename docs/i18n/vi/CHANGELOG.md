# Changelog

Định dạng: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

Phát hành công khai đầu tiên.

### Sản phẩm

- **Proxy nén ngữ cảnh dưới dạng hình ảnh**: viết lại các phần cồng kềnh của
  mỗi request LLM (system prompt, tài liệu công cụ, lịch sử cũ, kết quả công
  cụ lớn) thành các trang PNG 1-bit dày đặc trước khi chúng rời khỏi máy của
  bạn. Máy chủ Node cục bộ và host Cloudflare Workers.
- **Công thức tính phí chính xác theo từng nhà cung cấp** (`src/core/`):
  Anthropic patch 28px + overhead 3–4 token/khối (tự đo, dư bằng không),
  công thức OpenAI và Gemini được kiểm chứng đối chiếu với tài liệu chính
  thức. Được export tại package root (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, giới hạn tier).
- **Cấu hình render sản xuất đã đo lường**: atlas glyph 1-bit dày đặc (không
  khử răng cưa), trang tier tiêu chuẩn — mọi lựa chọn đều được hậu thuẫn bởi
  bằng chứng benchmark trong `benchmarks/*/results/`.
- **Các bộ khung benchmark** (`benchmarks/`): billing-sweep (tính toán token)
  và density-frontier (biên độ chính xác đọc trên các mô hình/mật độ), có
  thể chạy lại qua API, OpenRouter, Claude Code CLI, hoặc qua OmniRoute
  (`--via-omniroute`).
- **Thử lại khi bị từ chối**: bộ dò SSE/JSON phát lại request gốc khi một
  mô hình từ chối trang đã render (công tắc tắt khẩn cấp
  `retryRefusalWithOriginal`).
- **Cache render LRU** cho các trang tất định.
- **Engine OmniRoute**: được phân phối như engine nén `omniglyph` trong
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (chế độ độc lập và
  pipeline xếp chồng), với các gate fail-closed và tính toán token nhận
  biết hình ảnh.

### Các con số (tất cả đều có thể tái tạo)

- Render UI mẫu: 1015 ký tự → PNG 438×120, 254 → 84 token (**tiết kiệm
  66,9%**).
- Trang tiêu chuẩn 1568×728 = 1456 token hình ảnh bất kể chứa bao nhiêu văn
  bản.
- Claude đọc trang 1-bit dày đặc đạt 100% ở mật độ sản xuất; Opus 4.8 đọc
  77–87% ở 10×16.

### Các quyết định phủ định (đã đo lường, không phải ý kiến)

- **Tier độ phân giải cao là một cái bẫy tính phí**: trang 1928² được tính
  phí WYSIWYG nhưng bộ mã hóa không nhận được độ phân giải đầy đủ — cả hai
  tier đều render trang tiêu chuẩn.
- **GPT-5.5 bị loại**: 0/60 lần đọc dải dày đặc và thổi phồng completion
  ~40× so với đối chứng văn bản.
- **gpt-4o-mini không bao giờ được ảnh hóa** (ngưỡng token 2833/5667 khiến
  việc này không có lợi).
- **Gemini 2.5-flash bịa đặt** thay vì từ chối trả lời trên các trang dày
  đặc (0/26) — đang chờ thử lại với hạn ngạch trả phí.
