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

# ⚙️ Cum funcționează

```
bloc de request voluminos ──► gate de profitabilitate ──► reflow + render (atlas 1-bit 5×8)
                       (matematică de facturare exactă)     ──► pagini PNG 1568×728 ──► reintroduse, prietenoase cu cache-ul
```

- **Facturarea este calculată exact, înainte de conversie**: Anthropic facturează `⌈w/28⌉ × ⌈h/28⌉ + 4` tokeni per imagine (patch-uri de 28 px — măsurat la reziduu zero). O pagină plină conține 28,080 caractere pentru 1,460 tokeni ≈ **19 caractere/token**, față de ~2 caractere/token pentru text dens. Gate-ul convertește doar când matematica câștigă.
- **Ce se convertește**: system prompt-ul static + docs de unelte, istoricul vechi colapsat, ieșirile mari de unelte.
- **Ce nu se convertește niciodată**: mesajele dumneavoastră, turele recente, ieșirea modelului, proza rară, valorile exacte pe bit (hash-uri/ID-uri călătoresc alături ca text), și orice model care a eșuat la benchmark-ul de citire.

# 🧭 Partea onestă

- **Este lossy.** Recall-ul byte-exact din imagini este nesigur prin natura sa. Atenuări deja implementate: identificatorii exacți călătoresc ca text lângă imagine, iar config-ul de producție măsurat a produs **zero confabulații silențioase** — citirile eșuate se abțin.
- **Doar Fable 5 este aprobat astăzi**, cu dovezi. GPT-5.5 și Gemini 2.5-flash măsurabil nu pot citi render-uri dense; Opus 4.8 are nevoie de glife 4× mai mari. Gate-ul impune acest lucru.
- **Am găsit și am evitat o capcană de facturare**: nivelul de imagine de înaltă rezoluție facturează de 3.3× mai mult per pagină, dar encoderul de viziune nu primește rezoluția suplimentară — paginile mai mari se citesc *mai prost*. Măsurat, documentat în [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), neactivat.
- Prețurile se schimbă; metrica durabilă este tăierea de tokeni, pe care proxy-ul o înregistrează per request față de un contrafactual gratuit `count_tokens`.

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

## 📄 Licență

MIT — vedeți [LICENSE](../../../LICENSE).
