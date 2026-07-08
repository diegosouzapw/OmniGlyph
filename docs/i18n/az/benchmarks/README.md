# Benchmarklar

🌐 Tərcümə: [bütün dillər](../../README.md)

OmniGlyph-in iddia etdiyi hər rəqəm aşağıdakı iki hərnəsdən birindən gəlir —
yenidən işə salına bilər, mümkün olduqda deterministikdir, `*/results/*.jsonl`-da
xam cavab-başına qəbzlərlə. Konsolidasiya edilmiş təhlil:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Qənaət necə işləyir (bir şəkildə)

Provayderlər **mətni token üzrə**, amma **şəkli onun ölçüləri üzrə** hesablayır —
içində nə qədər mətn sıxılmış olmasından asılı olmayaraq. Bir standart səhifə,
içində nə qədər mətn olmasından asılı olmayaraq, sabit xərcdir:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Eyni kontekst, iki üsulla hesablanıb:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Şəkil niyə qazanır — token başına daşınan simvol sayı:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph bu dəyişikliyi yalnız dəqiq riyaziyyat onun qazandığını göstərəndə,
və yalnız səhifəni oxuduğu sübut edilmiş modellər üçün edir. Aşağıdakı iki
hərnəs hər yarısını sübut edir.

## 1. `billing-sweep/` — bir şəkil əslində nəyə başa gəlir?

Canlı Anthropic API-yə qarşı pulsuz `count_tokens` sınaqları, 2 model × 2
çözünürlük səviyyəsində 11 sınaq geometriyası boyunca köhnəlmiş `w·h/750` düsturunu
cari 28 px-yamaq modeli ilə müqayisə edir.

**Nəticə (2026-07-05): yamaq modeli hər sınaqda SIFIR qalıqla uyğun gəlir**
— hesablanan = səviyyə üzrə ölçü dəyişmədən sonra `⌈w/28⌉ × ⌈h/28⌉`, üstəlik hər
şəkil bloku üçün sabit +3/+4 token. İstehsalat səhifəsi (1568×728) düz 1.460 token
xərcləyir və 28.080 simvol daşıyır ≈ **19.2 simvol/token** sıx mətn üçün ~2
simvol/token ilə müqayisədə.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # yalnız proqnozlar, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # canlı sweep, hələ də $0 (count_tokens pulsuzdur)
```

## 2. `density-frontier/` — model onu həqiqətən OXUYA bilirmi?

Xərc (oflayn, dəqiq) × oxu-dəqiqliyi (canlı) render konfiqurasiyaları, səhifə
geometriyaları, qlif atlasları və provayderlər boyunca. Korpus dəqiq-sətir
iynələri (hex id-lər, camelCase, rəqəm ardıcıllıqları) əkir, üstəlik ölçülmüş
qlif-çaşdırıcılıq cütlərindən qurulmuş **yaxın-buraxılış distraktorları** —
beləliklə sükutlu uydurma müəyyən edilir, sadəcə yanlış sayılmır. Qiymətləndirmə
deterministikdir (LLM hakim yoxdur): `correct` / `abstained` (dürüst `ILEGIVEL`)
/ `silent_wrong` / `no_answer`.

**Əsas nəticələr** (qol başına n=30):

| qol | dəqiq oxular | qeydlər |
|---|---:|---|
| Fable 5 · standart səhifə · 1-bit atlas (istehsalat) | **30/30** | sıfır xəta, sıfır uydurma |
| Fable 5 · standart səhifə · AA atlas (köhnə standart) | 25/30 | 5 dürüst imtina — nə üçün istehsalat 1-bit-ə keçdi |
| Fable 5 · yüksək-çözünürlük 1928² səhifə | 1–2/30 | 3.3× hesablanıb, amma kodlaşdırıcı-yenidən-nümunə edilib — billinq tələsi, aktiv edilməyib |
| Opus 4.8 · 10×16 qliflər | 23–26/30 | könüllü təhlükəsiz rejim |
| GPT-5.5 · 768px zolaq (hər iki atlas) | 0/60 | + öz mətn nəzarətinə (30/30, 62 tok) qarşı ~40× çıxış-tokeni şişkinliyi |
| Gemini 2.5-flash (qismən, kvota) | 0/26 | imtina etmək əvəzinə uydurur |

Oxu dəqiqliyi bir baxışda — bu **elə** fail-closed model qapısıdır, çəkilmiş:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Yalnız ✅ qolu istehsalata çıxır. Zəif oxuyan hər şey *qəbzlə* bloklanır, və
üç-tərəfli hesab sisteminə görə yanlış təxmin edən model (`silent_wrong`)
dürüst imtina edən modeldən (`ILEGIVEL`) daha pis sayılır.

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
