# Değişiklik Günlüğü

Biçim: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · anlamsal sürümleme.

## [1.0.0] — 2026-07-07

İlk genel sürüm.

### Ürün

- **Görüntü olarak bağlam sıkıştırma proxy'si**: her LLM isteğinin hacimli
  parçalarını (system prompt, araç dokümanları, eski geçmiş, büyük araç
  çıktıları) makinenizden çıkmadan önce yoğun 1-bit PNG sayfalara dönüştürür.
  Yerel Node sunucusu ve Cloudflare Workers host'u.
- **Sağlayıcı başına tam faturalama matematiği** (`src/core/`): Anthropic
  28px parça + blok başına 3–4 token ek yükü (kendi ölçümü, sıfır kalıntı),
  OpenAI ve Gemini formülleri resmi dokümanlara karşı denetlendi. Paket
  kökünde dışa aktarılır (`anthropicImageTokens`, `resolveAnthropicVisionTier`,
  katman sınırları).
- **Ölçülmüş üretim render yapılandırması**: yoğun 1-bit glif atlası (anti-
  aliasing yok), standart katman sayfalar — her seçim `benchmarks/*/results/`
  içindeki bir benchmark kanıtıyla desteklenir.
- **Benchmark harness'leri** (`benchmarks/`): billing-sweep (token muhasebesi)
  ve density-frontier (modeller/yoğunluklar genelinde okuma-doğruluğu
  sınırı), API, OpenRouter, Claude Code CLI veya OmniRoute üzerinden
  (`--via-omniroute`) yeniden çalıştırılabilir.
- **Refuzal yeniden denemesi**: bir model render edilmiş sayfayı reddettiğinde
  SSE/JSON algılayıcı orijinal isteği yeniden oynatır (kill switch
  `retryRefusalWithOriginal`).
- Deterministik sayfalar için **LRU render önbelleği**.
- **OmniRoute motoru**: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)
  içinde `omniglyph` sıkıştırma motoru olarak gönderilir (tek mod ve
  yığılmış pipeline), fail-closed kapılar ve görüntü-farkında token
  muhasebesiyle.

### Rakamlar (hepsi yeniden üretilebilir)

- Örnek UI render'ı: 1015 karakter → 438×120 PNG, 254 → 84 token
  (**%66,9 tasarruf**).
- Standart sayfa 1568×728 = ne kadar metin taşırsa taşısın 1456 görüntü
  token'ı.
- Claude, üretim yoğunluğunda yoğun 1-bit sayfaları %100 okur; Opus 4.8,
  10×16'da %77–87 okur.

### Negatif kararlar (ölçüm, görüş değil)

- **Yüksek çözünürlük katmanı bir faturalama tuzağıdır**: 1928² sayfa
  WYSIWYG faturalandırılır ancak kodlayıcı tam çözünürlüğü almaz — her iki
  katman da standart sayfalar render eder.
- **GPT-5.5 reddedildi**: yoğun şeridin 0/60 okuması ve metin kontrolüne
  karşı ~40× tamamlama şişmesi.
- **gpt-4o-mini hiçbir zaman görüntülenmedi** (2833/5667 token tabanı bunu
  kârsız kılıyor).
- **Gemini 2.5-flash**, yoğun sayfalarda çekimser kalmak yerine uyduruyor
  (0/26) — ücretli kota ile yeniden test bekliyor.
