# Benchmarks

🌐 Vertaald: [alle talen](../../README.md)

Elk cijfer dat OmniGlyph claimt, komt van een van de twee onderstaande
harnesses — opnieuw uit te voeren, waar mogelijk deterministisch, met ruwe
bewijzen per antwoord in `*/results/*.jsonl`. Geconsolideerde analyse:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Hoe de besparing werkt (in één plaatje)

Providers factureren **tekst per token**, maar factureren een **afbeelding
op basis van de afmetingen** — niet op basis van hoeveel tekst erin gepakt
zit. Eén standaardpagina heeft een vaste kostprijs, ongeacht hoe dicht de
tekst is:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Dezelfde context, op twee manieren gefactureerd:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Waarom de afbeelding wint — tekens gedragen per token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph maakt deze ruil alleen wanneer de exacte wiskunde zegt dat het
wint, en alleen voor modellen waarvan is bewezen dat ze de pagina kunnen
lezen. De twee harnesses hieronder bewijzen elke helft.

## 1. `billing-sweep/` — wat kost een afbeelding werkelijk?

Gratis `count_tokens`-probes tegen de live Anthropic-API, die de
uitgefaseerde `w·h/750`-formule vergelijken met het huidige 28px-patchmodel
over 11 probe-geometrieën op 2 modellen × 2 resolutietiers.

**Resultaat (2026-07-05): het patchmodel past met residu NUL bij elke
probe** — gefactureerd = `⌈w/28⌉ × ⌈h/28⌉` na resize per tier, plus een
vaste +3/+4 tokens per image-blok. De productiepagina (1568×728) kost
exact 1,460 tokens en bevat 28,080 tekens ≈ **19.2 chars/token** tegenover
~2 chars/token als dense tekst.

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
| Fable 5 · high-res 1928²-pagina | 1–2/30 | gefactureerd 3.3× maar door de encoder geresampled — de billing-valkuil, niet ingeschakeld |
| Opus 4.8 · 10×16-glyfen | 23–26/30 | de opt-in veilige modus |
| GPT-5.5 · 768px-strip (beide atlassen) | 0/60 | + ~40× output-token-inflatie t.o.v. zijn eigen tekstcontrole (30/30, 62 tok) |
| Gemini 2.5-flash (gedeeltelijk, quotum) | 0/26 | confabuleert in plaats van zich te onthouden |

Leesnauwkeurigheid in één oogopslag — dit **is** de fail-closed model-poort,
getekend:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Alleen de ✅-arm gaat naar productie. Alles dat slecht leest, wordt geblokkeerd
*met een bewijs*, en de drieledige score betekent dat een model dat verkeerd
gokt (`silent_wrong`) als erger wordt behandeld dan een model dat eerlijk
onthoudt (`ILEGIVEL`).

Drie transporten: directe API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), en `--via-cli` (een Claude Code-abonnement —
$0). Op de harde manier geleerde voorbehoud: tussenschakels (OpenRouter, de
Read-tool van de CLI) resamplen grote afbeeldingen; alleen resultaten via de
directe API zijn gezaghebbend voor leesbaarheid.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unittests die de zuivere onderdelen vastpinnen (corpus, scoring,
kostenformules): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
