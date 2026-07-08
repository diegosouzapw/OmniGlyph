# Anthropic görüntü-faturalama sweep'i

🌐 Çeviri: [tüm diller](../../../README.md)

**Neden var:** kârlılık kapısı yalnızca maliyet tahmini *tam* olduğunda
güvenlidir. Az bile olsa yanlış bir formül, aslında daha pahalıya mal olan
blokları dönüştürebilir. Bu yüzden bu sweep, formülü üretime çıkmadan önce
API'nin gerçek rakamlarına sabitler — **sıfır kalıntıya** kadar.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

İki açık geometri sorusuna karar veren ücretsiz `count_tokens` sweep'i:

1. **Formül** — API, `ceil(w/28) × ceil(h/28)` parça (güncel dokümanlar) mı
   yoksa emekliye ayrılmış `w·h/750` mi faturalandırıyor? Prob seti, ikisini
   satır başına 25–180 token ile ayırır.
2. **Katman** — `claude-fable-5`, yüksek çözünürlük sınırlarını (uzun kenar
   ≤ 2576 px, ≤ 4784 görsel token) alıyor mu? `page-old-1928x1928` satırı
   belirleyicidir: ≈ **4761** ölçülen, yüksek çözünürlüklü WYSIWYG anlamına
   gelir (eski büyük sayfa, günümüzün 1568×728'inden aynı karakter/token
   oranında ~3,3× daha fazla karakter tutar); ≈ **1521** standart-katman
   yeniden örneklemesi anlamına gelir ve 1568×728 doğru kalır.

Bağlam: mevcut 1568×728 sayfanın arkasındaki 2026-07-01 sweep'i
(okunabilirlik denetimi, 2026-07-01), standart-katman bir model olan
`claude-sonnet-4-5` üzerinde ölçüldü — üretim ise vizyon dokümanlarının
yüksek-çözünürlük katmanına yerleştirdiği Fable 5'i hedefliyor. Bu denetim
ayrıca güncel sayfayı 1460 token olarak ölçtü: /750'nin 1522'sinden çok
parça formülünün 1456'sına daha yakın, bu da API'nin zaten parça
faturalamasına geçmiş olabileceğini ima ediyor.

## Çalıştırma

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

**Doğrudan** API'yi vurmalı — asla gövdeyi dönüştürecek olan OmniGlyph
proxy'si üzerinden değil. `count_tokens` ücretsizdir; tam sweep ~25 istek
yapar.

## Çıktıyı okuma

Model başına, her prob satırı ölçülen görüntü token'larını (görüntülü eksi
yalnızca-metin taban çizgisi) dört tahminin (`patch`/`legacy750` ×
`standard`/`highres`) tümüne karşı gösterir; özet, hipotezleri ortalama
mutlak kalıntıya göre sıralar. `--probe-multi`, görüntü başına sınırı
kontrol eder (2×1092² ≈ 2×1521); `--probe-20plus`, >20-görüntü kuralını
kontrol eder (>2000 px kenarlı bir görüntü yeniden boyutlandırılmak
yerine reddedilmelidir). Satırlar `results/*.jsonl`'a düşer; tahmin
matematiği `formulas.mjs`'de yaşar, `tests/billing-sweep-formulas.test.ts`
ile sabitlenir.

## Karardan sonra

- Parça formülü onaylandı → OmniGlyph PR #27'yi (tam yeniden boyutlandırma
  çevirisi) taşı ve `ANTHROPIC_PIXELS_PER_TOKEN` kapı matematiğini
  `src/core/transform.ts`'de hizala.
- Fable'da yüksek çözünürlük katmanı onaylandı → katman başına bir sayfa
  geometrisi yeniden tanıt (Fable/Opus 4.8/Sonnet 5 için 1928×1928 sınıfı
  sayfalar, standart için 1568×728), GPT yolunun kendi `GPT_MAX_HEIGHT_PX`'ini
  zaten nasıl koruduğunu yansıtarak.
