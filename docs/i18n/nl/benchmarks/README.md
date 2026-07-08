# Benchmarks

Elk cijfer dat OmniGlyph claimt, komt van een van de twee onderstaande
harnesses — opnieuw uit te voeren, waar mogelijk deterministisch, met ruwe
bewijzen per antwoord in `*/results/*.jsonl`. Geconsolideerde analyse:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — wat kost een afbeelding werkelijk?

Gratis `count_tokens`-probes tegen de live Anthropic-API, die de
uitgefaseerde `w·h/750`-formule vergelijken met het huidige 28px-patchmodel
over 11 probe-geometrieën op 2 modellen × 2 resolutietiers.

**Resultaat (2026-07-05): het patchmodel past met residu NUL bij elke
probe** — gefactureerd = `⌈w/28⌉ × ⌈h/28⌉` na resize per tier, plus een
vaste +3/+4 tokens per image-blok. De productiepagina (1568×728) kost exact
1.460 tokens en bevat 28.080 tekens ≈ **19,2 tekens/token** tegenover ~2
tekens/token als dense tekst.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # alleen voorspellingen, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, nog steeds $0 (count_tokens is gratis)
```

## 2. `density-frontier/` — kan het model het werkelijk LEZEN?

Kosten (offline, exact) × leesnauwkeurigheid (live) over renderconfiguraties,
paginageometrieën, glyf-atlassen en providers. Het corpus plant
exacte-string-needles (hex-id's, camelCase, cijferreeksen) plus **bijna-mis-
afleiders opgebouwd uit de gemeten glyf-verwarringsparen** — zodat stille
confabulatie wordt gedetecteerd, niet alleen als fout geteld. Scoring is
deterministisch (geen LLM-rechter): `correct` / `abstained` (eerlijk
`ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Hoofdresultaten** (n=30 per arm):

| arm | exacte lezingen | opmerkingen |
|---|---:|---|
| Fable 5 · standaardpagina · 1-bit atlas (productie) | **30/30** | nul fouten, nul confabulatie |
| Fable 5 · standaardpagina · AA-atlas (oude standaard) | 25/30 | 5 eerlijke onthoudingen — waarom productie omschakelde naar 1-bit |
| Fable 5 · high-res 1928²-pagina | 1–2/30 | gefactureerd 3,3× maar door de encoder geresampled — de billing-valkuil, niet ingeschakeld |
| Opus 4.8 · 10×16-glyfen | 23–26/30 | de opt-in veilige modus |
| GPT-5.5 · 768px-strip (beide atlassen) | 0/60 | + ~40× output-token-inflatie t.o.v. zijn eigen tekstcontrole (30/30, 62 tok) |
| Gemini 2.5-flash (gedeeltelijk, quotum) | 0/26 | confabuleert in plaats van zich te onthouden |

Drie transporten: directe API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), en `--via-cli` (een Claude Code-abonnement —
$0). Op de harde manier geleerde voorbehoud: tussenschakels (OpenRouter, de
Read-tool van de CLI) resamplen grote afbeeldingen; alleen resultaten via de
directe API zijn gezaghebbend voor leesbaarheid.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # kostentabel, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via abonnement, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unittests die de zuivere onderdelen vastpinnen (corpus, scoring,
kostenformules): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
