# Benchmarks

Hvert tal, OmniGlyph påstår, kommer fra et af de to rammeværker nedenfor —
kan genkøres, deterministisk hvor muligt, med rå per-svar-dokumentation i
`*/results/*.jsonl`. Konsolideret analyse: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — hvad koster et billede egentlig?

Gratis `count_tokens`-prober mod det levende Anthropic-API, der sammenligner den
udgåede `w·h/750`-formel med den nuværende 28 px-patch-model på tværs af 11 probe-
geometrier på 2 modeller × 2 opløsningstiers.

**Resultat (2026-07-05): patch-modellen passer med resterende afvigelse NUL på hver probe**
— afregnet = `⌈w/28⌉ × ⌈h/28⌉` efter tier-resize, plus et fast +3/+4 tokens per
billedblok. Produktionssiden (1568×728) koster nøjagtigt 1.460 tokens og
rummer 28.080 tegn ≈ **19,2 tegn/token** mod ~2 tegn/token som tæt tekst.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — kan modellen rent faktisk LÆSE det?

Omkostning (offline, præcis) × læsenøjagtighed (live) på tværs af rendering-
konfigurationer, sidegeometrier, glyf-atlasser og udbydere. Korpuset planter eksakt-
streng-needles (hex-id'er, camelCase, cifferrækker) plus **near-miss-distraktorer
bygget fra de målte forvekslelighedspar** — så stille konfabulation
detekteres, ikke bare tælles som forkert. Scoring er deterministisk (ingen LLM-
dommer): `correct` / `abstained` (ærligt `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Hovedresultater** (n=30 per arm):

| arm | nøjagtige læsninger | noter |
|---|---:|---|
| Fable 5 · standardside · 1-bit-atlas (produktion) | **30/30** | nul fejl, nul konfabulation |
| Fable 5 · standardside · AA-atlas (gammel standard) | 25/30 | 5 ærlige afståelser — hvorfor produktionen skiftede til 1-bit |
| Fable 5 · hi-res 1928²-side | 1–2/30 | afregnet 3,3× men encoder-resamplet — afregningsfælden, ikke aktiveret |
| Opus 4.8 · 10×16-glyffer | 23–26/30 | den valgfri sikre tilstand |
| GPT-5.5 · 768px-strimmel (begge atlasser) | 0/60 | + ~40× output-token-opblæsning mod dens egen tekstkontrol (30/30, 62 tok) |
| Gemini 2.5-flash (delvis, kvote) | 0/26 | konfabulerer i stedet for at afstå |

Tre transporter: direkte API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`) og `--via-cli` (et Claude Code-abonnement —
$0). Forbehold lært på den hårde måde: mellemled (OpenRouter, CLI'ens Read-
værktøj) resampler store billeder; kun direkte-API-resultater er autoritative for
læsbarhed.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unit-tests, der fastlåser de rene dele (korpus, scoring, omkostningsformler):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
