# Benchmarks

🌐 અનુવાદિત: [બધી ભાષાઓ](../../README.md)

OmniGlyph જે પણ સંખ્યાનો દાવો કરે છે તે નીચેના બે harnesses માંથી એકમાંથી
આવે છે — ફરીથી ચલાવી શકાય તેવા, શક્ય હોય ત્યાં ડિટરમિનિસ્ટિક, `*/results/*.jsonl`
માં કાચી પ્રતિ-જવાબ રસીદ સાથે. એકીકૃત વિશ્લેષણ: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## બચત કેવી રીતે કામ કરે છે (એક ચિત્રમાં)

Providers **text** ને token દીઠ બિલ કરે છે, પણ **image** ને તેના dimensions
દ્વારા બિલ કરે છે — તેની અંદર કેટલું text ભરેલું છે તેના આધારે નહીં. એક
standard page નો ખર્ચ flat હોય છે, ભલે text ગમે તેટલું ઘટ્ટ હોય:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

એ જ context, બે રીતે બિલ થયેલો:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Image કેમ જીતે છે — token દીઠ carried characters:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph આ swap ત્યારે જ કરે છે જ્યારે exact math કહે કે તે જીતે છે, અને
ફક્ત એ models માટે જે page વાંચવા માટે સાબિત થયેલા છે. નીચેના બે harnesses
દરેક અડધા ભાગને સાબિત કરે છે.

## 1. `billing-sweep/` — એક image ખરેખર કેટલો ખર્ચ કરે છે?

Live Anthropic API સામે ફ્રી `count_tokens` probes, retired `w·h/750`
formula ને current 28 px-patch model સામે 2 models × 2 resolution
tiers પર 11 probe geometries માં compare કરે છે.

**Result (2026-07-05): patch model દરેક probe પર ZERO residual સાથે fit થાય છે**
— tier resize પછી `⌈w/28⌉ × ⌈h/28⌉` બિલ થાય છે, ઉપરાંત image block દીઠ
fixed +3/+4 tokens. Production page (1568×728) બરાબર 1,460 tokens ખર્ચ
કરે છે અને 28,080 chars લઈ જાય છે ≈ ઘટ્ટ text તરીકે ~2 chars/token ની
સામે **19.2 chars/token**.

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

## 2. `density-frontier/` — શું મોડેલ ખરેખર તેને READ કરી શકે છે?

Render configs, page geometries, glyph atlases અને providers પર Cost
(offline, exact) × read-accuracy (live). Corpus confusability matrix
કહે છે તે classes માંથી exact-string needles (hex ids, camelCase,
digit runs) ઉપરાંત **measured glyph-confusability pairs માંથી બનેલા
near-miss distractors** plant કરે છે — જેથી silent confabulation
detect થાય, ફક્ત ખોટું ગણાય નહીં. Scoring ડિટરમિનિસ્ટિક છે (કોઈ
LLM-judge નહીં): `correct` / `abstained` (honest `ILEGIVEL`) /
`silent_wrong` / `no_answer`.

**મુખ્ય પરિણામો** (n=30 પ્રતિ arm):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — શા માટે production 1-bit પર flip થયું |
| Fable 5 · high-res 1928² page | 1–2/30 | 3.3× billed પણ encoder-resampled — billing trap, enabled નથી |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + તેના own text control (30/30, 62 tok) ની સામે ~40× output-token inflation |
| Gemini 2.5-flash (partial, quota) | 0/26 | abstain કરવાને બદલે confabulates |

એક નજરમાં read accuracy — આ **જ** fail-closed model gate છે, દોરેલું:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

ફક્ત ✅ arm ship થાય છે. જે કંઈ ખરાબ રીતે વાંચે છે તે *રસીદ સાથે* blocked
થાય છે, અને three-way score નો અર્થ છે કે ખોટું અનુમાન કરતું model
(`silent_wrong`) ને honestly abstain કરતા model (`ILEGIVEL`) કરતાં ખરાબ
ગણવામાં આવે છે.

ત્રણ transports: direct API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), અને `--via-cli` (Claude Code
subscription — $0). Hard way શીખેલી caveat: intermediaries (OpenRouter,
CLI Read tool) મોટા images ને resample કરે છે; ફક્ત direct-API results
legibility માટે authoritative છે.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Pure parts pin કરતા Unit tests (corpus, scoring, cost formulas):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
