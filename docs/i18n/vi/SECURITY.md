# Chính sách bảo mật

## Báo cáo lỗ hổng bảo mật

Mở một security advisory riêng tư trên GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) hoặc
liên hệ trực tiếp với người bảo trì (diegosouza.pw@outlook.com). Không mở
một issue công khai cho một lỗ hổng có thể khai thác được.

## Mô hình mối đe dọa (OmniGlyph là gì)

OmniGlyph là một **proxy cục bộ** giữa client của bạn (ví dụ: Claude Code)
và các API LLM. Theo thiết kế, nó thấy toàn bộ nội dung phiên làm việc và
thông tin xác thực của bạn trong quá trình truyền tải. Các quyết định bảo
mật tương ứng:

- **Mặc định gắn với loopback** (`127.0.0.1`): dashboard không có xác
  thực và phục vụ ngữ cảnh phiên đã ghi lại (văn bản nguồn của hình ảnh,
  telemetry). `HOST=0.0.0.0` là một tùy chọn tự nguyện rõ ràng và phơi bày
  toàn bộ thông tin đó ra mạng — chỉ sử dụng trên mạng đáng tin cậy.
- **Thông tin xác thực**: proxy chuyển tiếp header xác thực của client đến
  upstream và không lưu trữ chúng. Các khóa được cung cấp qua biến môi
  trường (`ANTHROPIC_API_KEY` v.v.) chỉ tồn tại trong bộ nhớ.
- **Telemetry cục bộ**: `~/.omniglyph/events.jsonl` lưu metadata cho mỗi
  request (số lượng token, hash nội dung) và, khi gặp lỗi 4xx, các mẫu
  nội dung đã nén — hãy coi tệp này là nhạy cảm.
- **Nội dung được ảnh hóa là lossy**: các giá trị chính xác từng byte (bí
  mật, hash) không bao giờ được phụ thuộc vào việc đọc hình ảnh; pipeline
  giữ chúng dưới dạng văn bản, nhưng nguyên tắc vàng vẫn là: đừng đưa bí
  mật vào ngữ cảnh LLM.
- **Chuỗi cung ứng**: `pnpm-workspace.yaml` áp đặt `minimumReleaseAge` là
  3 ngày cho bất kỳ gói mới nào; core chỉ có một phụ thuộc runtime duy
  nhất.

## Các phiên bản được hỗ trợ

Chỉ dòng phát hành mới nhất (`main` / `v1.x` gần nhất) nhận được bản vá.
