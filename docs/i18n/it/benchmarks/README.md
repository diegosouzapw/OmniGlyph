# Benchmarks

Ogni numero rivendicato da OmniGlyph proviene da uno dei due banchi di prova
qui sotto — rieseguibili, deterministici dove possibile, con riscontri grezzi
per ogni risposta in `*/results/*.jsonl`. Analisi consolidata:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — quanto costa davvero un'immagine?

Sonde gratuite `count_tokens` contro l'API Anthropic live, che confrontano
la formula ritirata `w·h/750` con l'attuale modello a patch di 28 px su 11
geometrie di sonda su 2 modelli × 2 livelli di risoluzione.

**Risultato (2026-07-05): il modello a patch coincide con residuo ZERO su
ogni sonda** — fatturato = `⌈w/28⌉ × ⌈h/28⌉` dopo il ridimensionamento per
livello, più un fisso di +3/+4 token per blocco immagine. La pagina di
produzione (1568×728) costa esattamente 1.460 token e trasporta 28.080
caratteri ≈ **19,2 caratteri/token** contro ~2 caratteri/token come testo
denso.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — il modello riesce davvero a LEGGERLO?

Costo (offline, esatto) × accuratezza di lettura (live) attraverso
configurazioni di render, geometrie di pagina, atlas di glifi e provider.
Il corpus pianta needle stringa-esatta (id hex, camelCase, sequenze di
cifre) più **distrattori near-miss costruiti dalle coppie di
confondibilità dei glifi misurate** — così la confabulazione silenziosa
viene rilevata, non solo contata come errore. La valutazione è
deterministica (nessun giudice LLM): `correct` / `abstained` (`ILEGIVEL`
onesto) / `silent_wrong` / `no_answer`.

**Risultati principali** (n=30 per braccio):

| braccio | letture esatte | note |
|---|---:|---|
| Fable 5 · pagina standard · atlas 1-bit (produzione) | **30/30** | zero errori, zero confabulazione |
| Fable 5 · pagina standard · atlas AA (vecchio default) | 25/30 | 5 astensioni oneste — perché la produzione è passata a 1-bit |
| Fable 5 · pagina high-res 1928² | 1–2/30 | fatturata 3,3× in più ma resamplata dall'encoder — la trappola di fatturazione, non abilitata |
| Opus 4.8 · glifi 10×16 | 23–26/30 | la modalità sicura opt-in |
| GPT-5.5 · striscia 768px (entrambi gli atlas) | 0/60 | + ~40× inflazione dei token di output rispetto al proprio controllo testuale (30/30, 62 tok) |
| Gemini 2.5-flash (parziale, quota) | 0/26 | confabula invece di astenersi |

Tre trasporti: API diretta (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), e `--via-cli` (un abbonamento Claude
Code — $0). Attenzione imparata a caro prezzo: gli intermediari
(OpenRouter, il tool Read della CLI) ridimensionano le immagini grandi;
solo i risultati dell'API diretta sono autorevoli per la leggibilità.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Test unitari che fissano le parti pure (corpus, valutazione, formule di
costo): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
