# OmniGlyph — Birleştirilmiş ölçümler (2026-07-05)

Bu oturumda ÖLÇÜLEN her şey, kaynağı ve n'i ile; hipotezler sonda açıkça
ayrılmıştır. Kanıtlar: `benchmarks/billing-sweep/results/` ve
`benchmarks/density-frontier/results/` (cevap başına JSONL).

## 1. Anthropic faturalaması (doğrudan count_tokens, $0, 11 geometri × 2 model)

Onaylanan formül: katman başına yeniden boyutlandırmadan sonra
`tokens = ceil(w/28) × ceil(h/28)`, **blok başına +3 (Fable 5) / blok
başına +4 (Sonnet 4.5)** — tüm satırlarda SIFIR kalıntı.

| prob | boyutlar | Fable 5 (yüksek çöz.) | Sonnet 4.5 (standart) |
|---|---|---:|---:|
| doküman çapası | 1092×1092 | 1524 | 1525 |
| doküman çapası | 1000×1000 | 1299 | 1300 |
| standart sayfa | 1568×728 | 1459 | 1460 |
| **büyük sayfa** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (yeniden örnekleme) |
| yüksek çöz. tavanı | 1960×1960 | 4764 (kırpma) | 1525 |
| yüksek çöz. uzun kenar | 2576×1204 | 3959 | 1516 |
| uzun şerit | 768×1932 | 1935 | 1292 (yeniden örnekleme) |
| 2×1092² (çoklu) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 görüntü) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→küçültme, count_tokens'te REDDEDİLMEDİ) | 3585 |

Türetilen kararlar (uygulandı): tam parça-başına kapı; model başına katman
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = yüksek çözünürlük); `cols` 313→312.

## 2. Okuma doğruluğu (density-frontier, hex/camelCase/rakam needle'lar + dikkat dağıtıcılar)

### Fable 5 2×2 matris — CLI/abonelik üzerinden, kol başına n=30, aynı korpus (~16,6k karakter)

| sayfa × atlas | tam | çekimserlik (ILEGIVEL) | sessiz hatalar |
|---|---:|---:|---:|
| standart 1568×728 · **1-bit** | **30/30 (%100)** | 0 | 0 |
| standart 1568×728 · AA | 25/30 (%83) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (%67) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (matris tarafından tahmin edildi) |

→ **1-bit, her iki sayfada da AA'dan üstün; 120 soruda sıfır uydurma.**
UYGULANDI: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res, aktarım yeniden örneklemesiyle bozulmuş gelir (bkz. H1/H3) —
%67 bir taban, tavan değil.

### Opus 4.8 — CLI/abonelik üzerinden, kol başına n=30

| yapılandırma | tam | çekimserlik | hatalar |
|---|---:|---:|---:|
| high-res · 10×16 hücre | **26/30 (%87)** | 0 | 4 (rakamlar) |
| standart · 5×8 hücre | 0/30 | 30 | 0 |

→ Opus dirseği kendi n'imizle onaylandı (upstream, n=20 ile 10×16'da %95
ölçtü). "Opus güvenli modu" uygulanabilir: büyük sayfada 10×16, harness
korpusunda görüntü token'ı başına ~1,7 karakter.

### OpenRouter üzerinden (aynı korpus/sorular) — okunabilirlik için sonuçsuz

| ölçülen gerçek | sayı |
|---|---|
| standart sayfalarda transkripsiyon sorularında content_filter | 60/60 (%100) |
| high-res sayfalarda content_filter | 5-6/30 (~%20) |
| Fable high-res: çekimserlik + hatalar | 20 ILEGIVEL + 5 hata (2 tahmin edildi) |
| Opus 10×16 (kredi bitmeden önce) | 7/9 tam (%78) |
| karıştırılabilirlik matrisi tarafından tahmin edilen yanlış okumalar | 4→a, 0→8, S/s büyük-küçük harf |

### Aktarım karşılaştırması (aynı soru, aynı içerik)

| aktarım | filtre/refuzal | büyük sayfa okunabilir mi? |
|---|---|---|
| Doğrudan API (n=9, kredi bitmeden önce) | 0 | test edilmedi |
| OpenRouter | ~%100 std / ~%20 hi-res | hayır (şüphelenilen: yeniden örnekleme) |
| Claude Code CLI (abonelik) | 0 content_filter; büyük gruplarda ~%50 takıldı (10'luk gruplar + yeniden deneme ile çözüldü) | hayır (şüphelenilen: Read yeniden boyutlandırıyor) |

## 3. Sağlayıcı başına maliyet (çevrimdışı, tam — TAM sayfalar, teorik)

| sağlayıcı · sayfa | token/sayfa | karakter/sayfa | **karakter/token** | durum |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (tüm modeller) | 1460 | 28.080 | **19,2** | ölçüldü |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× daha az görüntü) | faturalama ölçüldü; okunabilirlik bekliyor (H1) |
| GPT-5 (döşeme) şerit 768×2048 | 1190 | ~38.760 | **32,6** | denetlenmiş dokümanlar |
| GPT-5.4/5.5 (parça, original) 1568×5984'e kadar | ~9.163 | ~233k | **25,4** | dokümanlar; okunabilirlik test edilmedi |
| gpt-4o-mini | 48.169/şerit | — | **0,8 — ASLA görüntüleştirme** | dokümanlar (D2 hatası düzeltildi) |
| Gemini döşeme 1533×1152 (native kırpma birimi 768) | 1032 | 43.615 | **42,3 ← en iyi belgelenmiş** | dokümanlar; okunabilirlik test edilmedi |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (okunabilirse)** | hipotez H6 |

## 4. Bulunan ve düzeltilen hatalar (resmi dokümanlara karşı denetim)

| id | hata | etki | commit |
|---|---|---|---|
| D2 | gpt-4o-mini varsayılan döşeme 85/170'e düşüyordu (gerçek: 2833/5667) | maliyet ~33× hafife alındı — **ters çevrilmiş kapı** | e6bc75f |
| D1 | o4-mini çarpanı 1,62 (gerçek 1,72) | −%5,8 | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex), 10000 sınırıyla (gerçek 1536, original yok) | daha büyük sayfalarla bozulurdu | e6bc75f |
| D4 | gpt-5-codex-mini döşeme rejiminde (gerçek: parça 1536) | ≥%23 hafife alındı | e6bc75f |
| D5 | detail:'original' her model için sabit kodlandı (yalnızca 5.4+'ta var) | sözleşme dışı | e6bc75f |
| #44 | yazılı araçlara enjekte edilen açıklama stub'u → 400 + sessiz geri dönüş | tasarruflar sinyalsiz sıfırlandı | 0f66e32 |
| AA | "yalnızca-eval" yorumuna karşı üretimde AA atlas | Fable'da −17pp okuma | 9a25585 |
| — | slab cols 313 (1573px) → 0,997× yeniden örnekleme ve ekstra parça sütunu | 312'ye düzeltildi | temel |

## 5. Açık hipotezler (her birini kapatmanın maliyeti)

| id | hipotez | mevcut kanıt | belirleyici test | maliyet |
|---|---|---|---|---|
| H1 | 1928² sayfa doğrudan API'de ≥ standart okunur (WYSIWYG faturalamada kanıtlandı) | yeniden örnekleme olmadan faturalama 4764; 1-bit bozuk olsa bile zaten %67 okuyor | doğrudan A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | doğrudan API'de hi-res + 1-bit ≈ 3,3× daha az görüntüyle %100 | H1 + 2×2 matris | H1 ile aynı | aynı |
| H3 | CLI'nin Read'i ve OpenRouter, >1568/2000px görüntüleri yeniden boyutlandırıyor | AYNI sayfada 5×8 ölüyor ve 10×16 hayatta kalıyor | 20×32 gliflerle bir 1928² sayfa, aktarım başına | ~US$0 (CLI) |
| H4 | Refuzal, çerçevelemeye bağlıdır (ajan-dosya-okuyor ≈ %0 vs ham API ≈ %100) | yukarıdaki aktarım karşılaştırması | gerçek proxy yolunda ifade A/B'si | düşük |
| H5 | Gemini döşeme 1533×1152, 5×8'de okunabilir (42 karakter/tok) | yok | GEMINI_API_KEY ile density-frontier | ~ücretsiz (ücretsiz katman) |
| H6 | media_resolution:low okunabilir (116 karakter/tok) | olası değil (düşük çözünürlüklü kodlayıcı), ama kimse ölçmedi | 1 çağrı | ~ücretsiz |
| H7 | GPT: şerit okunabilirliği + tamamlama-token şişmesi (PageWatch riski) | topluluk −%40 prompt ama +tamamlama/2× gecikme gördü | OPENAI_API_KEY ile density-frontier | ~US$2-5 |
| H8 | Glif ameliyatı (H~K, 0/8, 5/3…) çekimserlikleri okumaya dönüştürüyor | 1-bit'ten sonra TÜM Fable hataları çekimserlik oldu | ~10 bitmap düzenle + matrisi yeniden çalıştır | $0 (CLI) |
| H9 | Açık tema (siyah-beyaz üzerinde) > tersine çevrilmiş | literatür (Glyph makalesi, Tesseract); ticari bir VLM'de hiç ölçülmedi | stil bayrağı + 2 kol | $0 (CLI) |
| H10 | Opus 7×10'da %0 (5×8) ile %87 (10×16) arasında iner → iyi bir denge | upstream eğrisi 7×10'da %35 (n=20) | 1 ekstra kol | $0 (CLI) |
| H11 | Proxy'de refuzalde-yeniden-deneme, filtrelenmiş grupların ~%50'sini kurtarır | refuzal çağrı başına stokastik | uygula + üretimde ölç | kod |

## 6. Operasyonel bekleyen öğeler

1. `gh auth login` → özel `diegosouzapw/omniglyph` oluştur + push et (10 yerel commit).
2. Anthropic kredileri (H1/H2, geometri kararı) ve OpenRouter (tükendi).
3. Sohbette açığa çıkan Anthropic ve OpenRouter **anahtarlarını döndür**.
4. Kod kuyruğu: #45 (şema-soyma draft-07), refuzalde-yeniden-deneme (H11), glif
   ameliyatı (H8), Aşama 4 (script'lerde TS, GIF'ler, dokümanlar, dashboard v2),
   Aşama 5 (OmniRoute motoru).

## EK 2026-07-06 — doğrudan API üzerinden A/B (165 çağrı): H1/H2 ÇÜRÜTÜLDÜ

| yapılandırma | tam | çekim. | refuzal | hatalar |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA ve 1-bit) | 0/60 | 0 | **60/60 refuzal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 tahmin edildi) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 tahmin edildi) |
| opus hires 10×16 | **23/30 (%77)** | 1 | 0 | 6 |

KARAR: yüksek çözünürlüklü katmanın 1928² sayfası WYSIWYG FATURALANIR (4764
tok, sweep) ama KODLAYICI tam çözünürlüğü almaz — 1-2/30 okundu, tek-glif
değişim hatalarıyla (6→8, a→4), dahili bir yeniden örneklemenin imzası.
**Faturalama ≠ kodlayıcı girdisi → tuzak: 3,3× maliyet, daha kötü
okunabilirlik.** UYGULANDI: pageGeometryForTier() geri alındı — her iki
katman da 1568×728 render eder; katman altyapısı korundu (tam faturalama
geçerli kalır ve gelecekteki yeniden ayar 1 satır). H3 güncellendi:
"aktarım yeniden örneklemesi" (aynı zamanda) API'nin kendi kodlayıcısıydı.
Ham API üzerinden transkripsiyonda refuzal: standart sayfada %100 (H4
pekiştirildi — yalnızca ajan çerçevelemesi kaçıyor). Opus 10×16 her iki
aktarımda da onaylandı (%77-87).

## EK 2026-07-06 (2) — doğrudan API üzerinden GPT-5.5 batarya testi: H7 kapatıldı (BAŞARISIZ)

| kol | tam metin | gist | çıktı/cevap |
|---|---:|---:|---:|
| şerit 768×2048 5×8 AA | 0/30 (18 çekim., 5 filtrelendi, 7 hata) | 0/3 | 2.639 tok |
| şerit 5×8 1-bit | 0/30 (15 çekim., 5 filtrelendi, 10 hata) | 1/3 | 2.383 tok |
| METİN (kontrol) | **30/30** | **3/3** | **62 tok** |

GPT-5.5, 5×8 glifleri okuyamıyor (0/60; gist bile hayatta kalmıyor) ve
çözmeye çalışırken tamamlamayı ~40× şişiriyor (soru başına 2,4-2,7k
akıl yürütme token'ı) — prompt tasarrufları çıktı tarafından yutuluyor.
Mükemmel metin kontrolü, korpusun/soruların mantıklı olduğunu kanıtlıyor.
5.5 opt-in'ini doğrular ve nicelendirir; gpt-5.6 (varsayılan) test edilemez
durumda kalıyor (hesabın erişimi yok). Gelecek (H12): GPT kapısı yalnızca
prompt token'larını değil, çıktı şişmesini de modellemelidir.

## EK 2026-07-06 (3) — Gemini 2.5-flash (KISMİ: ücretsiz katman kotası çalışma sırasında bitti)

Kota ölmeden önce geçen ~26 görüntü cevabından: **0 doğru, 1 çekimserlik,
~25 UYDURMA** — ve bunlar glif karışıklığı değil: rastgele rakamlar
(`indexLedgerInd → 0040375615`), yani kodlayıcı test edilen yoğunluklarda
neredeyse hiçbir şey görmüyor (native döşeme 42 karakter/tok ve MEDIUM
sabit) ve 2.5-flash, çekimserlik yerine UYDURUYOR (ILEGIVEL talimatını
görmezden geliyor). Metin kontrolü: geçenlerde 3/3. Çıktı şişmesi yok
(cevap başına 6-28 tok).

Ön sinyal: H5/H6, 2.5-flash'ta HAYIR'a doğru eğiliyor, GPT'den DAHA KÖTÜ
bir hata modu ile (çekimserlik yerine sessiz uydurma) — Gemini, proxy'de
ekstra güvenlik önlemleri gerektirir. Kapatılmayı bekleyen: ücretli kota
ile veya başka bir günde yeniden çalıştırma ve gemini-2.5-pro'yu test etme
(flash, ailedeki en zayıf okuyucu). Native-döşeme sayfası hâlâ en iyi
BELGELENMİŞ orana sahip (42,3 karakter/token); şüpheli olan okunabilirlik.

Maliyet notu: kısmi sayfalar (korpusun sonuncusu) döşeme rejiminde kötü
faturalandırılır (kısa yükseklik → küçük kırpma birimi → daha fazla
döşeme) — son sayfayı 1152px yüksekliğe doldurmak, Gemini devreye girerse
zorunlu bir optimizasyondur.
