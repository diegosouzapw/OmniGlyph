# OmniGlyph — Các phép đo hợp nhất (2026-07-05)

Mọi thứ ĐÃ ĐO LƯỜNG trong phiên này, kèm nguồn và n; các giả thuyết được
tách riêng rõ ràng ở cuối. Bằng chứng: `benchmarks/billing-sweep/results/`
và `benchmarks/density-frontier/results/` (JSONL cho từng câu trả lời).

## 1. Tính phí Anthropic (count_tokens trực tiếp, $0, 11 hình học × 2 mô hình)

Công thức đã xác nhận: `tokens = ceil(w/28) × ceil(h/28)` sau khi resize
theo tier, **+3/khối (Fable 5) / +4/khối (Sonnet 4.5)** — độ dư BẰNG
KHÔNG trên mọi hàng.

| phép thử | kích thước | Fable 5 (độ phân giải cao) | Sonnet 4.5 (tiêu chuẩn) |
|---|---|---:|---:|
| mốc tài liệu | 1092×1092 | 1524 | 1525 |
| mốc tài liệu | 1000×1000 | 1299 | 1300 |
| trang tiêu chuẩn | 1568×728 | 1459 | 1460 |
| **trang lớn** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| trần độ phân giải cao | 1960×1960 | 4764 (clamp) | 1525 |
| cạnh dài độ phân giải cao | 2576×1204 | 3959 | 1516 |
| dải cao | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (đa ảnh) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 ảnh) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→giảm độ phân giải, KHÔNG bị từ chối trong count_tokens) | 3585 |

Các quyết định suy ra (đã triển khai): gate theo patch chính xác; tier
theo từng mô hình (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = độ phân giải
cao); `cols` 313→312.

## 2. Độ chính xác đọc (density-frontier, needle hex/camelCase/chữ số +
distractor)

### Ma trận 2×2 Fable 5 — qua CLI/đăng ký, n=30/nhánh, cùng corpus (~16,6k
ký tự)

| trang × atlas | chính xác | từ chối đọc (ILEGIVEL) | lỗi âm thầm |
|---|---:|---:|---:|
| tiêu chuẩn 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| tiêu chuẩn 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| độ phân giải cao 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| độ phân giải cao 1928×1928 · AA | 0/30 | 29 | 1 (dự đoán được bởi ma trận) |

→ **1-bit > AA trên cả hai trang; không có bịa đặt nào trên 120 câu hỏi.**
ĐÃ ÁP DỤNG: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ trang độ phân giải cao đến nơi bị suy giảm bởi resample của tầng vận
chuyển (xem H1/H3) — 67% là một sàn, không phải trần.

### Opus 4.8 — qua CLI/đăng ký, n=30/nhánh

| cấu hình | chính xác | từ chối đọc | lỗi |
|---|---:|---:|---:|
| ô 10×16 · độ phân giải cao | **26/30 (87%)** | 0 | 4 (chữ số) |
| ô 5×8 · tiêu chuẩn | 0/30 | 30 | 0 |

→ Điểm gấp khúc của Opus được xác nhận với n của chúng tôi (upstream đo
được 95% ở 10×16 với n=20). "Chế độ an toàn Opus" khả thi: 10×16 trên
trang lớn ≈ 1,7 ký tự trên mỗi token hình ảnh trên corpus của bộ khung.

### Qua OpenRouter (cùng corpus/câu hỏi) — chưa kết luận về khả năng đọc

| sự kiện đã đo lường | con số |
|---|---|
| content_filter trên câu hỏi phiên âm (trang tiêu chuẩn) | 60/60 (100%) |
| content_filter trên trang độ phân giải cao | 5-6/30 (~20%) |
| Fable độ phân giải cao: từ chối đọc + lỗi | 20 ILEGIVEL + 5 lỗi (2 dự đoán được) |
| Opus 10×16 (trước khi hết credit) | 7/9 chính xác (78%) |
| lỗi đọc dự đoán được bởi ma trận nhầm lẫn | 4→a, 0→8, chữ hoa/thường S/s |

### So sánh tầng vận chuyển (cùng câu hỏi, cùng nội dung)

| tầng vận chuyển | lọc/từ chối | trang lớn đọc được không? |
|---|---|---|
| API trực tiếp (n=9, trước khi hết credit) | 0 | chưa kiểm tra |
| OpenRouter | ~100% std / ~20% hi-res | không (nghi ngờ: resample) |
| Claude Code CLI (đăng ký) | 0 content_filter; ~50% batch lớn bị treo (đã giải quyết bằng chunk 10 + retry) | không (nghi ngờ: Read resize) |

## 3. Chi phí theo từng nhà cung cấp (offline, chính xác — TRANG ĐẦY ĐỦ,
lý thuyết)

| nhà cung cấp · trang | token/trang | ký tự/trang | **ký tự/token** | trạng thái |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (tất cả mô hình) | 1460 | 28.080 | **19,2** | đã đo lường |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (ít hơn 3,3× số ảnh) | tính phí đã đo lường; khả năng đọc đang chờ (H1) |
| GPT-5 (tile) dải 768×2048 | 1190 | ~38.760 | **32,6** | tài liệu đã kiểm toán |
| GPT-5.4/5.5 (patch, original) lên đến 1568×5984 | ~9.163 | ~233k | **25,4** | tài liệu; khả năng đọc chưa kiểm tra |
| gpt-4o-mini | 48.169/dải | — | **0,8 — KHÔNG BAO GIỜ ảnh hóa** | tài liệu (lỗi D2 đã sửa) |
| Gemini tile 1533×1152 (đơn vị crop gốc 768) | 1032 | 43.615 | **42,3 ← tỷ lệ ghi tài liệu tốt nhất** | tài liệu; khả năng đọc chưa kiểm tra |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (nếu đọc được)** | giả thuyết H6 |

## 4. Lỗi được tìm thấy và sửa (kiểm toán đối chiếu tài liệu chính thức)

| id | lỗi | tác động | commit |
|---|---|---|---|
| D2 | gpt-4o-mini rơi vào tile mặc định 85/170 (thực tế: 2833/5667) | chi phí bị ước tính thấp hơn ~33× — **gate bị đảo ngược** | e6bc75f |
| D1 | hệ số nhân o4-mini 1,62 (thực tế 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) với giới hạn 10000 (thực tế 1536, không có original) | sẽ hỏng với trang lớn hơn | e6bc75f |
| D4 | gpt-5-codex-mini trong chế độ tile (thực tế: patch 1536) | ước tính thấp hơn ≥+23% | e6bc75f |
| D5 | detail:'original' được gán cứng cho mọi mô hình (chỉ tồn tại từ 5.4+) | ngoài hợp đồng | e6bc75f |
| #44 | stub mô tả được chèn vào công cụ có kiểu → 400 + fallback âm thầm | mức tiết kiệm về không mà không có tín hiệu | 0f66e32 |
| AA | atlas AA trong sản xuất, trái với comment "chỉ dùng để đánh giá" | −17pp độ đọc trên Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0,997× + cột patch dư | đã sửa thành 312 | baseline |

## 5. Các giả thuyết còn mở (chi phí để khép lại từng giả thuyết)

| id | giả thuyết | bằng chứng hiện tại | phép thử quyết định | chi phí |
|---|---|---|---|---|
| H1 | Trang 1928² đọc được ≥ tiêu chuẩn trên API trực tiếp (WYSIWYG đã chứng minh trong tính phí) | tính phí 4764 không resample; 1-bit đã đọc được 67% ngay cả khi suy giảm | A/B trực tiếp std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit trên API trực tiếp ≈ 100% với ít hơn 3,3× số ảnh | H1 + ma trận 2×2 | giống H1 | tương tự |
| H3 | Read của CLI và OpenRouter resize hình ảnh >1568/2000px | 5×8 chết còn 10×16 sống SÓT TRÊN CÙNG một trang | một trang 1928² với glyph 20×32 mỗi tầng vận chuyển | ~US$0 (CLI) |
| H4 | Từ chối trả lời phụ thuộc vào cách diễn đạt (agent-đọc-một-tệp ≈ 0% vs API thô ≈ 100%) | so sánh tầng vận chuyển ở trên | A/B cách diễn đạt trên đường dẫn proxy thực | thấp |
| H5 | Gemini tile 1533×1152 đọc được ở 5×8 (42 ký tự/tok) | không có | density-frontier với GEMINI_API_KEY | ~miễn phí (tier miễn phí) |
| H6 | media_resolution:low đọc được (116 ký tự/tok) | không chắc (bộ mã hóa độ phân giải thấp), nhưng chưa ai đo | 1 lệnh gọi | ~miễn phí |
| H7 | GPT: khả năng đọc dải + thổi phồng token completion (rủi ro PageWatch) | cộng đồng thấy −40% prompt nhưng +completion/độ trễ 2× | density-frontier với OPENAI_API_KEY | ~US$2-5 |
| H8 | Phẫu thuật glyph (H~K, 0/8, 5/3…) chuyển từ chối đọc thành đọc được | sau 1-bit, MỌI lần trượt của Fable đều trở thành từ chối đọc | chỉnh sửa ~10 bitmap + chạy lại ma trận | $0 (CLI) |
| H9 | Theme sáng (đen-trên-trắng) > đảo ngược | tài liệu học thuật (paper Glyph, Tesseract); chưa từng đo trên một VLM thương mại | cờ style + 2 nhánh | $0 (CLI) |
| H10 | Opus ở 7×10 nằm giữa 0% (5×8) và 87% (10×16) → đánh đổi hợp lý | đường cong upstream 35% ở 7×10 (n=20) | 1 nhánh bổ sung | $0 (CLI) |
| H11 | Retry-khi-bị-từ-chối trong proxy khôi phục ~50% batch bị lọc | từ chối trả lời là ngẫu nhiên theo từng lệnh gọi | triển khai + đo trong sản xuất | mã nguồn |

## 6. Các mục còn chờ về vận hành

1. `gh auth login` → tạo repo riêng tư `diegosouzapw/omniglyph` + push (10
   commit cục bộ).
2. Credit Anthropic (H1/H2, kết luận hình học) và OpenRouter (đã hết).
3. **Xoay vòng các khóa** Anthropic và OpenRouter đã bị lộ trong chat.
4. Hàng chờ mã nguồn: #45 (schema-strip draft-07), retry-khi-bị-từ-chối
   (H11), phẫu thuật glyph (H8), Giai đoạn 4 (TS trong scripts, GIF, tài
   liệu, dashboard v2), Giai đoạn 5 (engine OmniRoute).

## PHỤ LỤC 2026-07-06 — A/B qua API trực tiếp (165 lệnh gọi): H1/H2 BỊ BÁC BỎ

| cấu hình | chính xác | từ chối đọc | từ chối trả lời | lỗi |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA và 1-bit) | 0/60 | 0 | **60/60 từ chối trả lời** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 dự đoán được) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 dự đoán được) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

KẾT LUẬN: trang 1928² của tier độ phân giải cao ĐƯỢC TÍNH PHÍ WYSIWYG
(4764 tok, sweep) nhưng BỘ MÃ HÓA không nhận được độ phân giải đầy đủ —
1-2/30 đọc được, với lỗi hoán đổi glyph đơn (6→8, a→4), dấu hiệu của một
resample nội bộ. **Tính phí ≠ đầu vào bộ mã hóa → bẫy: chi phí gấp 3,3×,
khả năng đọc tệ hơn.** ĐÃ ÁP DỤNG: pageGeometryForTier() đã hoàn tác — cả
hai tier đều render 1568×728; hạ tầng tier được giữ lại (tính phí chính
xác vẫn hợp lệ và việc điều chỉnh lại trong tương lai chỉ tốn 1 dòng). H3
đã cập nhật: "resample tầng vận chuyển" (cũng) chính là bộ mã hóa của
API. Từ chối trả lời cho phiên âm qua API thô: 100% trên trang tiêu chuẩn
(H4 được củng cố — chỉ có cách diễn đạt kiểu agent mới thoát được). Opus
10×16 được xác nhận trên cả hai tầng vận chuyển (77-87%).

## PHỤ LỤC 2026-07-06 (2) — Loạt kiểm tra GPT-5.5 qua API trực tiếp: H7
đã khép lại (THẤT BẠI)

| nhánh | chính xác từng chữ | gist | output/câu trả lời |
|---|---:|---:|---:|
| dải 768×2048 5×8 AA | 0/30 (18 từ chối, 5 bị lọc, 7 lỗi) | 0/3 | 2.639 tok |
| dải 5×8 1-bit | 0/30 (15 từ chối, 5 bị lọc, 10 lỗi) | 1/3 | 2.383 tok |
| VĂN BẢN (đối chứng) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 không thể đọc glyph 5×8 (0/60; ngay cả gist cũng không sống sót)
và thổi phồng completion ~40× khi cố giải mã chúng (2,4-2,7k token suy
luận mỗi câu hỏi) — mức tiết kiệm prompt bị nuốt hết bởi output. Đối
chứng văn bản hoàn hảo chứng minh corpus/câu hỏi là hợp lý. Xác nhận và
định lượng việc opt-in cho 5.5; gpt-5.6 (mặc định) vẫn chưa kiểm tra được
(tài khoản không có quyền truy cập). Tương lai (H12): gate GPT phải mô
hình hóa sự thổi phồng output, không chỉ token prompt.

## PHỤ LỤC 2026-07-06 (3) — Gemini 2.5-flash (MỘT PHẦN: hạn ngạch tier
miễn phí cạn giữa chừng)

Trong số ~26 câu trả lời hình ảnh lọt qua trước khi hạn ngạch cạn kiệt:
**0 đúng, 1 từ chối đọc, ~25 BỊA ĐẶT** — và chúng không phải là nhầm lẫn
glyph: chúng là các chữ số ngẫu nhiên (`indexLedgerInd →
0040375615`), tức là bộ mã hóa gần như không thấy gì ở các mật độ được
kiểm tra (tile gốc 42 ký tự/tok và MEDIUM cố định) và 2.5-flash BỊA ĐẶT
thay vì từ chối trả lời (bỏ qua chỉ dẫn ILEGIVEL). Đối chứng văn bản: 3/3
trên những câu lọt qua được. Không có thổi phồng output (6-28 tok/câu trả
lời).

Tín hiệu sơ bộ: H5/H6 nghiêng về KHÔNG trên 2.5-flash, với một chế độ lỗi
TỆ HƠN GPT (bịa đặt âm thầm thay vì từ chối trả lời) — Gemini sẽ cần thêm
các biện pháp bảo vệ trong proxy. Còn chờ khép lại: chạy lại với hạn
ngạch trả phí hoặc vào một ngày khác, và kiểm tra gemini-2.5-pro (flash là
bộ đọc yếu nhất trong gia đình). Trang tile gốc vẫn có tỷ lệ GHI TÀI LIỆU
tốt nhất (42,3 ký tự/token); chính khả năng đọc mới là điều đang bị nghi
ngờ.

Ghi chú về chi phí: các trang một phần (trang cuối cùng của corpus) bị
tính phí tệ dưới chế độ tile (chiều cao thấp → đơn vị crop nhỏ → nhiều
tile hơn) — đệm trang cuối lên 1152px chiều cao là một tối ưu hóa bắt
buộc nếu Gemini được đưa vào.
