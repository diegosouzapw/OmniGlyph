# Benchmarklar

OmniGlyph-in iddia etdiyi hər rəqəm aşağıdakı iki hərnəsdən birindən gəlir —
yenidən işə salına bilər, mümkün olduqda deterministikdir, `*/results/*.jsonl`-da
xam cavab-başına qəbzlərlə. Konsolidasiya edilmiş təhlil:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — bir şəkil əslində nəyə başa gəlir?

Canlı Anthropic API-yə qarşı pulsuz `count_tokens` sınaqları, 2 model × 2
çözünürlük səviyyəsində 11 sınaq geometriyası boyunca köhnəlmiş `w·h/750` düsturunu
cari 28 px-yamaq modeli ilə müqayisə edir.

**Nəticə (2026-07-05): yamaq modeli hər sınaqda SIFIR qalıqla uyğun gəlir**
— hesablanan = səviyyə üzrə ölçü dəyişmədən sonra `⌈w/28⌉ × ⌈h/28⌉`, üstəlik hər
şəkil bloku üçün sabit +3/+4 token. İstehsalat səhifəsi (1568×728) düz 1.460 token
xərcləyir və 28.080 simvol daşıyır ≈ **19.2 simvol/token** sıx mətn üçün ~2
simvol/token ilə müqayisədə.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # yalnız proqnozlar, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # canlı sweep, hələ də $0 (count_tokens pulsuzdur)
```

## 2. `density-frontier/` — model onu həqiqətən OXUYA bilirmi?

Xərc (oflayn, dəqiq) × oxu-dəqiqliyi (canlı) render konfiqurasiyaları, səhifə
geometriyaları, qlif atlasları və provayderlər boyunca. Korpus çaşdırıcılıq
matrisinin uğursuz olacağını söylədiyi siniflərdən dəqiq-sətir iynələri (12-simvollu
hex, camelCase, rəqəm ardıcıllıqları) əkir, üstəlik ölçülmüş çaşdırıcı cütlərdən
qurulmuş **yaxın-buraxılış distraktorları** — beləliklə sükutlu uydurma müəyyən
edilir, sadəcə yanlış sayılmır. Model distraktorla cavab verərsə, çaşqınlıq
*proqnozlaşdırılmışdı* — aşkar edilən sükutlu uğursuzluq rejimi budur. Qiymətləndirmə
deterministikdir (mulberry32).

**Əsas nəticələr** (qol başına n=30):

| qol | dəqiq oxular | qeydlər |
|---|---:|---|
| Fable 5 · standart səhifə · 1-bit atlas (istehsalat) | **30/30** | sıfır xəta, sıfır uydurma |
| Fable 5 · standart səhifə · AA atlas (köhnə standart) | 25/30 | 5 dürüst imtina — nə üçün istehsalat 1-bit-ə keçdi |
| Fable 5 · yüksək-çözünürlük 1928² səhifə | 1–2/30 | 3.3× hesablanıb, amma kodlaşdırıcı-yenidən-nümunə edilib — billinq tələsi, aktiv edilməyib |
| Opus 4.8 · 10×16 qliflər | 23–26/30 | könüllü təhlükəsiz rejim |
| GPT-5.5 · 768px zolaq (hər iki atlas) | 0/60 | + öz mətn nəzarətinə (30/30, 62 tok) qarşı ~40× çıxış-tokeni şişkinliyi |
| Gemini 2.5-flash (qismən, kvota) | 0/26 | imtina etmək əvəzinə uydurur |

Üç nəqliyyat: birbaşa API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), və `--via-cli` (Claude Code abunəsi —
$0). Çətinliklə öyrənilmiş qeyd: vasitəçilər (OpenRouter, CLI Read aləti) böyük
şəkilləri yenidən nümunələyir; yalnız birbaşa-API nəticələri oxunaqlılıq üçün
etibarlıdır.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # xərc cədvəli, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # abunə vasitəsilə, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Xalis hissələri sabitləyən vahid testlər (korpus, qiymətləndirmə, xərc düsturları):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
