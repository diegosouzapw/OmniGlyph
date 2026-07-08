🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Il contesto come immagine

### Riduci il tuo conto Claude del **59–70%** rendendo il contesto voluminoso come pagine PNG dense — lo stesso contenuto, con una frazione dei token.

**I modelli fatturano il testo per token, ma fatturano un'immagine in base alle sue dimensioni — non in base a quanto testo contiene.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Parte della famiglia [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)

</div>

---

# 📊 The numbers — measured, not estimated

| metrica | risultato | riscontro |
|---|---|---|
| Riduzione del conto end-to-end | **59–70%** | trace di produzione, 13.709 richieste |
| Token per blocco convertito | **10× in meno** (28.080 caratteri: 14.040 → 1.460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Accuratezza della formula di fatturazione | residuo **zero** su 22 sonde `count_tokens`, 2 modelli × 2 livelli | `benchmarks/billing-sweep/results/` |
| Accuratezza di lettura esatta, configurazione di produzione | **30/30 (100%)** su Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Confabulazioni silenziose in ~300 prove di lettura | **0** — ogni lettura mancata si astiene con `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Scheda di valutazione del modello** (riesce a leggere render densi? n=30 per braccio, valutazione deterministica):

| modello | lettura | verdetto |
|---|---|---|
| Claude **Fable 5** | **100%** esatto | ✅ obiettivo di produzione |
| Claude Opus 4.8 | 77–87% con glifi 4× più grandi | ⚠️ modalità sicura opt-in (risparmio scende a ~2×) |
| GPT-5.5 | 0/60 — e gonfia le sue risposte ~40× tentando | ❌ bloccato dal gate, con prova |
| Gemini 2.5-flash | 0/26 — e confabula invece di astenersi | ❌ bloccato (test parziale, limitato da quota) |

Il vantaggio è **oggi specifico per Fable** — altri encoder di visione non risolvono ancora glifi densi. Il [banco di prova per benchmark](benchmarks/README.md) ritesta qualsiasi nuovo modello con un solo comando.

# 🤔 Perché OmniGlyph?

Ogni sessione di agente di lunga durata trascina lo stesso peso morto a ogni richiesta: il system prompt, la documentazione dei tool e la cronologia vecchia — rifatturati per token, a ogni turno. OmniGlyph è un **proxy locale** che riscrive quelle parti voluminose in pagine PNG dense *prima che lascino la tua macchina*:

- **Matematica di fatturazione esatta, non euristiche** — calcola la formula reale del provider per i token immagine (misurata a residuo zero) e converte solo quando i conti tornano a favore.
- **Fail-closed by design** — i modelli che non riescono a leggere render densi vengono bloccati da un gate, con riscontri da benchmark. Nessuna perdita di qualità silenziosa.
- **Privato e local-first** — la riscrittura avviene su `127.0.0.1`; non viene inviato nient'altro altrove.
- **Riproducibile** — ogni numero sopra ha un riscontro in `benchmarks/*/results/`, rieseguibile con un comando.

# ⚡ Avvio rapido

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Funziona in entrambi i modi:
- **Chiave API** (pagamento per token): il tuo conto scende del 59–70% end-to-end.
- **Sessione in abbonamento**: non paghi di meno, ma i limiti di utilizzo sono conteggiati in token — quindi i tuoi limiti si estendono di **~2–3×**.

Dashboard su <http://127.0.0.1:47821/>: token risparmiati, ogni conversione testo→immagine affiancata, interruttore di emergenza, chip dei modelli in tempo reale. Le risposte vengono trasmesse in streaming normalmente — solo la *richiesta* viene compressa, mai l'output del modello.

# ⚙️ Come funziona

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **La fatturazione viene calcolata esattamente, prima della conversione**: Anthropic fattura `⌈w/28⌉ × ⌈h/28⌉ + 4` token per immagine (patch da 28 px — misurato a residuo zero). Una pagina completa trasporta 28.080 caratteri per 1.460 token ≈ **19 caratteri/token**, contro ~2 caratteri/token per testo denso. Il gate converte solo quando i conti tornano a favore.
- **Cosa viene convertito**: il system prompt statico + la documentazione dei tool, la cronologia collassata vecchia, gli output voluminosi dei tool.
- **Cosa non viene mai convertito**: i tuoi messaggi, i turni recenti, l'output del modello, il testo sparso, i valori byte-esatti (hash/ID viaggiano come testo accanto), e qualsiasi modello che ha fallito il benchmark di lettura.

# 🧭 The honest part

- **È lossy.** Il recupero byte-esatto dalle immagini è per natura inaffidabile. Mitigazioni implementate: gli identificatori esatti viaggiano come testo accanto all'immagine, e la configurazione di produzione misurata ha prodotto **zero confabulazioni silenziose** — le letture fallite si astengono.
- **Solo Fable 5 è approvato oggi**, con riscontri. GPT-5.5 e Gemini 2.5-flash misurabilmente non riescono a leggere render densi; Opus 4.8 necessita di glifi 4× più grandi. Il gate lo impone.
- **Abbiamo trovato ed evitato una trappola di fatturazione**: il livello immagine ad alta risoluzione fattura 3,3× in più per pagina, ma l'encoder di visione non riceve la risoluzione aggiuntiva — le pagine più grandi si leggono *peggio*. Misurato, documentato in [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), non abilitato.
- I prezzi cambiano; la metrica duratura è il taglio di token, che il proxy registra per ogni richiesta rispetto a un controfattuale gratuito con `count_tokens`.

# 🔬 Riproduci ogni numero

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Metodologia completa e ogni tabella di risultati: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Riscontri grezzi per ogni risposta: `benchmarks/*/results/*.jsonl`.

# 🚀 La famiglia OmniRoute

OmniGlyph viene distribuito anche come **motore di compressione nativo all'interno di [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — il gateway AI gratuito. Lì funziona come motore `omniglyph` (modalità singola autonoma o impilato con gli altri motori), con gate fail-closed e conteggio dei token consapevole delle immagini.

# 🛠️ Stack tecnologico

| livello | tecnologia |
|---|---|
| Linguaggio | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | atlas di glifi 1-bit proprietario (derivato da Spleen/Unifont, licenze in `assets/`) → PNG |
| Test | Vitest — TDD, più docs-integrity e rebrand guard |
| Benchmark | banchi di prova `benchmarks/` (billing-sweep, density-frontier) con riscontri JSONL |

## Struttura del progetto

| percorso | cosa |
|---|---|
| `src/` | il proxy: pipeline di trasformazione, fatturazione esatta per provider, renderer, host (Node + Cloudflare Workers) |
| `benchmarks/` | i banchi di prova che hanno prodotto ogni numero sopra — rieseguibili |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Supporto e community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bug e richieste di funzionalità
- 🔒 [SECURITY.md](SECURITY.md) — segnalazioni di vulnerabilità
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD rigoroso + misurazione prima delle affermazioni
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licenza

MIT — vedi [LICENSE](../../../LICENSE).
