# Benchmarks

OmniGlyph જે પણ સંખ્યાનો દાવો કરે છે તે નીચેના બે harnesses માંથી એકમાંથી
આવે છે — ફરીથી ચલાવી શકાય તેવા, શક્ય હોય ત્યાં ડિટરમિનિસ્ટિક, `*/results/*.jsonl`
માં કાચી પ્રતિ-જવાબ રસીદ સાથે. એકીકૃત વિશ્લેષણ: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — એક image ખરેખર કેટલો ખર્ચ કરે છે?

Live Anthropic API સામે ફ્રી `count_tokens` probes, retired `w·h/750`
formula ને current 28 px-patch model સામે 2 models × 2 resolution
tiers પર 11 probe geometries માં compare કરે છે.

**Result (2026-07-05): patch model દરેક probe પર ZERO residual સાથે fit થાય છે**
— tier resize પછી `⌈w/28⌉ × ⌈h/28⌉` બિલ થાય છે, ઉપરાંત image block દીઠ
fixed +3/+4 tokens. Production page (1568×728) બરાબર 1,460 tokens ખર્ચ
કરે છે અને 28,080 chars લઈ જાય છે ≈ ઘટ્ટ text તરીકે ~2 chars/token ની
સામે **19.2 chars/token**.

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
