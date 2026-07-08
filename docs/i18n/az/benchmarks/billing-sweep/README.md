# Anthropic görmə-billinq sweep-i

İki açıq geometriya sualını həll edən pulsuz `count_tokens` sweep-i:

1. **Düstur** — API `ceil(w/28) × ceil(h/28)` yamaqlarını (cari sənədlər)
   hesablayır, yoxsa köhnəlmiş `w·h/750`-i? Sınaq dəsti ikisini sətir başına
   25–180 tokenlə ayırır.
2. **Səviyyə** — `claude-fable-5` yüksək-çözünürlük tavanlarını alır
   (uzun kənar ≤ 2576 px, ≤ 4784 vizual token)? `page-old-1928x1928` sətri
   qərar verir: ≈ **4761** ölçülür yüksək-çözünürlük WYSIWYG deməkdir (köhnə
   böyük səhifə bugünkü 1568×728-dən eyni simvol/token nisbətində ~3.3× daha çox
   simvol daşıyır); ≈ **1521** standart-səviyyə yenidən nümunə deməkdir, və
   1568×728 düzgün qalır.

Kontekst: cari 1568×728 səhifənin arxasındakı 2026-07-01 sweep-i
(oxunaqlılıq auditi, 2026-07-01) `claude-sonnet-4-5`-də — standart-səviyyəli
model — ölçülüb, halbuki istehsalat görmə sənədlərinin yüksək-çözünürlük
səviyyəsinə qoyduğu Fable 5-i hədəfləyir. Həmin audit həmçinin cari səhifəni
1460 tokenlə ölçüb: /750-nin 1522-sindən daha çox yamaq düsturunun 1456-sına
yaxın, API-nin artıq yamaq billinqinə keçmiş ola biləcəyini eyham edir.

## İşə salma

```bash
pnpm run build                              # dist/ ilkin şərti (bütün qiymətləndirmələr kimi)
node benchmarks/billing-sweep/run.mjs --dry-run   # yalnız proqnozlar, açar yoxdur, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

API-yə **birbaşa** dəymək lazımdır — heç vaxt OmniGlyph proksisi vasitəsilə
yox, çünki o gövdəni çevirər. `count_tokens` pulsuzdur; tam sweep ~25 sorğu edir.

## Çıxışın oxunması

Model başına, hər sınaq sətri ölçülmüş şəkil tokenlərini (şəkilli-mənfi
yalnız-mətn baza xətti) dörd proqnozun hamısına qarşı göstərir
(`patch`/`legacy750` × `standard`/`highres`); xülasə hipotezləri orta mütləq
qalıqla sıralayır. `--probe-multi` şəkil-başına tavanı yoxlayır (2×1092² ≈
2×1521); `--probe-20plus` >20-şəkil qaydasını yoxlayır (>2000 px kənarı rədd
edilməli, kiçildilməməlidir). Sətirlər `results/*.jsonl`-a düşür; proqnoz
riyaziyyatı `formulas.mjs`-də yaşayır, `tests/billing-sweep-formulas.test.ts`
ilə sabitlənir.

## Hökmdən sonra

- Yamaq düsturu təsdiqlənərsə → OmniGlyph PR #27-ni (dəqiq ölçü dəyişmə
  tərcüməsi) portlayın və `src/core/transform.ts`-də `ANTHROPIC_PIXELS_PER_TOKEN`
  qapı riyaziyyatını uyğunlaşdırın.
- Fable-də yüksək-çözünürlük səviyyəsi təsdiqlənərsə → səviyyə-üzrə səhifə
  geometriyasını (Fable/Opus 4.8/Sonnet 5 üçün 1928×1928-sinifi səhifələr,
  standart üçün 1568×728) yenidən daxil edin, GPT yolunun artıq öz
  `GPT_MAX_HEIGHT_PX`-ini necə saxladığını əks etdirərək.
