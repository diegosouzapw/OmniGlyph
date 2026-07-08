# Benchmark'lar

🌐 Çeviri: [tüm diller](../../README.md)

OmniGlyph'in iddia ettiği her rakam, aşağıdaki iki harness'ten birinden
gelir — yeniden çalıştırılabilir, mümkün olduğunda deterministik,
`*/results/*.jsonl` içinde ham cevap başına kanıtlarla. Birleştirilmiş
analiz: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Tasarrufun nasıl işlediği (tek bir resimde)

Sağlayıcılar **metni token başına** faturalandırır, ama bir **görüntüyü
boyutlarına göre** faturalandırır — içine ne kadar metin sıkıştırıldığına
göre değil. Standart bir sayfa, metin ne kadar yoğun olursa olsun sabit bir
maliyettir:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Aynı bağlam, iki şekilde faturalandırılmış:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Görüntünün neden kazandığı — token başına taşınan karakter:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph bu değişimi yalnızca tam matematik kazandığını söylediğinde ve
yalnızca sayfayı okuduğu kanıtlanmış modeller için yapar. Aşağıdaki iki
harness her yarıyı ayrı ayrı kanıtlıyor.

## 1. `billing-sweep/` — bir görüntünün gerçek maliyeti nedir?

Canlı Anthropic API'sine karşı ücretsiz `count_tokens` probları, emekliye
ayrılmış `w·h/750` formülünü 2 model × 2 çözünürlük katmanında 11 prob
geometrisi genelinde güncel 28 px-parça modeliyle karşılaştırır.

**Sonuç (2026-07-05): parça modeli her probda SIFIR kalıntıyla uyuyor**
— faturalandırılan = katman yeniden boyutlandırmasından sonra
`⌈w/28⌉ × ⌈h/28⌉`, artı görüntü bloğu başına sabit +3/+4 token. Üretim
sayfası (1568×728) tam olarak 1.460 token'a mal olur ve 28.080 karakter
taşır ≈ yoğun metin olarak ~2 karakter/token'a karşı **19,2 karakter/token**.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — model onu gerçekten OKUYABİLİYOR mu?

Render yapılandırmaları, sayfa geometrileri, glif atlasları ve sağlayıcılar
genelinde maliyet (çevrimdışı, tam) × okuma doğruluğu (canlı). Korpus,
tam-string needle'ları (hex id'ler, camelCase, rakam dizileri) artı
**ölçülen glif-karıştırılabilirlik çiftlerinden inşa edilmiş yakın-ıskala
dikkat dağıtıcıları** eker — böylece sessiz uydurma, yalnızca yanlış
sayılmak yerine tespit edilir. Puanlama deterministiktir (LLM yargıç yok):
`correct` / `abstained` (dürüst `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Başlıca sonuçlar** (kol başına n=30):

| kol | tam okuma | notlar |
|---|---:|---|
| Fable 5 · standart sayfa · 1-bit atlas (üretim) | **30/30** | sıfır hata, sıfır uydurma |
| Fable 5 · standart sayfa · AA atlas (eski varsayılan) | 25/30 | 5 dürüst çekimserlik — üretimin 1-bit'e neden döndüğü |
| Fable 5 · high-res 1928² sayfa | 1–2/30 | 3,3× faturalandı ama kodlayıcı tarafından yeniden örneklendi — faturalama tuzağı, etkinleştirilmedi |
| Opus 4.8 · 10×16 glif | 23–26/30 | opt-in güvenli mod |
| GPT-5.5 · 768px şerit (her iki atlas) | 0/60 | + kendi metin kontrolüne (30/30, 62 tok) karşı ~40× çıktı-token şişmesi |
| Gemini 2.5-flash (kısmi, kota) | 0/26 | çekimser kalmak yerine uyduruyor |

Bir bakışta okuma doğruluğu — bu, çizilmiş haliyle fail-closed model
kapısının **ta kendisidir**:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Yalnızca ✅ kolu üretime çıkar. Kötü okuyan her şey *bir kanıtla birlikte*
engellenir ve üçlü puanlama, yanlış tahmin eden bir modelin (`silent_wrong`)
dürüstçe çekimser kalan bir modelden (`ILEGIVEL`) daha kötü sayılması
anlamına gelir.

Üç aktarım: doğrudan API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`) ve `--via-cli` (bir Claude Code
aboneliği — $0). Zor yoldan öğrenilen uyarı: aracılar (OpenRouter, CLI
Read aracı) büyük görüntüleri yeniden örnekler; yalnızca doğrudan-API
sonuçları okunabilirlik için yetkilidir.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Saf parçaları sabitleyen birim testleri (korpus, puanlama, maliyet
formülleri): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
