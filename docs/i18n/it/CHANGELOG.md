# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versionamento semantico.

## [1.0.0] — 2026-07-07

Prima release pubblica.

### Il prodotto

- **Proxy di compressione contesto-come-immagine**: riscrive le parti voluminose
  di ogni richiesta LLM (system prompt, documentazione dei tool, cronologia
  vecchia, output voluminosi dei tool) in pagine PNG dense a 1-bit prima che
  lascino la tua macchina. Server Node locale e host Cloudflare Workers.
- **Matematica di fatturazione esatta per provider** (`src/core/`): patch
  Anthropic a 28px + overhead di 3–4 token/blocco (sweep proprietario, residuo
  zero), formule OpenAI e Gemini verificate rispetto alla documentazione
  ufficiale. Esportate alla radice del pacchetto (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, limiti dei livelli).
- **Configurazione di render di produzione misurata**: atlas di glifi 1-bit
  denso (senza anti-aliasing), pagine a livello standard — ogni scelta
  supportata da un riscontro da benchmark in `benchmarks/*/results/`.
- **Banchi di prova per benchmark** (`benchmarks/`): billing-sweep (conteggio
  token) e density-frontier (frontiera dell'accuratezza di lettura tra
  modelli/densità), rieseguibili via API, OpenRouter, Claude Code CLI, o
  tramite OmniRoute (`--via-omniroute`).
- **Retry sul rifiuto**: uno sniffer SSE/JSON riproduce la richiesta originale
  quando un modello rifiuta la pagina renderizzata (interruttore di emergenza
  `retryRefusalWithOriginal`).
- **Cache di render LRU** per pagine deterministiche.
- **Motore OmniRoute**: distribuito come motore di compressione `omniglyph` in
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (modalità singola e
  pipeline impilata), con gate fail-closed e conteggio dei token consapevole
  delle immagini.

### I numeri (tutti riproducibili)

- Render di esempio UI: 1015 caratteri → PNG 438×120, da 254 a 84 token
  (**66,9% risparmiato**).
- Pagina standard 1568×728 = 1456 token immagine indipendentemente da quanto
  testo contiene.
- Claude legge pagine dense a 1-bit al 100% alla densità di produzione; Opus
  4.8 legge al 77–87% a 10×16.

### Decisioni negative (misurate, non opinioni)

- **Il livello ad alta risoluzione è una trappola di fatturazione**: la
  pagina 1928² viene fatturata WYSIWYG ma l'encoder non riceve la piena
  risoluzione — entrambi i livelli renderizzano pagine standard.
- **GPT-5.5 respinto**: 0/60 letture della striscia densa e ~40× di
  inflazione del completamento rispetto al controllo testuale.
- **gpt-4o-mini mai trasformato in immagine** (la soglia di 2833/5667 token
  lo rende non redditizio).
- **Gemini 2.5-flash confabula** invece di astenersi su pagine dense
  (0/26) — nuovo test in sospeso con quota a pagamento.
