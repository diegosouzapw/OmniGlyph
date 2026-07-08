# density-frontier — costo × accuratezza per risoluzione

Banco di prova che misura la **frontiera di Pareto tra costo e
leggibilità** dei render testo→immagine, per provider (Anthropic / OpenAI /
Gemini), geometria di pagina, cella dei glifi, e stile dell'atlas.

L'asimmetria centrale: dallo sweep di fatturazione (2026-07-05,
`benchmarks/billing-sweep/`), **il costo è esattamente prevedibile
offline** — patch 28 px + 4/blocco su Anthropic
(`src/core/anthropic-vision.ts`), profili patch/tile su OpenAI
(`src/core/openai.ts`), tile/media_resolution su Gemini (`gemini-cost.ts`).
Solo l'**accuratezza di lettura** necessita dell'API.

## Design

- **Corpus** (`corpus.ts`): filler denso in stile log/JSON + needle
  piantate dalle classi che la matrice di confondibilità indica come
  fallimentari (hex a 12 caratteri, camelCase, cifre 6/8/5/3) +
  **distrattori near-miss** costruiti dalle coppie confondibili misurate.
  Se il modello risponde con il distrattore, la confusione era *prevista*
  — questa è la modalità di fallimento silenziosa che viene rilevata, non
  solo contata come errore. Deterministico (mulberry32).
- **Configurazioni** (`configs.ts`): griglia curata — pagine standard
  1568×728 contro high-res 1928×1928 (l'A/B che decide la geometria per
  livello), AA vs 1-bit (risolve la contraddizione del render denso),
  cella 7×10/10×16 (modalità sicura Opus), striscia GPT, e le due
  scommesse Gemini (≤384² = 258 fisso; `media_resolution: low` = 280
  fisso → ~116 caratteri/token *se* leggibile).
- **Punteggio** (`score.ts`): corrispondenza esatta deterministica, nessun
  giudice LLM. Tre esiti: `correct` / `abstained` (sentinella ILEGIVEL —
  fallimento onesto) / `silent_wrong` (la modalità pericolosa), con un
  flag distrattore.

## Esecuzione

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Configurazioni specifiche: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Le risposte finiscono in `results/*.jsonl` (una riga per domanda, con la
risposta grezza per l'audit).

## Soglia di accettazione (ereditata dalle PR upstream #35/#36)

Una configurazione diventa un default di produzione solo se: **gist ==
baseline testuale** E **zero stringhe esatte errate silenziosamente** E
**risparmio positivo**. La prima esecuzione obbligatoria è
`anthropic-std-5x8-aa` contro `anthropic-hires-5x8-aa` su Fable — il
controllo puntuale di leggibilità della pagina grande prima di abilitare
il livello high-res.

## `--via-omniroute` — e2e attraverso OmniRoute (P3: prova di non-degradazione)

I trasporti sopra renderizzano testo→PNG **nel banco di prova** e inviano
le immagini. `--via-omniroute` fa l'opposto, che è il percorso di
produzione: invia il **testo denso** a un'istanza OmniRoute in esecuzione,
lascia che il motore **`omniglyph` esegua il render** delle pagine e le
inoltri ad Anthropic, e misura le letture + i risparmi. Se le letture
restano uguali alla rotta diretta **e** OmniRoute riporta compressione, è
dimostrato che il render+inoltro di OmniRoute **non degrada** le pagine.

Prerequisiti (operativi):

1. **OmniRoute in esecuzione** (`npm run dev`, default `http://localhost:20128`).
2. Un **provider Anthropic** configurato in OmniRoute con una **chiave
   reale** (rotta diretta — il gate `providerTransport==='direct'` passa
   solo per il provider `anthropic`).
3. Il **motore `omniglyph` ABILITATO** nella configurazione di
   compressione di OmniRoute (`config.engines.omniglyph.enabled = true`)
   — l'header `engine:omniglyph` scatta solo con il motore attivo. (Il
   motore è `stable:false`/preview; abilitarlo esplicitamente.)
4. Una **chiave API OmniRoute** in `OMNIROUTE_API_KEY` (quella che il
   client usa per autenticarsi con OmniRoute, non quella Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Ogni risposta registra
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(dall'header di risposta `X-OmniRoute-Compression`) nel JSONL; la riga
della tabella mostra quante risposte sono tornate compresse + il risparmio
mediano. **Soglia P3**: stessi hit verbatim/gist della rotta diretta
(non-degradazione) **con** `omnirouteSavings` non nullo (prova che è
avvenuto un render, non una lettura di testo grezzo). Se compare `did NOT
compress`, il motore non è abilitato in OmniRoute (oppure il corpo non ha
superato i gate fail-closed).

Test per le parti pure: `tests/density-frontier.test.ts` (include
`buildOmnirouteRequest` e `parseCompressionSavings` dal trasporto
via-omniroute).
