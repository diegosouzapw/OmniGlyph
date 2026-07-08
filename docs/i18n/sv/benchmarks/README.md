# Benchmarks

Varje siffra OmniGlyph hävdar kommer från ett av de två ramverken nedan —
körbara igen, deterministiska där det är möjligt, med rådata per svar i
`*/results/*.jsonl`. Konsoliderad analys: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — vad kostar en bild egentligen?

Gratis `count_tokens`-prober mot det levande Anthropic-API:et, som jämför
den pensionerade `w·h/750`-formeln mot den nuvarande 28 px-patch-modellen
över 11 probgeometrier på 2 modeller × 2 upplösningsnivåer.

**Resultat (2026-07-05): patch-modellen stämmer med residual NOLL på varje
prob** — fakturerat = `⌈w/28⌉ × ⌈h/28⌉` efter nivåförminskning, plus ett
fast +3/+4 tokens per bildblock. Produktionssidan (1568×728) kostar exakt
1 460 tokens och bär 28 080 tecken ≈ **19,2 tecken/token** jämfört med
~2 tecken/token som tät text.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — kan modellen faktiskt LÄSA den?

Kostnad (offline, exakt) × läsnoggrannhet (live) över renderingskonfigurationer,
sidgeometrier, glyfatlaser och leverantörer. Korpusen planterar
exakt-sträng-nålar (hex-id:n, camelCase, sifferserier) plus
**närmiss-distraktorer byggda från de mätta glyfförväxlingsparen** — så tyst
konfabulation upptäcks, inte bara räknas som fel. Poängsättningen är
deterministisk (ingen LLM-domare): `correct` / `abstained` (ärlig
`ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Huvudresultat** (n=30 per arm):

| arm | exakta läsningar | anmärkningar |
|---|---:|---|
| Fable 5 · standardsida · 1-bitars atlas (produktion) | **30/30** | noll fel, noll konfabulation |
| Fable 5 · standardsida · AA-atlas (gammal standard) | 25/30 | 5 ärliga avstående — varför produktionen bytte till 1-bit |
| Fable 5 · high-res 1928²-sida | 1–2/30 | fakturerad 3,3× men kodar-resamplad — faktureringsfällan, inte aktiverad |
| Opus 4.8 · 10×16-glyfer | 23–26/30 | det valbara säkra läget |
| GPT-5.5 · 768px-remsa (båda atlaserna) | 0/60 | + ~40× utdata-token-inflation jämfört med sin egen textkontroll (30/30, 62 tok) |
| Gemini 2.5-flash (delvis, kvot) | 0/26 | konfabulerar i stället för att avstå |

Tre transporter: direkt API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), och `--via-cli` (en Claude Code-prenumeration
— $0). Lärdom på det hårda sättet: mellanhänder (OpenRouter, CLI:ns
Read-verktyg) resamplar stora bilder; endast direkt-API-resultat är
auktoritativa för läsbarhet.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Enhetstester som fäster de rena delarna (korpus, poängsättning,
kostnadsformler): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
