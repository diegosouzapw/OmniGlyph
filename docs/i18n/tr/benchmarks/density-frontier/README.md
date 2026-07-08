# density-frontier — çözünürlük başına maliyet × doğruluk

Metin→görüntü render'larının, sağlayıcı (Anthropic / OpenAI / Gemini),
sayfa geometrisi, glif hücresi ve atlas stili başına **maliyet ve
okunabilirlik arasındaki Pareto sınırını** ölçen harness.

Merkezi asimetri: faturalama sweep'inden (2026-07-05,
`benchmarks/billing-sweep/`) bu yana, **maliyet çevrimdışı olarak tam
tahmin edilebilir** — Anthropic'te 28 px parça + blok başına 4
(`src/core/anthropic-vision.ts`), OpenAI'de parça/döşeme profilleri
(`src/core/openai.ts`), Gemini'de döşeme/media_resolution
(`gemini-cost.ts`). Yalnızca **okuma doğruluğu** API gerektirir.

## Tasarım

- **Korpus** (`corpus.ts`): yoğun log/JSON tarzı dolgu + karıştırılabilirlik
  matrisinin başarısız olduğunu söylediği sınıflardan ekilmiş needle'lar
  (12 karakter hex, camelCase, rakamlar 6/8/5/3) + ölçülen karıştırılabilir
  çiftlerden inşa edilmiş **yakın-ıskala dikkat dağıtıcıları**. Model
  dikkat dağıtıcıyla cevap verirse, karışıklık *tahmin edilmiş* demektir —
  bu, tespit edilen sessiz başarısızlık modudur, yalnızca yanlış sayılan
  değil. Deterministik (mulberry32).
- **Yapılandırmalar** (`configs.ts`): seçilmiş bir ızgara — standart
  1568×728 sayfalar vs yüksek çözünürlük 1928×1928 (katman başına
  geometriye karar veren A/B), AA vs 1-bit (yoğun-render çelişkisini
  çözer), 7×10/10×16 hücre (Opus güvenli modu), GPT şeridi ve iki Gemini
  bahsi (≤384² = sabit 258; `media_resolution: low` = sabit 280 →
  *okunabilirse* ~116 karakter/token).
- **Puanlama** (`score.ts`): deterministik tam eşleşme, LLM-yargıç yok. Üç
  sonuç: `correct` / `abstained` (ILEGIVEL sentinel'i — dürüst
  başarısızlık) / `silent_wrong` (tehlikeli mod), dikkat dağıtıcı
  bayrağıyla.

## Çalıştırma

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # maliyet tablosu, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # yapılandırma × deneme başına ~9 needle+3 gist
```

Belirli yapılandırmalar: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Cevaplar `results/*.jsonl`'a düşer (denetim için ham cevapla birlikte soru
başına bir satır).

## Kabul çıtası (upstream PR #35/#36'dan miras)

Bir yapılandırma yalnızca şu durumda üretim varsayılanı olur: **gist ==
metin taban çizgisi** VE **sıfır sessiz yanlış tam-string** VE **pozitif
tasarruf**. İlk zorunlu çalıştırma, Fable üzerinde
`anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa`'dır — yüksek
çözünürlük katmanını etkinleştirmeden önce büyük sayfanın okunabilirlik
noktasal kontrolüdür.

## `--via-omniroute` — OmniRoute üzerinden e2e (P3: bozulmama kanıtı)

Yukarıdaki aktarımlar, metni→PNG'yi **harness içinde** render eder ve
görüntüleri gönderir. `--via-omniroute` tam tersini yapar, bu da üretim
yoludur: **yoğun metni** çalışan bir OmniRoute örneğine gönderir,
**`omniglyph` motorunun sayfaları render etmesine** ve Anthropic'e iletmesine
izin verir ve okumaları + tasarrufları ölçer. Okumalar doğrudan yolla aynı
kalırsa **ve** OmniRoute sıkıştırma bildirirse, OmniRoute'un render+iletmesinin
sayfaları **bozmadığı** kanıtlanmış olur.

Ön koşullar (operasyonel):

1. **OmniRoute çalışıyor** (`npm run dev`, varsayılan `http://localhost:20128`).
2. OmniRoute'ta **gerçek bir anahtarla** yapılandırılmış bir **Anthropic
   sağlayıcısı** (doğrudan rota — `providerTransport==='direct'` kapısı
   yalnızca `anthropic` sağlayıcısı için geçer).
3. OmniRoute'un sıkıştırma yapılandırmasında **ETKİNLEŞTİRİLMİŞ
   `omniglyph` motoru** (`config.engines.omniglyph.enabled = true`) —
   `engine:omniglyph` başlığı yalnızca motor açıkken tetiklenir. (Motor
   `stable:false`/önizleme durumundadır; açıkça etkinleştirin.)
4. `OMNIROUTE_API_KEY` içinde bir **OmniRoute API anahtarı** (istemcinin
   OmniRoute'a karşı kimlik doğrulamak için kullandığı, Anthropic
   anahtarı değil).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<omniroute-anahtarınız> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Her cevap, JSONL'da `omnirouteSavings: { originalTokens, compressedTokens,
savingsPercent }` (`X-OmniRoute-Compression` yanıt başlığından) kaydeder;
tablo satırı, kaç cevabın sıkıştırılmış geldiğini + medyan tasarrufu
gösterir. **P3 çıtası**: doğrudan rotayla aynı tam metin/gist isabetleri
(bozulmama) **VE** null olmayan `omnirouteSavings` (bir render'ın
gerçekleştiğini, ham-metin okumasının değil, kanıtlayan). `did NOT compress`
görünürse, motor OmniRoute'ta etkinleştirilmemiştir (veya gövde fail-closed
kapılarından geçmemiştir).

Saf parçalar için testler: `tests/density-frontier.test.ts` (via-omniroute
aktarımından `buildOmnirouteRequest` ve `parseCompressionSavings` dahil).
