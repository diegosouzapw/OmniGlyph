# OmniGlyph — Misurazioni consolidate (2026-07-05)

Tutto ciò che è stato MISURATO in questa sessione, con fonte e n; le
ipotesi sono chiaramente separate alla fine. Riscontri:
`benchmarks/billing-sweep/results/` e `benchmarks/density-frontier/results/`
(JSONL per risposta).

## 1. Fatturazione Anthropic (count_tokens diretto, $0, 11 geometrie × 2 modelli)

Formula confermata: `tokens = ceil(w/28) × ceil(h/28)` dopo il
ridimensionamento per livello, **+3/blocco (Fable 5) / +4/blocco (Sonnet
4.5)** — residuo ZERO su tutte le righe.

| sonda | dimensioni | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| ancora doc | 1092×1092 | 1524 | 1525 |
| ancora doc | 1000×1000 | 1299 | 1300 |
| pagina standard | 1568×728 | 1459 | 1460 |
| **pagina grande** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| soglia hi-res | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res lato lungo | 2576×1204 | 3959 | 1516 |
| striscia alta | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 immagini) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NON rifiutato in count_tokens) | 3585 |

Decisioni derivate (implementate): gate esatto per patch; livello per
modello (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Accuratezza di lettura (density-frontier, needle hex/camelCase/cifre + distrattori)

### Matrice 2×2 Fable 5 — via CLI/abbonamento, n=30/braccio, stesso corpus (~16,6k caratteri)

| pagina × atlas | esatte | astensioni (ILEGIVEL) | errori silenziosi |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (previsto dalla matrice) |

→ **1-bit > AA su entrambe le pagine; zero confabulazione su 120
domande.** APPLICATO: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ la pagina high-res arriva degradata dal resample di trasporto (vedi
H1/H3) — il 67% è un pavimento, non un tetto.

### Opus 4.8 — via CLI/abbonamento, n=30/braccio

| configurazione | esatte | astensioni | errori |
|---|---:|---:|---:|
| high-res · cella 10×16 | **26/30 (87%)** | 0 | 4 (cifre) |
| standard · cella 5×8 | 0/30 | 30 | 0 |

→ Il "gomito" (knee) di Opus confermato con il nostro n (upstream ha
misurato 95% a 10×16 con n=20). La "modalità sicura Opus" è praticabile:
10×16 sulla pagina grande ≈ 1,7 caratteri per token immagine sul corpus del
banco di prova.

### Via OpenRouter (stesso corpus/domande) — inconcludente per la leggibilità

| fatto misurato | numero |
|---|---|
| content_filter su domande di trascrizione (pagine standard) | 60/60 (100%) |
| content_filter su pagine high-res | 5-6/30 (~20%) |
| Fable high-res: astensioni + errori | 20 ILEGIVEL + 5 errori (2 previsti) |
| Opus 10×16 (prima che i crediti finissero) | 7/9 esatte (78%) |
| errori di lettura previsti dalla matrice di confondibilità | 4→a, 0→8, S/s maiuscola |

### Confronto trasporti (stessa domanda, stesso contenuto)

| trasporto | filtro/rifiuto | pagina grande leggibile? |
|---|---|---|
| API diretta (n=9, prima che i crediti finissero) | 0 | non testato |
| OpenRouter | ~100% std / ~20% hi-res | no (sospetto: resample) |
| Claude Code CLI (abbonamento) | 0 content_filter; ~50% dei batch grandi bloccati (risolto con chunk da 10 + retry) | no (sospetto: Read ridimensiona) |

## 3. Costo per provider (offline, esatto — pagine COMPLETE, teorico)

| provider · pagina | token/pagina | caratteri/pagina | **caratteri/token** | stato |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (tutti i modelli) | 1460 | 28.080 | **19,2** | misurato |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× meno immagini) | fatturazione misurata; leggibilità in sospeso (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38.760 | **32,6** | documentazione verificata |
| GPT-5.4/5.5 (patch, original) fino a 1568×5984 | ~9.163 | ~233k | **25,4** | documentazione; leggibilità non testata |
| gpt-4o-mini | 48.169/strip | — | **0,8 — MAI trasformare in immagine** | documentazione (bug D2 corretto) |
| Gemini tile 1533×1152 (unità di crop nativa 768) | 1032 | 43.615 | **42,3 ← miglior valore documentato** | documentazione; leggibilità non testata |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (se leggibile)** | ipotesi H6 |

## 4. Bug trovati e corretti (audit rispetto alla documentazione ufficiale)

| id | bug | impatto | commit |
|---|---|---|---|
| D2 | gpt-4o-mini finiva nel tile predefinito 85/170 (reale: 2833/5667) | costo sottostimato ~33× — **gate invertito** | e6bc75f |
| D1 | moltiplicatore o4-mini 1,62 (reale 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) con cap 10000 (reale 1536, senza original) | si romperebbe con pagine più grandi | e6bc75f |
| D4 | gpt-5-codex-mini nel regime tile (reale: patch 1536) | ≥+23% sottostimato | e6bc75f |
| D5 | detail:'original' hardcoded per ogni modello (esiste solo da 5.4+) | fuori contratto | e6bc75f |
| #44 | stub di descrizione iniettato nei tool tipizzati → 400 + fallback silenzioso | risparmi azzerati senza segnale | 0f66e32 |
| AA | atlas AA in produzione contro il commento "solo per valutazione" | −17pp di lettura su Fable | 9a25585 |
| — | cols slab 313 (1573px) → resample 0,997× e colonna di patch extra | corretto a 312 | baseline |

## 5. Ipotesi aperte (cosa costa chiudere ognuna)

| id | ipotesi | evidenza attuale | test decisivo | costo |
|---|---|---|---|---|
| H1 | La pagina 1928² legge ≥ standard sull'API diretta (WYSIWYG dimostrato nella fatturazione) | fatturazione 4764 senza resample; 1-bit già legge al 67% anche degradato | A/B diretto std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit sull'API diretta ≈ 100% con 3,3× meno immagini | H1 + matrice 2×2 | stesso di H1 | uguale |
| H3 | Il Read della CLI e OpenRouter ridimensionano immagini >1568/2000px | 5×8 muore e 10×16 sopravvive SULLA STESSA pagina | una pagina 1928² con glifi 20×32 per trasporto | ~US$0 (CLI) |
| H4 | Il rifiuto dipende dal framing (agente-che-legge-un-file ≈ 0% vs API grezza ≈ 100%) | confronto trasporti sopra | A/B di fraseggio sul percorso proxy reale | basso |
| H5 | Gemini tile 1533×1152 leggibile a 5×8 (42 char/tok) | nessuna | density-frontier con GEMINI_API_KEY | ~gratis (piano gratuito) |
| H6 | media_resolution:low leggibile (116 char/tok) | improbabile (encoder a bassa risoluzione), ma nessuno l'ha misurato | 1 chiamata | ~gratis |
| H7 | GPT: leggibilità della striscia + inflazione dei token di completamento (rischio PageWatch) | la community ha visto −40% prompt ma +completamento/2× latenza | density-frontier con OPENAI_API_KEY | ~US$2-5 |
| H8 | La chirurgia dei glifi (H~K, 0/8, 5/3…) converte astensioni in letture | dopo 1-bit, TUTTI gli errori Fable sono diventati astensioni | modificare ~10 bitmap + rieseguire la matrice | $0 (CLI) |
| H9 | Tema chiaro (nero su bianco) > invertito | letteratura (paper Glyph, Tesseract); mai misurato su un VLM commerciale | flag di stile + 2 bracci | $0 (CLI) |
| H10 | Opus a 7×10 si colloca tra 0% (5×8) e 87% (10×16) → trade-off accettabile | curva upstream 35% a 7×10 (n=20) | 1 braccio extra | $0 (CLI) |
| H11 | Il retry-on-refusal nel proxy recupera ~50% dei batch filtrati | il rifiuto è stocastico per chiamata | implementare + misurare in produzione | codice |

## 6. Elementi operativi in sospeso

1. `gh auth login` → creare privato `diegosouzapw/omniglyph` + push (10 commit locali).
2. Crediti Anthropic (H1/H2, il verdetto sulla geometria) e OpenRouter (esauriti).
3. **Ruotare le** chiavi Anthropic e OpenRouter **esposte** nella chat.
4. Coda di codice: #45 (schema-strip draft-07), retry-on-refusal (H11),
   chirurgia dei glifi (H8), Fase 4 (TS negli script, GIF, docs, dashboard
   v2), Fase 5 (motore OmniRoute).

## ADDENDUM 2026-07-06 — A/B via API diretta (165 chiamate): H1/H2 CONFUTATE

| configurazione | esatte | astens. | rifiuto | errori |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA e 1-bit) | 0/60 | 0 | **60/60 rifiuto** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 previsti) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 previsti) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VERDETTO: il livello high-res della pagina 1928² viene FATTURATO WYSIWYG
(4764 tok, sweep) ma l'ENCODER non riceve la piena risoluzione — 1-2/30
lette, con errori di scambio del singolo glifo (6→8, a→4), la firma di un
resample interno. **Fatturazione ≠ input dell'encoder → trappola: 3,3× il
costo, leggibilità peggiore.** APPLICATO: pageGeometryForTier() ripristinato
— entrambi i livelli renderizzano 1568×728; l'infrastruttura dei livelli è
mantenuta (la fatturazione esatta resta valida e il futuro retune è 1
riga). H3 aggiornata: il "resample di trasporto" era (anche) l'encoder
stesso dell'API. Rifiuto sulla trascrizione via API grezza: 100% sulla
pagina standard (H4 rinforzata — solo il framing dell'agente sfugge). Opus
10×16 confermato su entrambi i trasporti (77-87%).

## ADDENDUM 2026-07-06 (2) — Batteria GPT-5.5 via API diretta: H7 chiusa (FALLITA)

| braccio | verbatim | gist | output/risposta |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 astens., 5 filtrati, 7 errori) | 0/3 | 2.639 tok |
| strip 5×8 1-bit | 0/30 (15 astens., 5 filtrati, 10 errori) | 1/3 | 2.383 tok |
| TESTO (controllo) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 non riesce a leggere glifi 5×8 (0/60; nemmeno il gist sopravvive) e
gonfia il completamento ~40× cercando di decifrarli (2,4-2,7k token di
ragionamento per domanda) — i risparmi sul prompt vengono divorati
dall'output. Il controllo testuale perfetto dimostra che il
corpus/domande sono sensati. Conferma e quantifica l'opt-in per 5.5;
gpt-5.6 (default) resta non testabile (l'account non ha accesso). Futuro
(H12): il gate GPT deve modellare l'inflazione dell'output, non solo i
token del prompt.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARZIALE: quota del piano gratuito esaurita a metà run)

Delle ~26 risposte immagine passate prima che la quota morisse: **0
corrette, 1 astensione, ~25 CONFABULAZIONI** — e non sono confusioni di
glifi: sono cifre casuali (`indexLedgerInd → 0040375615`), cioè l'encoder
non vede quasi nulla alle densità testate (tile nativo 42 char/tok e
MEDIUM piatto) e 2.5-flash INVENTA invece di astenersi (ignora
l'istruzione ILEGIVEL). Controllo testuale: 3/3 su quelle passate. Nessuna
inflazione dell'output (6-28 tok/risposta).

Segnale preliminare: H5/H6 propendono per NO su 2.5-flash, con una
modalità di fallimento PEGGIORE di quella di GPT (confabulazione silenziosa
invece di astensione) — Gemini richiederebbe salvaguardie extra nel
proxy. Da chiudere: rieseguire con quota a pagamento o in un altro giorno,
e testare gemini-2.5-pro (flash è il lettore più debole della famiglia). La
pagina a tile nativo ha ancora il miglior rapporto DOCUMENTATO (42,3
char/token); è la leggibilità che resta in dubbio.

Nota sui costi: le pagine parziali (l'ultima del corpus) fatturano male sotto
il regime tile (altezza ridotta → unità di crop piccola → più tile) —
riempire l'ultima pagina fino a 1152px di altezza è un'ottimizzazione
obbligatoria se Gemini viene integrato.
