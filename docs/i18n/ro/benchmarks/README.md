# Benchmarks

🌐 Tradus: [toate limbile](../../README.md)

Fiecare cifră pe care OmniGlyph o afirmă provine dintr-unul din cele două
harness-uri de mai jos — re-executabile, deterministe unde este posibil, cu
dovezi brute per răspuns în `*/results/*.jsonl`. Analiză consolidată:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Cum funcționează economiile (într-o imagine)

Furnizorii facturează **textul pe token**, dar facturează o **imagine după
dimensiunile ei** — nu după câtă text este înghesuit înăuntru. O pagină
standard are un cost fix, indiferent cât de dens este textul:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Același context, facturat în două moduri:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

De ce câștigă imaginea — caractere transportate per token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph face această schimbare doar atunci când matematica exactă arată
că este avantajoasă, și doar pentru modelele dovedite că pot citi pagina.
Cele două harness-uri de mai jos demonstrează fiecare jumătate.

## 1. `billing-sweep/` — cât costă de fapt o imagine?

Sonde gratuite `count_tokens` față de API-ul Anthropic live, comparând
formula retrasă `w·h/750` cu modelul curent de patch de 28 px pe 11
geometrii de sondă, pe 2 modele × 2 niveluri de rezoluție.

**Rezultat (2026-07-05): modelul de patch se potrivește cu reziduu ZERO pe
fiecare sondă** — facturat = `⌈w/28⌉ × ⌈h/28⌉` după resize-ul de nivel, plus
un fix de +3/+4 tokeni per bloc de imagine. Pagina de producție (1568×728)
costă exact 1,460 tokeni și conține 28,080 caractere ≈ **19.2 caractere/token**
față de ~2 caractere/token ca text dens.

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

## 2. `density-frontier/` — modelul poate de fapt să o CITEASCĂ?

Cost (offline, exact) × precizie de citire (live) pe configurații de randare,
geometrii de pagină, atlas-uri de glife și furnizori. Corpusul plantează
needle-uri exacte de string (id-uri hex, camelCase, șiruri de cifre) plus
**distractori near-miss construiți din perechile de confuzabilitate de glife
măsurate** — astfel încât confabulația silențioasă este detectată, nu doar
numărată ca greșeală. Punctajul este determinist (fără LLM-judge):
`correct` / `abstained` (`ILEGIVEL` onest) / `silent_wrong` / `no_answer`.

**Rezultate principale** (n=30 per braț):

| braț | citiri exacte | note |
|---|---:|---|
| Fable 5 · pagină standard · atlas 1-bit (producție) | **30/30** | zero erori, zero confabulație |
| Fable 5 · pagină standard · atlas AA (implicit vechi) | 25/30 | 5 abțineri oneste — de ce producția a trecut la 1-bit |
| Fable 5 · pagină rezoluție înaltă 1928² | 1–2/30 | facturat 3.3× dar re-eșantionat de encoder — capcana de facturare, neactivat |
| Opus 4.8 · glife 10×16 | 23–26/30 | modul sigur opțional |
| GPT-5.5 · bandă 768px (ambele atlas-uri) | 0/60 | + ~40× inflație de tokeni de ieșire față de propriul control text (30/30, 62 tok) |
| Gemini 2.5-flash (parțial, cotă) | 0/26 | confabulează în loc să se abțină |

Precizia de citire dintr-o privire — acesta **este** gate-ul de model
fail-closed, desenat:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Doar brațul ✅ ajunge în producție. Tot ce citește slab este blocat *cu o
dovadă*, iar scorul pe trei căi înseamnă că un model care ghicește greșit
(`silent_wrong`) este tratat mai rău decât unul care se abține onest
(`ILEGIVEL`).

Trei transporturi: API direct (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), și `--via-cli` (un abonament Claude Code —
$0). Avertisment învățat pe pielea noastră: intermediarii (OpenRouter,
unealta Read a CLI-ului) re-eșantionează imaginile mari; doar rezultatele
API-ului direct sunt autoritare pentru lizibilitate.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Teste unitare care fixează părțile pure (corpus, punctaj, formule de cost):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
