# density-frontier — cost × precizie per rezoluție

Harness care măsoară **frontiera Pareto dintre cost și lizibilitate** a
render-urilor text→imagine, per furnizor (Anthropic / OpenAI / Gemini),
geometrie de pagină, celulă de glif și stil de atlas.

Asimetria centrală: de la sweep-ul de facturare (2026-07-05,
`benchmarks/billing-sweep/`), **costul este exact predictibil offline** —
patch-uri de 28 px + 4/bloc pe Anthropic (`src/core/anthropic-vision.ts`),
profiluri patch/tile pe OpenAI (`src/core/openai.ts`), tile-uri/media_resolution
pe Gemini (`gemini-cost.ts`). Doar **precizia de citire** are nevoie de API.

## Design

- **Corpus** (`corpus.ts`): filler dens stil log/JSON + needle-uri plantate
  din clasele pe care matricea de confuzabilitate le indică drept eșuate
  (hex de 12 caractere, camelCase, cifre 6/8/5/3) + **distractori near-miss**
  construiți din perechile confuzabile măsurate. Dacă modelul răspunde cu
  distractorul, confuzia a fost *prezisă* — acesta este modul de eșec
  silențios care este detectat, nu doar numărat. Determinist (mulberry32).
- **Configurații** (`configs.ts`): grilă curată — pagini standard 1568×728
  vs rezoluție înaltă 1928×1928 (A/B-ul care decide geometria per nivel), AA
  vs 1-bit (rezolvă contradicția de randare densă), celulă 7×10/10×16 (mod
  sigur Opus), bandă GPT, și cele două pariuri Gemini (≤384² = 258 flat;
  `media_resolution: low` = 280 fix → ~116 caractere/token *dacă* este lizibil).
- **Scor** (`score.ts`): potrivire exactă deterministă, fără LLM-judge. Trei
  rezultate: `correct` / `abstained` (sentinelă `ILEGIVEL` — eșec onest) /
  `silent_wrong` (modul periculos), cu un flag de distractor.

## Rulare

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # tabel de cost, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needle-uri+3 gist × config × probă
```

Configurații specifice: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Răspunsurile aterizează în `results/*.jsonl` (o linie per întrebare, cu
răspunsul brut pentru audit).

## Bara de acceptare (moștenită de la PR-urile upstream #35/#36)

O configurație devine default de producție doar dacă: **gist == baseline de
text** ȘI **zero erori exacte de string silențioase** ȘI **economii
pozitive**. Prima rulare obligatorie este `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` pe Fable — verificarea rapidă de lizibilitate a
paginii mari înainte de a activa nivelul de rezoluție înaltă.

## `--via-omniroute` — e2e prin OmniRoute (P3: dovadă de non-degradare)

Transporturile de mai sus randează text→PNG **în harness** și trimit
imaginile. `--via-omniroute` face opusul, care este calea de producție:
trimite **textul dens** către o instanță OmniRoute care rulează, lasă
**motorul `omniglyph`** să randeze paginile și să le trimită mai departe
către Anthropic, și măsoară citirile + economiile. Dacă citirile rămân
aceleași ca ruta directă **și** OmniRoute raportează compresie, este
demonstrat că randarea+forwarding-ul OmniRoute **nu degradează** paginile.

Prerechizite (operaționale):

1. **OmniRoute rulând** (`npm run dev`, implicit `http://localhost:20128`).
2. Un **furnizor Anthropic** configurat în OmniRoute cu o **cheie reală**
   (rută directă — gate-ul `providerTransport==='direct'` trece doar pentru
   furnizorul `anthropic`).
3. **Motorul `omniglyph` ACTIVAT** în configurația de compresie a OmniRoute
   (`config.engines.omniglyph.enabled = true`) — header-ul `engine:omniglyph`
   apare doar cu motorul pornit. (Motorul este `stable:false`/preview;
   activați-l explicit.)
4. O **cheie API OmniRoute** în `OMNIROUTE_API_KEY` (cea pe care clientul o
   folosește pentru a se autentifica față de OmniRoute, nu cea Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<cheia-dumneavoastra-omniroute> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Fiecare răspuns înregistrează `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(din header-ul de răspuns `X-OmniRoute-Compression`) în JSONL; rândul
tabelului arată câte răspunsuri au revenit comprimate + economia mediană.
**Bara P3**: aceleași hit-uri verbatim/gist ca ruta directă (non-degradare)
**cu** `omnirouteSavings` ne-null (dovedind că a avut loc o randare, nu o
citire de text brut). Dacă apare `did NOT compress`, motorul nu este
activat în OmniRoute (sau body-ul nu a trecut de gate-urile fail-closed).

Teste pentru părțile pure: `tests/density-frontier.test.ts` (include
`buildOmnirouteRequest` și `parseCompressionSavings` din transportul
via-omniroute).
