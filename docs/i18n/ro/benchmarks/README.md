# Benchmarks

Fiecare cifră pe care OmniGlyph o afirmă provine dintr-unul din cele două
harness-uri de mai jos — re-executabile, deterministe unde este posibil, cu
dovezi brute per răspuns în `*/results/*.jsonl`. Analiză consolidată:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — cât costă de fapt o imagine?

Sonde gratuite `count_tokens` față de API-ul Anthropic live, comparând
formula retrasă `w·h/750` cu modelul curent de patch de 28 px pe 11
geometrii de sondă, pe 2 modele × 2 niveluri de rezoluție.

**Rezultat (2026-07-05): modelul de patch se potrivește cu reziduu ZERO pe
fiecare sondă** — facturat = `⌈w/28⌉ × ⌈h/28⌉` după resize-ul de nivel, plus
un fix de +3/+4 tokeni per bloc de imagine. Pagina de producție (1568×728)
costă exact 1,460 tokeni și conține 28,080 caractere ≈ **19.2 caractere/token**
față de ~2 caractere/token ca text dens.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # doar predicții, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # sweep live, tot $0 (count_tokens este gratuit)
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
| Fable 5 · pagină standard · atlas AA (vechi default) | 25/30 | 5 abțineri oneste — de ce producția a trecut la 1-bit |
| Fable 5 · pagină rezoluție înaltă 1928² | 1–2/30 | facturat 3.3× dar re-eșantionat de encoder — capcana de facturare, neactivat |
| Opus 4.8 · glife 10×16 | 23–26/30 | modul sigur opțional |
| GPT-5.5 · bandă 768px (ambele atlas-uri) | 0/60 | + ~40× inflație de tokeni de ieșire față de propriul control text (30/30, 62 tok) |
| Gemini 2.5-flash (parțial, cotă) | 0/26 | confabulează în loc să se abțină |

Trei transporturi: API direct (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), și `--via-cli` (un abonament Claude Code —
$0). Avertisment învățat pe pielea noastră: intermediarii (OpenRouter,
unealta Read a CLI-ului) re-eșantionează imaginile mari; doar rezultatele
API-ului direct sunt autoritare pentru lizibilitate.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # tabel de cost, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via abonament, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Teste unitare care fixează părțile pure (corpus, punctaj, formule de cost):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
