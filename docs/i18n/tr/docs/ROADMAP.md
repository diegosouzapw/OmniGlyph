# Fork yol haritası — "bizim OmniGlyph" + OmniRoute entegrasyonu

Birleştirilmiş çalışma planı (2026-07-05) kaynaklar: ölçülen faturalama
sweep'i, resmi dokümanlara karşı OpenAI/Gemini denetimi, ilgili araçların
analizi ve density-frontier harness'i. Her öğenin durumu: ☐ beklemede · ◐ kısmi · ☑ burada tamamlandı.

## Aşama 0 — Ölçüm temeli (bu depoda TAMAMLANDI)

- ☑ Tam Anthropic faturalaması (28px parça, 2 katman, blok başına +4) — `src/core/anthropic-vision.ts`, sweep `benchmarks/billing-sweep/` içinde.
- ☑ Tam maliyetli kârlılık kapısı (w·h/750 × 1.10'un yerine geçti).
- ☑ Katman başına geometri: Fable/Opus 4.8/Sonnet 5 → 1928×1928 sayfalar (3,3× daha az görüntü); standart → 1568×728. 691 test yeşil.
- ☑ `benchmarks/density-frontier/` harness'i (API üzerinden çevrimdışı maliyet × doğruluk, karıştırılabilir dikkat dağıtıcılarla needle'lar, deterministik puanlama).

## Aşama 1 — Çoklu sağlayıcı faturalama düzeltmeleri (denetimde onaylanan hatalar)

Denetim tarafından belirlenen öncelik (resmi dokümanlar 2026-07-05'te yakalandı):

1. ☐ **D2 (TERS ÇEVRİLMİŞ kapı)**: `gpt-4o-mini`, varsayılan döşeme 85/170'e düşüyor, ancak maliyeti **2833 taban / 5667 döşeme başına** (~33× hafife alınmış, ~0,8 karakter/token) — bunu görüntülemek her zaman bir kayıptır ve kapı onaylıyor. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` koşulsuz olarak gönderiliyor (`src/core/openai.ts:392,402`), ancak yalnızca gpt-5.4+ içinde var; profilden türetin.
3. ☐ **D1**: `o4-mini` çarpanı 1.62 → **1.72** (yüzde 5,8 hafife alıyor).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`, `original` olmadan **1536 sınırı** olan parça grubunda (kod 10000 varsayıyor); `gpt-5-codex-mini` yanlış rejimde (döşeme → parça).
5. ☐ **GPT geometrisi**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (HER İKİ rejimle de hizalar: 64×32 parça ve 4×512 döşeme; +%6,25 ücretsiz karakter). Özel 5.4/5.5 `original` profili: 1568×5984'e kadar (9.163 parça ≤ 10k, tek blokta ~233k karakter) — önce okunabilirlik A/B.
6. ☐ **Gemini desteği** (yeni): `src/core/gemini.ts` + `gemini-model-profiles.ts` + proxy içinde `:generateContent`/`:streamGenerateContent` rotaları. Belgelenebilir geometri: **1152×1536 (tam kırpma birimi 768, 4 döşeme, 42,2 karakter/token — 3 sağlayıcı arasında en iyi belgelenmiş oran)**; kalibre edilecek bahisler: `media_resolution:MEDIUM` ile 768² (56,4) ve Gemini 3 HIGH. Dikkat: Gemini'nin OpenAI-uyumlu endpoint'i, yanlış faturalamayla OpenAI dönüştürücüsünden geçer.

## Aşama 2 — Okuma kalitesi (yargıç olarak density-frontier harness'i)

- ◐ Fable üzerinde kesin std vs high-res A/B (çalışıyor; çıta: gist == metin VE sıfır sessiz-yanlış VE tasarruf > 0).
- ☐ Yoğun yolda AA vs 1-bit çelişkisini çöz (kod "yalnızca-eval" diyor, üretim AA kullanıyor).
- ☐ (2026-07-06 gerekçesiyle ERTELENDİ) Glif ameliyatı: üretim yapılandırması 30/30 okuyor — ameliyatın düzeltebileceği ölçülebilir bir eksiklik bugün yok. Kapsam altına 100'ün altı bir hedef girerse (örn. Opus) veya yeni ölçümler bir gerileme gösterirse yeniden ele alınacak.
- ☑ ~~Açık tema A/B~~ inceleme ile ÇÖZÜLDÜ (2026-07-06): render ZATEN siyah-beyaz üzerinde (render.ts:635/822, blit-sonrası tersine çevirme) — literatürle uyumlu; hipotez yanlış bir öncülden doğdu (yukarı akış örnek görüntüsü).
- ☐ Byte-tam ID'ler için checksum'lu kelime listesi (upstream #38, onaylandı) + çekimserlik banner'ı (#31/#32) + factsheet'te camelCase (#33/#34).
- ☑ Port #45: $schema/$id korundu, tuple'lar öğe başına soyuldu (main'de commit).
- ☑ Refuzalde-yeniden-deneme (#37/H11): kayıpsız oynatma algılayıcısı + orijinal gövdeyle tek yeniden deneme; refusalRetried telemetrisi (main'de commit).
- ☐ Rehidrasyon aracı (`RecoverableBlock` → çağrılabilir araç; LensVLM seçici yeniden genişlemeyi doğrular).

## Aşama 3 — Performans/sağlamlık

- ☐ LRU render önbelleği (değişmezle deterministik; slab + dondurulmuş parçalar bugün her istekte yeniden render ediliyor).
- ☐ Bir worker thread'de PNG kodlama; yapılandırılabilir deflate seviyesi.
- ☐ Açık yukarı akış düzeltmelerini taşı: #44 (yazılı native araçlar → 400), #45 (şema-soyma draft-07 → 400 döngüsü), #42 (Claude Desktop için CONNECT proxy), #19 (GPT açıklamalarının çift faturalandırılması).
- ☐ ADAPTIVE_CPT_PLAN'ı uygula (blok rolü başına cpt; gerçek slab = 1,50).

## Aşama 4 — Fork'un kendisi

- ☐ Kendi adı/deposu (Diego'nun kararı) + cherry-pick'ler için upstream `git remote`.
- ☐ **Her yerde TS**: core zaten TS; `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` dönüştür (kalıp: tsx + vitest; `benchmarks/density-frontier/` bu şekilde doğdu).
- ☐ OmniRoute kalite standardı: eslint 9 + prettier, typecheck/test/build/link-check ile CI, CONTRIBUTING, SECURITY, README i18n (önce pt-BR), anlamsal CHANGELOG.
- ☐ README'de video yerine **GIF'ler** (vhs/asciinema+agg ile kaydedin; düz vs proxy yan yana).
- ☐ Dashboard v2 (HTTP API üzerinden yeniden uygula — üçüncü taraf kodu miras almayın): "ANTHROPIC_BASE_URL ile terminal aç" başlatıcısı, "trafik benden mi geçiyor?" kontrolü, görüntü-vs-metin denetleyicisi, oturumlar, para biriminde maliyet paneli, hafif i18n, polling yerine SSE, saklama süreli SQLite kalıcılığı (24 sütunlu şeması iyi bir başlangıç noktası).
- ☐ dense-image-gen'den mikro fikirler: `lines` modu (kod/tablolar için düzen korunur), `--keep-ws`, sayfa başına köken başlığı ("system prompt" / "araç dokümanları" / "geçmiş tur N"), bağımsız CLI `render dosya.md -o out.png`.

## Aşama 5 — OmniRoute'a taşıma

- ☐ `CompressionEngine` motoru (`cavemanAdapter.ts` şablonu), `engines/index.ts` + `engineCatalog.ts` içinde kayıtlı; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Tesisat: `chatCore.ts:1297`'de `supportsVision`'ı geçir (1 satır) veya `isVisionModelId` ile çöz.
- ☐ Yığın sırası: son (RTK/Caveman/anlamsal render'lar önce; OmniGlyph kalanı görüntüleştirir).
- ☐ Değişmezler: istemcinin `cache_control` bloklarını asla yeniden yazma (ders #4560); sadakat kapısı (#5127) beyan edilmiş bir muafiyet veya değişmezleri karşılayan bir metin factsheet'i gerektiriyor; `skip_reason` ile deneme telemetrisi (ders #4268).
- ☐ Yönlendirme: motor-sonrası fallback/retry, görüntü yeteneğine ve izin listesine saygı göstermelidir (yeniden sıkıştır veya bypass).
- ☐ CCR sinerjisi: `emitRecoverable` → dilim başına alma ile CCR store (`head/tail/grep`, #5187) = tam seçici yeniden genişleme.
- ☐ Pazarlama özelliği olarak ücretsiz katman uzatma: her ücretsiz katman token'ı görüntü modellerinde ~2-3× daha fazla karakter verir; Gemini ücretsiz katmanı + 1152×1536 geometrisi en güçlü örnek.

## Açık riskler

- Görüntülenmiş bağlamda yeniden dağıtım sonrası Fable refuzalleri (upstream #37) — OmniRoute'ta varsayılan açık öncesi hafiflet.
- Fiyat arbitrajı: Anthropic görüntüyü yeniden fiyatlandırırsa, tasarruflar değişir — istek başına karşı olgu (`count_tokens`) savunmadır.
- OpenAI: topluluk ölçümü (PageWatch) tamamlama token'larının arttığını ve gecikmenin 2× olduğunu gördü — etkinleştirmeden önce sağlayıcı başına ölçün.

## 2026-07-05 A/B sonuçları (OpenRouter üzerinden — geometri için SONUÇSUZ, hata modları için geçerli)

| yapılandırma | tam | çekim. | filtrelendi | sessiz-yanlış |
|---|---|---|---|---|
| fable std 5×8 (AA ve 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 tahmin edildi) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 tahmin edildi) |
| opus hires 10×16 | **7/9 okundu** | 0 | 21 kredi bitti | 2 (rakam) |

Geçerli bulgular: (1) sınıflandırıcı (issue #37), standart sayfada
transkripsiyon soruları için BASKIN başarısızlık modudur — %100 filtrelendi
— ve büyük sayfada tetiklenmiyor; ifade önemlidir. (2) Çekimserlik
çalışıyor: büyük sayfada 5 uydurmaya karşı 20× ILEGIVEL. (3) Opus 10×16'da
%78 tam okuyor (n=9) vs 5×8'de tarihsel %0 — dirseğin ilk elden ilk
kanıtı. (4) Büyük sayfanın OpenRouter üzerinden okunmazlığı, bir aktarım
RESAMPLE'ını (Bedrock/Vertex standart katman?) düşündürüyor — Anthropic'in
doğrudan API'sinde test edilecek kesin hipotez; geometri A/B o zamana
kadar AÇIK kalıyor. OpenRouter kredileri Opus kolu ortasında bitti.

## Nihai 2×2 matris (2026-07-05, CLI/abonelik üzerinden, Fable 5, n=30/kol)

| sayfa × atlas | 1-bit | AA |
|---|---|---|
| standart 1568×728 | **30/30 (%100)** | 25/30 + 5 çekim. |
| high-res 1928×1928 | **20/30 (%67)** + 10 çekim. | 0/30 + 29 çekim. |

4 kolda sıfır uydurma (120 soru — her başarısızlık ILEGIVEL idi).
UYGULANDI: DENSE_RENDER_STYLE, tests/dense-style.test.ts'de bir pin ile
1-bit'e (aa:false) çevrildi. Opus 4.8: büyük sayfada 10×16'da 26/30,
5×8'de 30/30 ILEGIVEL — Opus güvenli modu uygulanabilir. Yüksek çözünürlüklü
sayfa, aktarımlar tarafından (CLI Read/OpenRouter resample) bozulmaya devam
ediyor — WYSIWYG geometri kararı hâlâ doğrudan API'ye bağlı.
