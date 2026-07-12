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

# 🔌 Használat Claude-kliensekkel

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

# 🖥️ Az irányítópult

A csomag egy teljes, helyi irányítópultot tartalmaz — offline, egyetlen fájlból áll, nulla külső kéréssel. Hat oldal, SSE-n keresztül élőben frissülve, ahogy a kérések áramlanak:

![Overview: mission-control KPI cards, savings sparkline and live event feed](../../assets/dashboard-overview.png)

- **Áttekintés (Overview)** — mission control: megtakarítás %, megtakarított $, latencia p95, cache-találatok, hibák, élő feed.
- **Élő folyamat (Live Flow)** — a pipeline mint csomópontgráf: kliens → kapu (gate) → renderelő / átengedés (passthrough) → API, egy részecskével minden valós kérésért.
- **Telemetria** — egy token/$ kilométeróra és egy élő kéréstimeline; kattintson bármely kérésre, hogy pontosan lássa, mely részek váltak képpé, és olvassa el a forrásszöveget minden oldal mögött.
- **Benchmarkok** — a harness bizonylatai a `benchmarks/*/results/` alapján renderelve, soronként egy modell·konfiguráció kísérlettel, és **futtassa a benchmarkokat közvetlenül a felületről**: a `$0`-os dry-run-ok élőben streamelik a kimenetüket; az élő futtatások az Ön API-kulcsa mögé és egy explicit költség-megerősítés mögé vannak zárva.
- **Munkamenetek / Előzmények (Sessions / History)** — a legtöbb megtakarított tokennel rendelkező munkamenetek és minden lemezen tárolt esemény.

| Élő folyamat | Benchmarkok |
|---|---|
| ![The request pipeline as a live node graph](../../assets/dashboard-flow.png) | ![Benchmark receipts and in-UI dry-runs](../../assets/dashboard-benchmarks.png) |

![Telemetry: odometer and live request timeline](../../assets/dashboard-telemetry.png)

# ⚙️ Hogyan működik

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **A számlázást pontosan kiszámítjuk, a konvertálás előtt**: az Anthropic `⌈w/28⌉ × ⌈h/28⌉ + 4` tokent számláz képenként (28 px-es patch-ek — nulla maradékra mérve). Egy teljes oldal 28 080 karaktert hordoz 1 460 tokenért ≈ **19 karakter/token**, szemben a sűrű szöveg ~2 karakter/tokenjével. A kapu csak akkor konvertál, ha a matematika megéri.
- **Mi konvertálódik**: a statikus rendszerprompt + eszközdokumentáció, régi összecsukott előzmények, nagy eszközkimenetek.
- **Mi soha nem konvertálódik**: az Ön üzenetei, a legutóbbi fordulók, a modell kimenete, ritkás prózaszöveg, byte-pontos értékek (hash-ek/azonosítók szövegként utaznak mellette), és bármely modell, amely megbukott az olvasási benchmarkon.

# 📚 Könyvtárhasználat (proxy nélkül)

Mindent, amit a proxy kérésenként elvégez, dokumentált, importálható API-ként is elérhető:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

Az `options.keepSharp(block)` szövegként rögzíti a blokkokat; az `options.emitRecoverable` visszaadja a képpé alakított blokkok eredetijét. A pontos számlázási matematika a csomag gyökerén is elérhető (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — ezt használja fel az [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Tiszta JS futtatókörnyezet (Node és edge/Workers). Teljes felület: `src/core/index.ts`.

# 📤 Offline exportálás — proxy nélkül, Claude Code nélkül

Nem Claude Code-ot használ? Renderelje a kontextust PNG-oldalakká **helyben**, és illessze be őket a Cursorba, a ChatGPT-be vagy bármely olyan chatbe, amely elfogad képfeltöltéseket. Nincs proxy, nincs API-kulcs, nincs bekötött fiók:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Egyetlen mappát kap, benne mindennel, amit be kell dobnia a chatbe:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

A `--git` a nem commitolt diffjét rendereli, a `--diff <ref>` egy commit-tartományt, a `--open` pedig megnyitja a mappát (macOS). Minden a saját gépén fut — az exportálási útvonal soha nem indítja el a proxyt, és soha nem hív meg modellt. Futtassa az `omniglyph export --help`-et minden kapcsolóért.

# 🧭 The honest part

- **Veszteséges.** A byte-pontos visszakeresés képekből természeténél fogva megbízhatatlan. Bevetett mérséklések: a pontos azonosítók szövegként utaznak a kép mellett, és a mért éles konfiguráció **nulla néma konfabulációt** produkált — a sikertelen olvasások tartózkodnak.
- **Ma csak a Fable 5 jóváhagyott**, bizonyítékokkal. A GPT-5.5 és a Gemini 2.5-flash mérhetően nem képes olvasni a sűrű renderelést; az Opus 4.8-nak 4×-esen nagyobb glifekre van szüksége. A kapu ezt kikényszeríti.
- **Találtunk és elkerültünk egy számlázási csapdát**: a nagyfelbontású képszint oldalanként 3,3×-szer többet számláz, de a vizuális enkóder nem kapja meg a plusz felbontást — a nagyobb oldalak *rosszabbul* olvashatók. Mérve, dokumentálva a [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)-ban, nincs bekapcsolva.
- Az árak változnak; a tartós mutató a token-csökkentés, amit a proxy kérésenként naplóz egy ingyenes `count_tokens` ellentényezővel szemben.

# 🧠 GYIK

**Az 59–70% végponttól végpontig értendő, vagy csak azokra a kérésekre, amelyeket érintett?**
Végponttól végpontig — a teljes számla. A legtöbb tömörítő eszköz csak azon a szeleten mért megtakarítást jelenti, amelyet ténylegesen érintett, ami hízelgőbbé teszi a számot. A mi nevezőnk *minden* kérés: a kicsik, amelyeket a kapu helyesen érintetlenül hagyott, minden cache-írás és -olvasás, és minden kimeneti token (amit a proxy soha nem tömörít). A csak-tömörített arány magasabb, és külön van feltüntetve, sosem főcímként.

**Hogyan mérjük a megtakarítást?**
Ugyanannak a kérésnek mindkét oldalát, ugyanabban a pillanatban. Minden `/v1/messages` POST esetén a proxy egy ingyenes `count_tokens` próbát indít az eredeti, tömörítetlen törzsön (az ellentényezőn) párhuzamosan a valódi továbbítással, és kiolvassa a szolgáltató által ténylegesen számlázott usage-blokkot a válaszból — mindkettő ugyanabba az eseménysorba kerül. A cache-árazást mindkét oldalra azonosan alkalmazzuk, így a cache-kedvezmény kiesik, és nem számolható duplán „megtakarításként”. A képlet a `src/core/baseline.ts`-ben található; saját eseménynaplójából újra levezetheti.

**Miért lenne egy hibás olvasás konfabuláció, nem pedig olvasási hiba?**
Mert a modell látása nem OCR: az oldal patch-embeddingekké válik, sosem diszkrét karakterekké, így nincs glifenkénti megbízhatósági érték, amin hangosan el lehetne bukni — amikor a pixelek alulhatározzák a glifét, a nyelvi prior valami valószínűvel tölti ki a rést. Pontosan ez a mechanizmus az oka annak, hogy az OmniGlyph fail-closed ezzel kapcsolatban: a byte-pontos értékek mindig szövegként utaznak a kép mellett, a rosszul olvasó modelleket a kapu blokkolja, és a mért éles konfiguráció **nulla** néma konfabulációt produkált ~300 olvasási próba során — a sikertelen olvasások tartózkodnak.

**Mi a helyzet a byte-pontos munkával (hash-ek, azonosítók, titkok)?**
A legutóbbi fordulók és a pontos azonosítók tervezésnél fogva szövegként maradnak. Azoknál a munkaterheléseknél, amelyek *teljes egészében* byte-pontosak, irányítsa őket egy nem engedélyezési listán szereplő modellhez (pl. egy szubágenshez egy másik Claude-modellen) — minden, ami az engedélyezési listán kívül esik, byte-azonosan, érintetlenül halad át.

**A DeepSeek-OCR nem döntötte már el, hogy ez működik-e?**
Az bebizonyította, hogy a *csatorna* működik — egy erre a feladatra betanított enkóder/dekóder párral. A szkepticizmus abból az időből származik, amikor egyetlen gyári éles modell sem tudta olvasni a sűrű rendereléseket; ez megváltozott, és a fenti [modell-eredménytábla](../../../README.md#-the-numbers--measured-not-estimated) pontosan megmutatja, ki olvassa ezeket ma, bizonyítékokkal. A [benchmark harness](../../../benchmarks/README.md) egyetlen paranccsal újratesztel minden új modellt — a kapu az adatokat követi, nem a hype-ot.

**Használhatom Claude Code nélkül is — Cursorral, ChatGPT-vel, egyszerű pipe-pal?**
Igen, kétféleképpen. **Proxyként** bármely olyan klienssel működik, amelyben beállíthatja az API alap-URL-jét (`ANTHROPIC_BASE_URL`, vagy az OpenAI alap-URL-je) — Claude Code, a saját szkriptjei, bármi, ami HTTP. Azoknál az eszközöknél pedig, amelyek nem tudnak proxyzni, a fenti **Offline exportálás** PNG-oldalakká rendereli a kontextust, amelyeket kézzel illeszt be — az `omniglyph export --stdin` még egy Unix pipe-ból is közvetlenül olvas.

**Hogyan alakítja át valójában a szöveget képpé?**
Újratördeli a szöveget, és egy 1-bites 5×8 pixeles glifatlasszal festi rá a sűrű 1568×728-as PNG-oldalakra — egy bit pixelenként, élsimítás nélkül —, így a modell az oldalt a méretei alapján számlázza, nem az alapján, hány karakter van benne. A fenti **Hogyan működik** tartalmazza a pipeline-t; a benchmark-dokumentum pedig a geometriát és azt, hogy miért nem mindig olcsóbb a sűrűbb.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Köszönetnyilvánítás

Az OmniGlyph különösen egyetlen projekt vállán áll — ez a szakasz a maradandó köszönetünk.

| Projekt | Hogyan formálta az OmniGlyph-et |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **A felfedezés, amelyre ez az egész projekt épül.** A pxpipe bizonyítékokkal igazolta, hogy egy éles LLM vizuális csatornája a token-költség töredékéért képes sűrű szöveges kontextust szállítani — és hogy a konverziót kérésenként, pontos számlázási matematikával kell eldönteni, sosem megérzés alapján. A sűrű 1-bites renderelés, a profitabilitási kapu, a `count_tokens` ellentényező, a fail-closed modell-engedélyezési lista, és a „mérj, mielőtt állítasz” dokumentációs kultúra mind ott született. Az OmniGlyph közvetlenül ebből a kódbázisból származik (MIT — az eredeti copyright sor megmarad a [LICENSE](../../../LICENSE)-ünkben). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Az 5×8-as bitmap betűtípus-család, amelyből a sűrű 1-bites glifatlaszunk származik (licenc az `assets/`-ban). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Lefedettség a Spleen tartományán túli glifekhez ugyanabban az atlaszban (licenc az `assets/`-ban). |

Ha hasznosnak találja az OmniGlyph-et, adjon csillagot az upstream projektnek is — a felfedezés az övék volt. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licenc

MIT — lásd: [LICENSE](../../../LICENSE).
