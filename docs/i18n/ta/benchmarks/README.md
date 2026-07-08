# Benchmarks

OmniGlyph கூறும் ஒவ்வொரு எண்ணும் கீழே உள்ள இரண்டு harnessesஇல் ஒன்றிலிருந்து
வருகிறது — மறுஇயக்கக்கூடியது, முடிந்தவரை deterministic, `*/results/*.jsonl`இல்
raw per-answer ஆதாரங்களுடன். ஒருங்கிணைந்த பகுப்பாய்வு:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — ஒரு image உண்மையில் எவ்வளவு செலவாகும்?

இலவச `count_tokens` probes, live Anthropic APIக்கு எதிராக, retired ஆன
`w·h/750` formulaவை தற்போதைய 28 px-patch modelஉடன் ஒப்பிடுகிறது, 2 மாடல்கள் ×
2 resolution tiersஇல் 11 probe geometriesஇல்.

**Result (2026-07-05): patch model ஒவ்வொரு probeஇலும் ZERO residualஉடன் பொருந்துகிறது**
— tier resizeக்குப் பின் `⌈w/28⌉ × ⌈h/28⌉`ஆக பில் செய்யப்படுகிறது, மேலும் ஒரு
image blockக்கு fixed +3/+4 tokens. Production page (1568×728) சரியாக
1,460 tokens செலவாகிறது மற்றும் 28,080 chars எடுத்துச் செல்கிறது ≈ **19.2 chars/token**
அடர்த்தியான உரையாக ~2 chars/tokenக்கு எதிராக.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — மாடல் அதை உண்மையில் READ செய்ய முடியுமா?

Render configs, page geometries, glyph atlases மற்றும் providers முழுவதும்
Cost (offline, exact) × read-accuracy (live). Corpus dense log/JSON-style
fillerஐயும் confusability matrix தோல்வியடையும் என்று கூறும் classesலிருந்து
planted needlesஐயும் (12-char hex, camelCase, digits 6/8/5/3) + measured
confusable pairsலிருந்து உருவாக்கப்பட்ட **near-miss distractors**ஐயும் plant
செய்கிறது — எனவே silent confabulation detect செய்யப்படுகிறது, வெறுமனே தவறு
என்று கணக்கிடப்படவில்லை. Scoring deterministic (LLM judge இல்லை):
`correct` / `abstained` (honest `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**முதன்மை முடிவுகள்** (n=30 ஒரு armக்கு):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | பூஜ்ஜிய errors, பூஜ்ஜிய confabulation |
| Fable 5 · standard page · AA atlas (பழைய default) | 25/30 | 5 honest abstentions — production 1-bitக்கு flip ஆனது ஏன் |
| Fable 5 · high-res 1928² page | 1–2/30 | 3.3× பில் செய்யப்பட்டது ஆனால் encoder-resampled — billing trap, enable செய்யப்படவில்லை |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | opt-in safe mode |
| GPT-5.5 · 768px strip (இரண்டு atlasesஉம்) | 0/60 | + அதன் சொந்த text controlக்கு எதிராக ~40× output-token inflation (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | தவிர்ப்பதற்குப் பதிலாக confabulate செய்கிறது |

மூன்று transports: direct API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), மற்றும் `--via-cli` (ஒரு Claude Code subscription —
$0). கடினமான வழியில் கற்ற caveat: intermediaries (OpenRouter, CLI Read tool)
பெரிய imagesஐ resample செய்கின்றன; legibilityக்கு direct-API results மட்டுமே
authoritative.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Pure partsஐ pin செய்யும் Unit tests (corpus, scoring, cost formulas):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
