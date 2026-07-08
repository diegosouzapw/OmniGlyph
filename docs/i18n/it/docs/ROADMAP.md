# Roadmap del fork — "il nostro OmniGlyph" + integrazione OmniRoute

Piano di lavoro consolidato (2026-07-05) da: billing sweep misurato, audit
OpenAI/Gemini rispetto alla documentazione ufficiale, analisi di tool
correlati, e il banco di prova density-frontier. Stato di ogni voce: ☐ in
sospeso · ◐ parziale · ☑ completato qui.

## Fase 0 — Fondamenta di misurazione (COMPLETATO in questo repo)

- ☑ Fatturazione Anthropic esatta (patch 28px, 2 livelli, +4/blocco) — `src/core/anthropic-vision.ts`, sweep in `benchmarks/billing-sweep/`.
- ☑ Gate di redditività con costo esatto (ha sostituito w·h/750 × 1,10).
- ☑ Geometria per livello: Fable/Opus 4.8/Sonnet 5 → pagine 1928×1928 (3,3× meno immagini); standard → 1568×728. 691 test verdi.
- ☑ Banco di prova `benchmarks/density-frontier/` (costo × accuratezza offline via API, needle con distrattori confondibili, valutazione deterministica).

## Fase 1 — Fix di fatturazione multi-provider (bug confermati nell'audit)

Priorità stabilita dall'audit (documentazione ufficiale acquisita il
2026-07-05):

1. ☐ **D2 (gate INVERTITO)**: `gpt-4o-mini` finisce nel tile predefinito 85/170, ma costa **2833 base / 5667 per tile** (~33× sottostimato, ~0,8 char/token) — trasformarlo in immagine è sempre una perdita e il gate lo approva. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` viene inviato incondizionatamente (`src/core/openai.ts:392,402`), ma esiste solo da gpt-5.4+; derivarlo dal profilo.
3. ☐ **D1**: moltiplicatore `o4-mini` 1,62 → **1,72** (sottostima del 5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` sono nel bucket patch con **cap 1536 senza `original`** (il codice assume 10000); `gpt-5-codex-mini` è nel regime sbagliato (tile → patch).
5. ☐ **Geometria GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (si allinea con ENTRAMBI i regimi: patch 64×32 e tile 4×512; +6,25% caratteri gratuiti). Profilo dedicato 5.4/5.5 `original`: fino a 1568×5984 (9.163 patch ≤ 10k, ~233k caratteri in un blocco) — prima leggibilità A/B.
6. ☐ **Supporto Gemini** (nuovo): `src/core/gemini.ts` + `gemini-model-profiles.ts` + route `:generateContent`/`:streamGenerateContent` nel proxy. Geometria documentabile: **1152×1536 (unità di crop esatta 768, 4 tile, 42,2 char/token — miglior rapporto documentato dei 3 provider)**; scommesse da calibrare: 768² con `media_resolution:MEDIUM` (56,4) e Gemini 3 HIGH. Attenzione: l'endpoint compatibile OpenAI di Gemini passerebbe attraverso il trasformatore OpenAI con fatturazione errata.

## Fase 2 — Qualità di lettura (banco di prova density-frontier come giudice)

- ◐ A/B decisivo std vs high-res su Fable (in corso; soglia: gist == testo E zero errori silenziosi E risparmio > 0).
- ☐ Risolvere la contraddizione AA vs 1-bit nel percorso denso (il codice dice "solo per valutazione", la produzione usa AA).
- ☐ (RINVIATO con motivazione 2026-07-06) Chirurgia dei glifi: la configurazione di produzione legge 30/30 — non c'è oggi un errore misurabile che la chirurgia possa risolvere. Da rivedere se un obiettivo sub-100% entra nello scope (es. Opus) o se nuove misurazioni mostrano una regressione.
- ☑ ~~A/B tema chiaro~~ RISOLTO per ispezione (2026-07-06): il render È GIÀ nero su bianco (render.ts:635/822, inversione post-blit) — allineato con la letteratura; l'ipotesi era nata da una premessa sbagliata (immagine di esempio upstream).
- ☐ Wordlist con checksum per ID byte-esatti (upstream #38, approvato) + banner di astensione (#31/#32) + camelCase nel factsheet (#33/#34).
- ☑ Port #45: $schema/$id preservati, tuple rimosse per ogni elemento (commit su main).
- ☑ Retry-on-refusal (#37/H11): sniffer di replay lossless + singolo retry con il corpo originale; telemetria refusalRetried (commit su main).
- ☐ Tool di rehydrate (`RecoverableBlock` → tool richiamabile; LensVLM valida l'espansione selettiva).

## Fase 3 — Prestazioni/robustezza

- ☐ Cache di render LRU (deterministica per invariante; slab + chunk congelati oggi si ri-renderizzano a ogni richiesta).
- ☐ Encoding PNG in un worker thread; livello di deflate configurabile.
- ☐ Port dei fix upstream aperti: #44 (tool nativi tipizzati → 400), #45 (schema-strip draft-07 → loop 400), #42 (proxy CONNECT per Claude Desktop), #19 (descrizioni GPT con doppia fatturazione).
- ☐ Implementare ADAPTIVE_CPT_PLAN (cpt per ruolo del blocco; slab reale = 1,50).

## Fase 4 — Il fork stesso

- ☐ Nome/repo proprio (decisione di Diego) + `git remote` upstream per i cherry-pick.
- ☐ **TS ovunque**: il core è già TS, convertire `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (pattern: tsx + vitest; `benchmarks/density-frontier/` è nato così).
- ☐ Standard di qualità OmniRoute: eslint 9 + prettier, CI con typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR prima), CHANGELOG semantico.
- ☐ **GIF invece di video** nel README (registrare con vhs/asciinema+agg; confronto affiancato plain vs proxy).
- ☐ Dashboard v2 (reimplementare via API HTTP — non ereditare codice di terze parti): launcher "apri terminale con ANTHROPIC_BASE_URL", check "il traffico passa attraverso di me?", ispettore immagine-vs-testo, sessioni, pannello costi in valuta, i18n leggero, SSE invece di polling, persistenza SQLite con retention (il suo schema a 24 colonne è un buon punto di partenza).
- ☐ Micro-idee da dense-image-gen: modalità `lines` (layout preservato per codice/tabelle), `--keep-ws`, titolo di origine per pagina ("system prompt" / "tool docs" / "history turn N"), CLI standalone `render arquivo.md -o out.png`.

## Fase 5 — Port su OmniRoute

- ☐ Motore `CompressionEngine` (template `cavemanAdapter.ts`), registrato in `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Cablaggio: passare `supportsVision` in `chatCore.ts:1297` (1 riga) o risolvere via `isVisionModelId`.
- ☐ Ordine dello stack: ultimo (RTK/Caveman/renderer semantici prima; OmniGlyph trasforma in immagine il residuo).
- ☐ Invarianti: mai riscrivere blocchi con `cache_control` del client (lezione #4560); il gate di fedeltà (#5127) necessita di un'esenzione dichiarata o un factsheet testuale che soddisfi gli invarianti; telemetria dei tentativi con `skip_reason` (lezione #4268).
- ☐ Routing: il fallback/retry post-motore deve rispettare la capacità di visione e l'allowlist (ricomprimere o bypassare).
- ☐ Sinergia CCR: `emitRecoverable` → store CCR con recupero per porzione (`head/tail/grep`, #5187) = espansione selettiva completa.
- ☐ Estensione del piano gratuito come funzionalità di marketing: ogni token del piano gratuito produce ~2-3× più caratteri sui modelli con visione; piano gratuito Gemini + geometria 1152×1536 è il caso più forte.

## Rischi aperti

- Rifiuti di Fable dopo il redeploy in contesto trasformato in immagine (upstream #37) — mitigare prima dell'attivazione predefinita in OmniRoute.
- Arbitraggio di prezzo: se Anthropic riprezza la visione, i risparmi cambiano — il controfattuale per richiesta (`count_tokens`) è la difesa.
- OpenAI: una misurazione della community (PageWatch) ha visto salire i token di completamento e 2× la latenza — misurare per provider prima di abilitare.

## Risultati A/B 2026-07-05 (via OpenRouter — INCONCLUSIVO per la geometria, valido per le modalità di fallimento)

| configurazione | verbatim | astens. | filtrato | errore-silenzioso |
|---|---|---|---|---|
| fable std 5×8 (AA e 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 previsti) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 previsti) |
| opus hires 10×16 | **7/9 lette** | 0 | 21 crediti esauriti | 2 (cifra) |

Risultati validi: (1) il classificatore (issue #37) è la modalità di
fallimento DOMINANTE per le domande di trascrizione sulla pagina standard —
100% filtrato — e non scatta sulla pagina grande; il fraseggio conta. (2)
L'astensione funziona: 20× ILEGIVEL contro 5 confabulazioni sulla pagina
grande. (3) Opus a 10×16 legge il 78% esatto (n=9) contro 0% storico a 5×8
— prima evidenza diretta del "gomito" (knee). (4) L'illeggibilità della
pagina grande via OpenRouter suggerisce un RESAMPLE di trasporto
(Bedrock/Vertex livello standard?) — ipotesi decisiva da testare sull'API
diretta di Anthropic; il verdetto sulla geometria A/B resta APERTO fino ad
allora. I crediti OpenRouter sono terminati a metà del braccio Opus.

## Matrice 2×2 finale (2026-07-05, via CLI/abbonamento, Fable 5, n=30/braccio)

| pagina × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 astens. |
| high-res 1928×1928 | **20/30 (67%)** + 10 astens. | 0/30 + 29 astens. |

Zero confabulazioni sui 4 bracci (120 domande — ogni errore era ILEGIVEL).
APPLICATO: DENSE_RENDER_STYLE cambiato a 1-bit (aa:false) con un pin in
tests/dense-style.test.ts. Opus 4.8: 26/30 a 10×16 sulla pagina grande,
30/30 ILEGIVEL a 5×8 — la modalità sicura Opus è praticabile. La pagina ad
alta risoluzione resta degradata dai trasporti (resample della CLI
Read/OpenRouter) — il verdetto sulla geometria WYSIWYG dipende ancora
dall'API diretta.
