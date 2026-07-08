🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontextus mint kép

### Vágja le a Claude-számláját **59–70%**-kal azáltal, hogy a terjedelmes kontextust sűrű PNG-oldalakká rendereli — ugyanaz a tartalom, a tokenek töredékéért.

**A modellek a szöveget tokenenként számlázzák, de a képet a méretei alapján — nem attól függően, mennyi szöveg van benne.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

A [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) család része

</div>

---

# 📊 The numbers — measured, not estimated

| mutató | eredmény | bizonyíték |
|---|---|---|
| Teljes körű számlacsökkentés | **59–70%** | éles nyomkövetés, 13 709 kérés |
| Tokenek konvertált blokkonként | **10×kevesebb** (28 080 karakter: 14 040 → 1 460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Számlázási képlet pontossága | **nulla** maradék 22 `count_tokens` próba során, 2 modell × 2 szint | `benchmarks/billing-sweep/results/` |
| Pontos olvasási arány, éles konfiguráció | **30/30 (100%)** a Claude Fable 5-nél | [density frontier](benchmarks/density-frontier/README.md) |
| Néma konfabulációk ~300 olvasási próbában | **0** — minden hibás olvasás `ILEGIVEL`-ként tartózkodik | `benchmarks/density-frontier/results/` |

**Modell-eredménytábla** (képes-e olvasni a sűrű renderelést? n=30 karonként, determinisztikus pontozás):

| modell | olvasás | ítélet |
|---|---|---|
| Claude **Fable 5** | **100%** pontos | ✅ éles célmodell |
| Claude Opus 4.8 | 77–87% 4×-es glifméretnél | ⚠️ opt-in biztonságos mód (a megtakarítás ~2×-re csökken) |
| GPT-5.5 | 0/60 — és a válaszait ~40×-esen felfújja próbálkozás közben | ❌ a kapu blokkolja, bizonyítékkal |
| Gemini 2.5-flash | 0/26 — és tartózkodás helyett konfabulál | ❌ blokkolva (részleges teszt, kvótakorlátozott) |

Az előny **ma Fable-specifikus** — más vizuális enkóderek még nem tudják felbontani a sűrű glifeket. A [benchmark harness](benchmarks/README.md) egyetlen paranccsal újratesztel minden új modellt.

# 🤔 Miért OmniGlyph?

Minden hosszan futó ágensmunkamenet ugyanazt a holt terhet vonszolja minden kéréssel: a rendszerprompt, az eszközdokumentáció és a régi előzmények — minden fordulóban újra, tokenenként számlázva. Az OmniGlyph egy **helyi proxy**, amely ezeket a terjedelmes részeket sűrű PNG-oldalakká írja át *mielőtt elhagynák a gépét*:

- **Pontos számlázási matematika, nem heurisztika** — kiszámítja a szolgáltató valós kép-token képletét (nulla maradékra mérve), és csak akkor konvertál, ha a matematika megéri.
- **Fail-closed tervezés** — a sűrű renderelést olvasni nem képes modelleket egy kapu blokkolja, benchmark-bizonyítékokkal. Nincs néma minőségromlás.
- **Privát és helyi-first** — az átírás a `127.0.0.1`-en történik; semmi extra nem kerül elküldésre sehova.
- **Reprodukálható** — a fenti minden szám bizonyítékkal rendelkezik a `benchmarks/*/results/`-ban, egyetlen paranccsal újrafuttatható.

# ⚡ Gyorsindítás

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Mindkét módon működik:
- **API-kulcs** (tokenenkénti fizetés): a számlája végponttól végpontig 59–70%-kal csökken.
- **Előfizetéses munkamenet**: nem fizet kevesebbet, de a használati korlátok tokenben vannak számolva — így a korlátai **~2–3×**-osra nyúlnak.

Irányítópult a <http://127.0.0.1:47821/> címen: megtakarított tokenek, minden szöveg→kép konverzió egymás mellett, vészkapcsoló, élő modell-chipek. A válaszok normálisan streamelnek — csak a *kérés* van tömörítve, a modell kimenete soha.

# ⚙️ Hogyan működik

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **A számlázást pontosan kiszámítjuk, a konvertálás előtt**: az Anthropic `⌈w/28⌉ × ⌈h/28⌉ + 4` tokent számláz képenként (28 px-es patch-ek — nulla maradékra mérve). Egy teljes oldal 28 080 karaktert hordoz 1 460 tokenért ≈ **19 karakter/token**, szemben a sűrű szöveg ~2 karakter/tokenjével. A kapu csak akkor konvertál, ha a matematika megéri.
- **Mi konvertálódik**: a statikus rendszerprompt + eszközdokumentáció, régi összecsukott előzmények, nagy eszközkimenetek.
- **Mi soha nem konvertálódik**: az Ön üzenetei, a legutóbbi fordulók, a modell kimenete, ritkás prózaszöveg, byte-pontos értékek (hash-ek/azonosítók szövegként utaznak mellette), és bármely modell, amely megbukott az olvasási benchmarkon.

# 🧭 The honest part

- **Veszteséges.** A byte-pontos visszakeresés képekből természeténél fogva megbízhatatlan. Bevetett mérséklések: a pontos azonosítók szövegként utaznak a kép mellett, és a mért éles konfiguráció **nulla néma konfabulációt** produkált — a sikertelen olvasások tartózkodnak.
- **Ma csak a Fable 5 jóváhagyott**, bizonyítékokkal. A GPT-5.5 és a Gemini 2.5-flash mérhetően nem képes olvasni a sűrű renderelést; az Opus 4.8-nak 4×-esen nagyobb glifekre van szüksége. A kapu ezt kikényszeríti.
- **Találtunk és elkerültünk egy számlázási csapdát**: a nagyfelbontású képszint oldalanként 3,3×-szer többet számláz, de a vizuális enkóder nem kapja meg a plusz felbontást — a nagyobb oldalak *rosszabbul* olvashatók. Mérve, dokumentálva a [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)-ban, nincs bekapcsolva.
- Az árak változnak; a tartós mutató a token-csökkentés, amit a proxy kérésenként naplóz egy ingyenes `count_tokens` ellentényezővel szemben.

# 🔬 Minden szám reprodukálása

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Teljes módszertan és minden eredménytáblázat: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Nyers, válaszonkénti bizonyítékok: `benchmarks/*/results/*.jsonl`.

# 🚀 Az OmniRoute család

Az OmniGlyph emellett **natív tömörítési motorként is szállítva van az [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-on belül** — az ingyenes AI-átjárón. Ott `omniglyph` motorként fut (önálló egyedi módban vagy a többi motorral egymásra rétegezve), fail-closed kapukkal és képtudatos token-elszámolással.

# 🛠️ Technológiai stack

| réteg | technológia |
|---|---|
| Nyelv | TypeScript (strict), ESM |
| Futtatókörnyezet | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderelés | saját 1-bites glifatlasz (Spleen/Unifont-alapú, licencek az `assets/`-ban) → PNG |
| Tesztek | Vitest — TDD, plusz docs-integritási és rebrand-guardok |
| Benchmarkok | `benchmarks/` harness-ek (billing-sweep, density-frontier) JSONL-bizonyítékokkal |

## Projekt elrendezése

| útvonal | mi |
|---|---|
| `src/` | a proxy: transzformációs pipeline, pontos számlázás szolgáltatónként, renderelő, hostok (Node + Cloudflare Workers) |
| `benchmarks/` | a harness-ek, amelyek a fenti minden számot előállították — újrafuttathatók |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Támogatás és közösség

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — hibák és funkciókérések
- 🔒 [SECURITY.md](SECURITY.md) — sebezhetőségi bejelentések
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — szigorú TDD + mérés-a-állítás-előtt
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licenc

MIT — lásd: [LICENSE](../../../LICENSE).
