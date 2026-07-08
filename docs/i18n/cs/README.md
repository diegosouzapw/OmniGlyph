🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontext jako obrázek

### Snižte svůj účet za Claude o **59–70 %** vykreslením objemného kontextu jako hustých PNG stránek — stejný obsah, zlomek tokenů.

**Modely účtují text za token, ale obrázek účtují podle jeho rozměrů — ne podle toho, kolik textu je uvnitř.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-sla--meno-nikoli-odhadovno)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](../../../benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](../../../benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-poctiv-st)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Součást rodiny [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Všechny jazyky](../README.md)

</div>

---

# 📊 Čísla — měřeno, nikoli odhadováno

| metrika | výsledek | doklad |
|---|---|---|
| Snížení účtu z konce do konce | **59–70 %** | produkční trasa, 13 709 requestů |
| Tokenů na konvertovaný blok | **10× méně** (28 080 znaků: 14 040 → 1 460 tokenů) | [billing sweep](../../../benchmarks/billing-sweep/README.md) |
| Přesnost billingového vzorce | nulový **reziduál** napříč 22 měřeními `count_tokens`, 2 modely × 2 úrovně | `benchmarks/billing-sweep/results/` |
| Přesnost přesného čtení, produkční konfigurace | **30/30 (100 %)** na Claude Fable 5 | [density frontier](../../../benchmarks/density-frontier/README.md) |
| Tiché konfabulace v ~300 čtecích testech | **0** — každý neúspěch se zdrží jako `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Skóre podle modelu** (dokáže přečíst husté rendery? n=30 na rameno, deterministické skórování):

| model | čtení | verdikt |
|---|---|---|
| Claude **Fable 5** | **100 %** přesně | ✅ produkční cíl |
| Claude Opus 4.8 | 77–87 % při 4× větších glyfech | ⚠️ volitelný bezpečný režim (úspory klesají na ~2×) |
| GPT-5.5 | 0/60 — a nafukuje své odpovědi ~40× při pokusu | ❌ blokováno gatem, s důkazem |
| Gemini 2.5-flash | 0/26 — a konfabuluje místo toho, aby se zdržel | ❌ blokováno (částečný test, omezeno kvótou) |

Výhoda je dnes **specifická pro Fable** — ostatní vizuální enkodéry husté glyfy zatím nerozpoznají. [Harness benchmarků](../../../benchmarks/README.md) jedním příkazem přetestuje jakýkoli nový model.

# 🤔 Proč OmniGlyph?

Každá dlouhotrvající agentní relace táhne u každého requestu stejnou mrtvou váhu: system prompt, dokumentaci nástrojů a starou historii — přeúčtovávanou za token, každý tah. OmniGlyph je **lokální proxy**, která tyto objemné části přepíše do hustých PNG stránek *dřív, než opustí váš počítač*:

- **Přesná billingová matematika, ne heuristiky** — počítá skutečný vzorec poskytovatele pro tokeny za obrázek (změřeno na nulový reziduál) a konvertuje pouze tehdy, když to matematicky vychází.
- **Fail-closed už z podstaty návrhu** — modely, které neumí přečíst husté rendery, jsou blokovány gatem, s doklady z benchmarků. Žádná tichá ztráta kvality.
- **Soukromé a lokální na prvním místě** — přepis probíhá na `127.0.0.1`; nic navíc se nikam neposílá.
- **Reprodukovatelné** — každé číslo výše má doklad v `benchmarks/*/results/`, opakovatelný jedním příkazem.

# ⚡ Rychlý start

```bash
npx omniglyph                                     # proxy na 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # namiřte na ni Claude Code
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Funguje oběma způsoby:
- **API klíč** (platba za token): účet klesne o 59–70 % z konce do konce.
- **Relace na předplatné**: neplatíte méně, ale limity použití se počítají v tokenech — takže vaše limity vydrží **~2–3×** déle.

Dashboard na <http://127.0.0.1:47821/>: ušetřené tokeny, každá konverze text→obrázek vedle sebe, kill switch, živé čipy modelů. Odpovědi streamují normálně — komprimuje se pouze *request*, nikdy výstup modelu.

# ⚙️ Jak to funguje

```
objemný blok requestu ──► gate ziskovosti ──► reflow + render (1bitová 5×8 atlasová mřížka)
                       (přesná billingová matematika)     ──► 1568×728 PNG stránky ──► splice zpět, šetrné k cache
```

- **Billing se počítá přesně, před konverzí**: Anthropic účtuje `⌈w/28⌉ × ⌈h/28⌉ + 4` tokenů za obrázek (patche po 28 px — změřeno na nulový reziduál). Plná stránka nese 28 080 znaků za 1 460 tokenů ≈ **19 znaků/token**, oproti ~2 znakům/token u hustého textu. Gate konvertuje pouze tehdy, když to matematicky vychází.
- **Co se konvertuje**: statický system prompt + dokumentace nástrojů, stará sbalená historie, velké výstupy nástrojů.
- **Co se nikdy nekonvertuje**: vaše zprávy, nedávné tahy, výstup modelu, řídká próza, hodnoty přesné na bajt (hashe/ID cestují jako text vedle obrázku) a jakýkoli model, který neprošel čtecím benchmarkem.

# 🧭 Poctivá část

- **Je to ztrátové.** Přesné vybavení dat na úrovni bajtů z obrázků je ze své podstaty nespolehlivé. Zavedené zmírnění: přesné identifikátory cestují jako text vedle obrázku a změřená produkční konfigurace vyprodukovala **nula tichých konfabulací** — neúspěšná čtení se zdrží.
- **Dnes je schválen pouze Fable 5**, s doklady. GPT-5.5 a Gemini 2.5-flash měřitelně neumí přečíst husté rendery; Opus 4.8 potřebuje 4× větší glyfy. Toto gate vynucuje.
- **Našli jsme a vyhnuli se billingové pasti**: vysokorozlišovací úroveň obrázku účtuje 3,3× více za stránku, ale vizuální enkodér tu extra rozlišovací schopnost nedostává — větší stránky se čtou *hůř*. Změřeno, zdokumentováno v [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), nezapnuto.
- Ceny se mění; trvalou metrikou je snížení tokenů, které proxy loguje za každý request oproti bezplatnému kontrafaktuálu `count_tokens`.

# 🔬 Reprodukujte každé číslo

```bash
pnpm install && pnpm test                                     # celá sada
node benchmarks/billing-sweep/run.mjs --dry-run               # predikce billingu, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabulka nákladů, $0
# s klíči: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (nebo --via-cli pro předplatné Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Kompletní metodologie a všechny tabulky výsledků: [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md). Surové doklady po jednotlivých odpovědích: `benchmarks/*/results/*.jsonl`.

# 🚀 Rodina OmniRoute

OmniGlyph se také dodává jako **nativní kompresní engine uvnitř [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — bezplatné brány pro AI. Tam běží jako engine `omniglyph` (samostatný jednoduchý režim nebo naskládaný s dalšími enginy), s fail-closed gaty a účtováním tokenů, které bere v úvahu obrázky.

# 🛠️ Technologický stack

| vrstva | technologie |
|---|---|
| Jazyk | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Vykreslování | vlastní 1bitová atlasová mřížka glyfů (odvozeno od Spleen/Unifont, licence v `assets/`) → PNG |
| Testy | Vitest — TDD, plus stráže integrity dokumentace a rebrandingu |
| Benchmarky | harness v `benchmarks/` (billing-sweep, density-frontier) s doklady JSONL |

## Struktura projektu

| cesta | co |
|---|---|
| `src/` | proxy: transformační pipeline, přesný billing na poskytovatele, renderer, hosté (Node + Cloudflare Workers) |
| `benchmarks/` | harness, které vyprodukovaly každé číslo výše — opakovatelné |
| `docs/` | [BENCHMARKS](../../../docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](../../../docs/architecture/ARCHITECTURE.md) · [ROADMAP](../../../docs/ROADMAP.md) |

# 📧 Podpora a komunita

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — chyby a požadavky na funkce
- 🔒 [SECURITY.md](SECURITY.md) — hlášení zranitelností
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — striktní TDD + měření před tvrzeními
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licence

MIT — viz [LICENSE](../../../LICENSE).
