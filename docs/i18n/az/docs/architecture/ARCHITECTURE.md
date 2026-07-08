# Arxitektura

Kodbazanın bir səhifəlik xəritəsi.

## Sorğu boru xətti

```
müştəri (Claude Code / hər hansı SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hostlar (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  tək Web-standart fetch handler:
  │                                marşrutlaşdırma, auth ötürülməsi, count_tokens
  │                                əks-faktı, istifadə/telemetriya hadisələri
  ▼
src/core/transform.ts              ƏSAS boru xətti (Anthropic yolu):
  │   1. gövdəni ayrıştır, modeldən görmə səviyyəsini müəyyən et
  │   2. sərfəlilik qapısı — dəqiq şəkil xərci vs mətn xərci
  │   3. çevir: statik slab · böyük tool_results · yığılmış tarixçə
  │   4. müştərinin cache_control anqorlarını qoruyaraq geri cala
  ▼
yuxarı axın API-si (api.anthropic.com / api.openai.com)
```

## Billinq (dəqiq, ölçülmüş)

| modul | provayder | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px yamaqlar + 4/blok, səviyyə-üzrə ölçü dəyişmə tavanları; səhifə geometriyası (hər iki səviyyə standart 1568×728 səhifəni render edir — yüksək-çözünürlük səviyyəsi billinq tələsidir, bax [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | model-üzrə yamaq/plitə rejimləri, profil-üzrə `detail`, zolaq geometriyası |
| `src/core/gemini-model-profiles.ts` | Google | plitə düsturu (`floor(min/1.5)` kəsim vahidi) + `media_resolution` sabit xərclər |

## Render

- `src/core/render.ts` — mətn → PNG bişmiş qlif atlası vasitəsilə (Spleen 5×8 +
  Unifont ehtiyat), `↵` yeni sətir sentinelləri ilə yenidən düzülüş, istehsalatda
  1-bit atlas (Fable-də AA-dan daha yaxşı ölçülüb).
- `src/core/render-cache.ts` — deterministik render-lərin LRU yaddaşlaşdırılması
  (əks halda statik slab + dondurulmuş tarixçə parçaları hər sorğuda yenidən render
  olunur).
- `src/core/history.ts` — köhnə növbələri əlavə-edilə-bilən dondurulmuş şəkil
  parçalarına yığır, bunlar bayt-eyni qalır ki, prompt keşi işə davam etsin.
- `src/core/png.ts` — minimal deterministik PNG kodlaşdırıcı (doğma asılılıq yoxdur).

## Qoruyucu relslər

- Model icazə siyahısı (`src/core/applicability.ts`): yalnız oxu benchmarkını keçmiş
  modellər şəkilləşdirilir; digər hər şey bayt-eyni keçir.
- Bayt-dəqiq dəyərlər (SHA-lar, id-lər) şəklin yanında faktlar vərəqəsində mətn kimi
  gedir (`src/core/factsheet.ts`); `emitRecoverable` vasitəsilə bərpa edilə bilən
  orijinallar.
- Doğma tiplənmiş alətlər (`type !== 'custom'`) heç vaxt yenidən yazılmır (400
  qoruyucusu).

## Benchmarklar və qəbzlər

`benchmarks/` README-dəki hər rəqəmi yaradan iki hərnəsi saxlayır — bax
[benchmarks/README.md](../../benchmarks/README.md).
