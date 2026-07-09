🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Un render real: system prompt + docs de unelte comprimate într-o singură pagină densă de 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — Context ca imagine

### Reduceți factura Claude cu **59–70%** randând contextul voluminos ca pagini PNG dense — același conținut, într-o fracțiune din tokeni.

**Modelele facturează textul pe token, dar facturează o imagine în funcție de dimensiunile ei — nu în funcție de câtă text conține.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-cifrele--msurate-nu-estimate)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-partea-onest)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Parte a familiei [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Toate limbile](../README.md)

</div>

---

# 📊 Cifrele — măsurate, nu estimate

| metrică | rezultat | dovadă |
|---|---|---|
| Reducere de factură de la un capăt la altul | **59–70%** | trace de producție, 13,709 requesturi |
| Tokeni per bloc convertit | **10× mai puțini** (28,080 caractere: 14,040 → 1,460 tokeni) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Precizia formulei de facturare | reziduu **zero** pe 22 de sonde `count_tokens`, 2 modele × 2 nivele | `benchmarks/billing-sweep/results/` |
| Precizie de citire exactă, config de producție | **30/30 (100%)** pe Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Confabulații silențioase în ~300 sonde de citire | **0** — fiecare ratare se abține ca `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Clasamentul modelelor** (poate citi render-uri dense? n=30 per braț, punctaj determinist):

| model | citire | verdict |
|---|---|---|
| Claude **Fable 5** | **100%** exact | ✅ țintă de producție |
| Claude Opus 4.8 | 77–87% la glife de 4× mai mari | ⚠️ mod sigur opțional (economiile scad la ~2×) |
| GPT-5.5 | 0/60 — și își umflă răspunsurile ~40× încercând | ❌ blocat de gate, cu dovezi |
| Gemini 2.5-flash | 0/26 — și confabulează în loc să se abțină | ❌ blocat (test parțial, limitat de cotă) |

Avantajul este **specific Fable astăzi** — alți encoderi de viziune nu rezolvă încă glife dense. [Harness-ul de benchmark](benchmarks/README.md) retestează orice model nou într-o singură comandă.

# 🤔 De ce OmniGlyph?

Fiecare sesiune lungă de agent târăște aceeași greutate moartă la fiecare request: system prompt-ul, docs de unelte și istoricul vechi — refacturate per token, la fiecare tură. OmniGlyph este un **proxy local** care rescrie acele părți voluminoase în pagini PNG dense *înainte să părăsească mașina dumneavoastră*:

- **Matematică de facturare exactă, nu euristică** — calculează formula reală de tokeni-imagine a furnizorului (măsurată la reziduu zero) și convertește doar când matematica câștigă.
- **Fail-closed prin design** — modelele care nu pot citi render-uri dense sunt blocate de un gate, cu dovezi din benchmark. Fără pierdere silențioasă de calitate.
- **Privat și local-first** — rescrierea are loc pe `127.0.0.1`; nimic în plus nu este trimis nicăieri.
- **Reproductibil** — fiecare cifră de mai sus are o dovadă în `benchmarks/*/results/`, re-executabilă într-o singură comandă.

# ⚡ Start rapid

```bash
npx omniglyph                                     # proxy pe 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # direcționați Claude Code către el
```

![Start rapid: porniți proxy-ul, verificați dashboard-ul, direcționați Claude Code către el](../../../docs/assets/demo-quickstart.gif)

Funcționează în ambele moduri:
- **Cheie API** (plată per token): factura dumneavoastră scade cu 59–70% de la un capăt la altul.
- **Sesiune de abonament**: nu plătiți mai puțin, dar limitele de utilizare sunt numărate în tokeni — deci limitele dumneavoastră se întind **~2–3×**.

Dashboard la <http://127.0.0.1:47821/>: tokeni economisiți, fiecare conversie text→imagine alăturată, kill switch, chip-uri de model live. Răspunsurile fac streaming normal — doar *request-ul* este comprimat, niciodată ieșirea modelului.

# 🔌 Utilizare cu clienți Claude

Start the proxy in one terminal, then point the client at it.

**Claude Code CLI (macOS/Linux):**

```bash
npx omniglyph
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude
```

**Claude Code CLI (Windows PowerShell):**

```powershell
npx omniglyph
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:47821"
claude
```

**Claude Desktop** uses the same `ANTHROPIC_BASE_URL` environment variable for its bundled Claude Code runtime — start `omniglyph` first, then launch Claude Desktop from an environment where `ANTHROPIC_BASE_URL` is set to `http://127.0.0.1:47821`.

# 🖥️ Dashboard-ul

Un dashboard local complet vine inclus în pachet — offline, fișier unic, zero cereri externe. Șase pagini, actualizate live prin SSE pe măsură ce cererile curg:

![Prezentare generală: carduri KPI de tip mission-control, sparkline de economii și flux de evenimente live](../../assets/dashboard-overview.png)

- **Prezentare generală** — mission control: % economisit, $ economisiți, latență p95, cache hits, erori, flux live.
- **Live Flow** — pipeline-ul ca graf de noduri: client → gate → renderer / passthrough → API, cu o particulă per cerere reală.
- **Telemetrie** — un odometru token/$ și o cronologie live a cererilor; faceți clic pe orice cerere pentru a vedea exact ce părți au devenit imagini și pentru a citi textul sursă din spatele fiecărei pagini.
- **Benchmarks** — chitanțele harness-ului randate din `benchmarks/*/results/`, un rând per experiment model·configurație, și **rulați benchmark-urile direct din UI**: dry-run-urile de `$0` fac streaming la rezultate live; rulările live rămân condiționate de cheia dumneavoastră API plus o confirmare explicită a costului.
- **Sesiuni / Istoric** — sesiunile de top după tokeni economisiți și fiecare eveniment de pe disc.

| Live Flow | Benchmarks |
|---|---|
| ![Pipeline-ul de cereri ca graf de noduri live](../../assets/dashboard-flow.png) | ![Chitanțe de benchmark și dry-run-uri în UI](../../assets/dashboard-benchmarks.png) |

![Telemetrie: odometru și cronologie live a cererilor](../../assets/dashboard-telemetry.png)

# ⚙️ Cum funcționează

```
bloc de request voluminos ──► gate de profitabilitate ──► reflow + render (atlas 1-bit 5×8)
                       (matematică de facturare exactă)     ──► pagini PNG 1568×728 ──► reintroduse, prietenoase cu cache-ul
```

- **Facturarea este calculată exact, înainte de conversie**: Anthropic facturează `⌈w/28⌉ × ⌈h/28⌉ + 4` tokeni per imagine (patch-uri de 28 px — măsurat la reziduu zero). O pagină plină conține 28,080 caractere pentru 1,460 tokeni ≈ **19 caractere/token**, față de ~2 caractere/token pentru text dens. Gate-ul convertește doar când matematica câștigă.
- **Ce se convertește**: system prompt-ul static + docs de unelte, istoricul vechi colapsat, ieșirile mari de unelte.
- **Ce nu se convertește niciodată**: mesajele dumneavoastră, turele recente, ieșirea modelului, proza rară, valorile exacte pe bit (hash-uri/ID-uri călătoresc alături ca text), și orice model care a eșuat la benchmark-ul de citire.

# 📚 Utilizare ca bibliotecă (fără proxy)

Tot ce face proxy-ul per request este de asemenea un API documentat, importabil:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Randați orice text în pagini PNG dense de 1-bit
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Sau rulați singur transformarea completă a request-ului — gate, matematică de facturare, tot
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // corpul JSON brut /v1/messages
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` fixează blocuri ca text; `options.emitRecoverable` returnează originalele blocurilor transformate în imagine. Matematica exactă de facturare este livrată și la rădăcina pachetului (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — asta este ce consumă [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Runtime Pure-JS (Node și edge/Workers). Suprafață completă: `src/core/index.ts`.

# 📤 Export offline — fără proxy, fără Claude Code

Nu folosiți Claude Code? Randați contextul în pagini PNG **local** și lipiți-le în Cursor, ChatGPT sau orice chat care acceptă încărcări de imagini. Fără proxy, fără cheie API, fără cont conectat:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Obțineți un singur folder cu tot ce vă trebuie pentru a-l pune în chat:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` randează diff-ul necomis, `--diff <ref>` un interval de commit-uri, `--open` dezvăluie folderul (macOS). Totul rulează pe mașina dumneavoastră — calea de export nu pornește niciodată proxy-ul și nu apelează niciodată un model. Rulați `omniglyph export --help` pentru fiecare flag.

# 🧭 Partea onestă

- **Este lossy.** Recall-ul byte-exact din imagini este nesigur prin natura sa. Atenuări deja implementate: identificatorii exacți călătoresc ca text lângă imagine, iar config-ul de producție măsurat a produs **zero confabulații silențioase** — citirile eșuate se abțin.
- **Doar Fable 5 este aprobat astăzi**, cu dovezi. GPT-5.5 și Gemini 2.5-flash măsurabil nu pot citi render-uri dense; Opus 4.8 are nevoie de glife 4× mai mari. Gate-ul impune acest lucru.
- **Am găsit și am evitat o capcană de facturare**: nivelul de imagine de înaltă rezoluție facturează de 3.3× mai mult per pagină, dar encoderul de viziune nu primește rezoluția suplimentară — paginile mai mari se citesc *mai prost*. Măsurat, documentat în [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), neactivat.
- Prețurile se schimbă; metrica durabilă este tăierea de tokeni, pe care proxy-ul o înregistrează per request față de un contrafactual gratuit `count_tokens`.

# 🧠 Întrebări frecvente

**Este 59–70% de la un capăt la altul, sau doar pe request-urile atinse?**
De la un capăt la altul — întreaga factură. Majoritatea uneltelor de compresie raportează economii doar pe felia pe care au atins-o, ceea ce înfrumusețează cifra. Numitorul nostru este *fiecare* request: cele mici pe care gate-ul le-a lăsat corect neatinse, toate scrierile și citirile de cache, și toți tokenii de ieșire (pe care proxy-ul nu îi comprimă niciodată). Cifra doar-pe-comprimate iese mai mare și este citată separat, niciodată ca titlu.

**Cum este măsurată economia?**
Ambele părți ale aceluiași request, în același moment. Pentru fiecare POST către `/v1/messages`, proxy-ul lansează o sondă gratuită `count_tokens` pe corpul original necomprimat (contrafactualul) în paralel cu redirecționarea reală, și citește blocul de utilizare efectiv facturat de furnizor din răspuns — ambele ajung în aceeași linie de eveniment. Prețul de cache este aplicat identic pe ambele părți, astfel încât discountul de caching se anulează și nu poate fi contabilizat de două ori ca „economie”. Formula se află în `src/core/baseline.ts`; re-derivați-o din propriul jurnal de evenimente.

**De ce ar fi o ratare o confabulație în loc de o eroare de citire?**
Pentru că viziunea modelului nu este OCR: pagina devine embeddings de patch-uri, niciodată caractere discrete, deci nu există o încredere per-glif care să eșueze zgomotos — când pixelii subdetermina un glif, prior-ul lingvistic umple golul cu ceva plauzibil. Acest mecanism este exact motivul pentru care OmniGlyph este fail-closed în privința asta: valorile exacte pe bit călătoresc mereu ca text lângă imagine, modelele care citesc greșit sunt blocate de gate, iar config-ul de producție măsurat a produs **zero** confabulații silențioase în ~300 de sonde de citire — citirile eșuate se abțin.

**Ce se întâmplă cu lucrul exact pe bit (hash-uri, ID-uri, secrete)?**
Turele recente și identificatorii exacți rămân text prin design. Pentru sarcinile care sunt *în întregime* exacte pe bit, direcționați-le către un model care nu este pe allowlist (de ex. un subagent pe un alt model Claude) — orice este în afara allowlist-ului trece byte-identic, neatins.

**Nu a tranșat deja DeepSeek-OCR dacă asta funcționează?**
A dovedit că *canalul* funcționează — cu o pereche encoder/decoder antrenată special pentru asta. Scepticismul datează de când niciun model de producție standard nu putea citi render-uri dense; asta s-a schimbat, iar [clasamentul modelelor](../../../README.md#-the-numbers--measured-not-estimated) de mai sus arată exact cine le citește astăzi, cu dovezi. [Harness-ul de benchmark](../../../benchmarks/README.md) retestează orice model nou într-o singură comandă — gate-ul urmează datele, nu hype-ul.

**Îl pot folosi fără Claude Code — Cursor, ChatGPT, un simplu pipe?**
Da, în două moduri. Ca **proxy**, funcționează cu orice client care vă permite să setați URL-ul de bază al API-ului (`ANTHROPIC_BASE_URL` sau URL-ul de bază OpenAI) — Claude Code, propriile dumneavoastră scripturi, orice funcționează prin HTTP. Iar pentru uneltele care nu pot folosi un proxy, **Export offline** de mai sus randează contextul în pagini PNG pe care le lipiți manual — `omniglyph export --stdin` chiar citește direct dintr-un pipe Unix.

**Cum transformă de fapt textul într-o imagine?**
Reflowează textul și îl pictează cu un atlas de glife 1-bit 5×8 pixeli pe pagini PNG dense de 1568×728 — un bit per pixel, fără anti-aliasing, astfel încât modelul facturează pagina în funcție de dimensiunile ei, nu în funcție de câte caractere conține. **Cum funcționează** de mai sus conține pipeline-ul; documentul de benchmark-uri conține geometria și motivul pentru care mai dens nu înseamnă întotdeauna mai ieftin.

# 🔬 Reproduceți fiecare cifră

```bash
pnpm install && pnpm test                                     # suita completă
node benchmarks/billing-sweep/run.mjs --dry-run               # predicții de facturare, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabel de cost, $0
# cu chei: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (sau --via-cli pentru un abonament Claude Code)
```

![Cele două harness-uri de benchmark rulând în modul dry-run](../../../docs/assets/demo-benchmarks.gif)

Metodologie completă și fiecare tabel de rezultate: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Dovezi brute per răspuns: `benchmarks/*/results/*.jsonl`.

# 🚀 Familia OmniRoute

OmniGlyph este de asemenea livrat ca un **motor de compresie nativ în interiorul [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — gateway-ul gratuit de AI. Acolo rulează ca motorul `omniglyph` (mod standalone unic sau stivuit cu celelalte motoare), cu gate-uri fail-closed și contabilizare de tokeni conștientă de imagine.

# 🛠️ Stack tehnic

| strat | tehnologie |
|---|---|
| Limbaj | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Randare | atlas propriu de glife 1-bit (derivat din Spleen/Unifont, licențe în `assets/`) → PNG |
| Teste | Vitest — TDD, plus guarduri de integritate a docs și de rebrand |
| Benchmarks | harness-uri `benchmarks/` (billing-sweep, density-frontier) cu dovezi JSONL |

## Structura proiectului

| cale | ce este |
|---|---|
| `src/` | proxy-ul: pipeline de transformare, facturare exactă per furnizor, randor, hosturi (Node + Cloudflare Workers) |
| `benchmarks/` | harness-urile care au produs fiecare cifră de mai sus — re-executabile |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Suport & Comunitate

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bug-uri și cereri de funcționalități
- 🔒 [SECURITY.md](SECURITY.md) — raportări de vulnerabilități
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD strict + măsurare înainte de afirmații
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Mulțumiri

OmniGlyph stă pe umerii unui proiect în special — această secțiune este mulțumirea noastră permanentă.

| Proiect | Cum a modelat OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Descoperirea pe care este construit întregul proiect.** pxpipe a demonstrat, cu dovezi, că un canal de viziune al unui LLM de producție poate transporta context textual dens la o fracțiune din costul de tokeni — și că această conversie trebuie decisă per-request prin matematică exactă de facturare, niciodată prin vibe. Randarea densă de 1-bit, gate-ul de profitabilitate, contrafactualul `count_tokens`, allowlist-ul fail-closed de modele, și cultura de documentare „măsurați înainte să afirmați” au fost toate pionierate acolo. OmniGlyph descinde direct din acel codebase (MIT — linia originală de copyright rămâne în fișierul nostru [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Familia de fonturi bitmap 5×8 din care derivă atlasul nostru dens de glife 1-bit (licență în `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Acoperire pentru glifele dincolo de gama Spleen, în același atlas (licență în `assets/`). |

Dacă găsiți OmniGlyph util, dați star și proiectului original — descoperirea a fost a lor. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licență

MIT — vedeți [LICENSE](../../../LICENSE).
