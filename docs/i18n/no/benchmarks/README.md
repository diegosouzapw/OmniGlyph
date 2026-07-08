# Benchmarks

🌐 Oversatt: [alle språk](../../README.md)

Hvert tall OmniGlyph hevder kommer fra en av de to riggene under —
kjørbare på nytt, deterministiske der det er mulig, med rå per-svar-
kvitteringer i `*/results/*.jsonl`. Konsolidert analyse:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Slik fungerer besparelsene (i ett bilde)

Leverandører fakturerer **tekst per token**, men fakturerer et **bilde etter
dimensjonene** — ikke etter hvor mye tekst som er pakket inn i det. Én
standardside er en flat kostnad uansett hvor tett teksten er:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Den samme konteksten, fakturert på to måter:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Hvorfor bildet vinner — tegn båret per token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph gjør kun dette byttet når den eksakte matematikken sier det vinner,
og kun for modeller som er bevist å lese siden. De to riggene under beviser
hver sin halvdel.

## 1. `billing-sweep/` — hva koster et bilde egentlig?

Gratis `count_tokens`-prober mot det direkte Anthropic-API-et, som
sammenligner den pensjonerte `w·h/750`-formelen mot den nåværende 28
px-patch-modellen på tvers av 11 probegeometrier på 2 modeller × 2
oppløsningsnivåer.

**Resultat (2026-07-05): patch-modellen passer med NULL avvik på hver
probe** — fakturert = `⌈w/28⌉ × ⌈h/28⌉` etter nivåendring av størrelse,
pluss en fast +3/+4 tokens per bildeblokk. Produksjonssiden (1568×728)
koster nøyaktig 1,460 tokens og bærer 28,080 tegn ≈ **19.2 tegn/token** mot
~2 tegn/token som tett tekst.

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

## 2. `density-frontier/` — kan modellen faktisk LESE det?

Kostnad (offline, eksakt) × lesenøyaktighet (live) på tvers av
rendringskonfigurasjoner, sidegeometrier, glyffatlas og leverandører.
Korpuset planter eksakt-streng-needles (heks-ID-er, camelCase, sifferrekker)
pluss **nesten-treff-distraktorer bygget fra de målte
glyffforvekslingsparene** — slik at stille konfabulasjon oppdages, ikke
bare telles som feil. Scoring er deterministisk (ingen LLM-dommer):
`correct` / `abstained` (ærlig `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Hovedresultater** (n=30 per arm):

| arm | eksakte lesninger | notater |
|---|---:|---|
| Fable 5 · standardside · 1-bit-atlas (produksjon) | **30/30** | null feil, null konfabulasjon |
| Fable 5 · standardside · AA-atlas (gammel standard) | 25/30 | 5 ærlige avstandelser — hvorfor produksjon byttet til 1-bit |
| Fable 5 · høyoppløsning 1928²-side | 1–2/30 | fakturert 3.3× men modell-resamplet — faktureringsfellen, ikke aktivert |
| Opus 4.8 · 10×16-glyffer | 23–26/30 | opt-in sikker modus |
| GPT-5.5 · 768px-stripe (begge atlas) | 0/60 | + ~40× utdata-tokenoppblåsing mot sin egen tekstkontroll (30/30, 62 tok) |
| Gemini 2.5-flash (delvis, kvote) | 0/26 | konfabulerer i stedet for å avstå |

Lesenøyaktighet ved et blikk — dette **er** den fail-closed modellporten,
tegnet ut:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Bare ✅-armen går i produksjon. Alt som leser dårlig, blir blokkert *med en
kvittering*, og den tredelte scoringen betyr at en modell som gjetter feil
(`silent_wrong`), behandles som verre enn én som ærlig avstår (`ILEGIVEL`).

Tre transporter: direkte API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), og `--via-cli` (et Claude Code-abonnement
— $0). Lærdom fra erfaring: mellomledd (OpenRouter, CLI-ens Read-verktøy)
resampler store bilder; kun direkte-API-resultater er autoritative for
lesbarhet.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Enhetstester som fester de rene delene (korpus, scoring,
kostnadsformler): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
