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

# 🖥️ Dashboard

Kompletní lokální dashboard je součástí balíčku — offline, jeden soubor, žádné externí requesty. Šest stránek, aktualizovaných živě přes SSE, jak requesty proudí:

![Overview: KPI karty pro mission control, sparkline úspor a živý event feed](../../assets/dashboard-overview.png)

- **Overview** — mission control: % úspory, ušetřené $, latence p95, cache hits, chyby, live feed.
- **Live Flow** — pipeline jako graf uzlů: client → gate → renderer / passthrough → API, s částicí pro každý reálný request.
- **Telemetry** — odometr tokenů/$ a živá časová osa requestů; klikněte na libovolný request a uvidíte přesně, které části se staly obrázky, a přečtete si zdrojový text za každou stránkou.
- **Benchmarks** — protokoly harness testů vykreslené z `benchmarks/*/results/`, jeden řádek na experiment model·konfigurace, a **spouštějte benchmarky přímo z UI**: `$0` dry-runy streamují svůj výstup živě; ostré běhy zůstávají podmíněné vaším API klíčem a výslovným potvrzením nákladů.
- **Sessions / History** — nejlepší session podle ušetřených tokenů a každý event na disku.

| Live Flow | Benchmarks |
|---|---|
| ![Pipeline requestů jako živý graf uzlů](../../assets/dashboard-flow.png) | ![Protokoly benchmarků a dry-runy přímo v UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: odometr a živá časová osa requestů](../../assets/dashboard-telemetry.png)

# ⚙️ Jak to funguje

```
objemný blok requestu ──► gate ziskovosti ──► reflow + render (1bitová 5×8 atlasová mřížka)
                       (přesná billingová matematika)     ──► 1568×728 PNG stránky ──► splice zpět, šetrné k cache
```

- **Billing se počítá přesně, před konverzí**: Anthropic účtuje `⌈w/28⌉ × ⌈h/28⌉ + 4` tokenů za obrázek (patche po 28 px — změřeno na nulový reziduál). Plná stránka nese 28 080 znaků za 1 460 tokenů ≈ **19 znaků/token**, oproti ~2 znakům/token u hustého textu. Gate konvertuje pouze tehdy, když to matematicky vychází.
- **Co se konvertuje**: statický system prompt + dokumentace nástrojů, stará sbalená historie, velké výstupy nástrojů.
- **Co se nikdy nekonvertuje**: vaše zprávy, nedávné tahy, výstup modelu, řídká próza, hodnoty přesné na bajt (hashe/ID cestují jako text vedle obrázku) a jakýkoli model, který neprošel čtecím benchmarkem.

# 📚 Použití jako knihovna (bez proxy)

Vše, co proxy dělá pro každý request, je zároveň zdokumentované, importovatelné API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Vykreslete libovolný text do hustých 1bitových PNG stránek
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Nebo si spusťte celou transformaci requestu sami — gate, billingová matematika, vše
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // surové JSON tělo /v1/messages
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` připíná bloky jako text; `options.emitRecoverable` vrací originály obrázkových bloků. Přesná billingová matematika se dodává i v kořeni balíčku (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — přesně to konzumuje [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Čistě JS runtime (Node i edge/Workers). Celé rozhraní: `src/core/index.ts`.

# 📤 Offline export — bez proxy, bez Claude Code

Nepoužíváte Claude Code? Vykreslete kontext do PNG stránek **lokálně** a vložte je do Cursor, ChatGPT nebo jakéhokoli chatu, který přijímá nahrávání obrázků. Žádná proxy, žádný API klíč, žádný napojený účet:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Dostanete jednu složku se vším, co stačí vložit do chatu:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` vykreslí váš necommitnutý diff, `--diff <ref>` rozsah commitů, `--open` zobrazí složku (macOS). Vše běží na vašem počítači — cesta exportu nikdy nespustí proxy a nikdy nevolá model. Spusťte `omniglyph export --help` pro seznam všech přepínačů.

# 🧭 Poctivá část

- **Je to ztrátové.** Přesné vybavení dat na úrovni bajtů z obrázků je ze své podstaty nespolehlivé. Zavedené zmírnění: přesné identifikátory cestují jako text vedle obrázku a změřená produkční konfigurace vyprodukovala **nula tichých konfabulací** — neúspěšná čtení se zdrží.
- **Dnes je schválen pouze Fable 5**, s doklady. GPT-5.5 a Gemini 2.5-flash měřitelně neumí přečíst husté rendery; Opus 4.8 potřebuje 4× větší glyfy. Toto gate vynucuje.
- **Našli jsme a vyhnuli se billingové pasti**: vysokorozlišovací úroveň obrázku účtuje 3,3× více za stránku, ale vizuální enkodér tu extra rozlišovací schopnost nedostává — větší stránky se čtou *hůř*. Změřeno, zdokumentováno v [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), nezapnuto.
- Ceny se mění; trvalou metrikou je snížení tokenů, které proxy loguje za každý request oproti bezplatnému kontrafaktuálu `count_tokens`.

# 🧠 Časté dotazy

**Je těch 59–70 % z konce do konce, nebo jen na requestech, kterých se to týkalo?**
Z konce do konce — celý účet. Většina kompresních nástrojů reportuje úspory jen na části, které se dotkly, což číslo přikrášlí. Náš jmenovatel je *každý* request: malé, které gate správně nechal netknuté, všechny zápisy a čtení cache a všechny výstupní tokeny (které proxy nikdy nekomprimuje). Číslo jen za komprimované requesty vychází vyšší a uvádí se odděleně, nikdy jako hlavní tvrzení.

**Jak se úspora měří?**
Obě strany téhož requestu, ve stejném okamžiku. Pro každý `/v1/messages` POST proxy vypálí bezplatnou sondu `count_tokens` na původní nekomprimované tělo (kontrafaktuál) paralelně se skutečným forwardem a přečte skutečně účtovaný usage blok z odpovědi poskytovatele — obojí skončí ve stejném řádku eventu. Cachovací ceny se aplikují na obě strany stejně, takže se sleva za cache vyruší a nemůže se dvakrát započítat jako „úspora". Vzorec žije v `src/core/baseline.ts`; odvoďte si ho znovu z vlastního logu eventů.

**Proč by měl být neúspěch konfabulací, a ne chybou čtení?**
Protože vidění modelu není OCR: stránka se stane patch embeddingy, nikdy diskrétními znaky, takže neexistuje jistota na úrovni jednotlivého glyfu, na které by mohlo hlasitě selhat — když pixely glyf nedourčí, jazykový prior mezeru zaplní něčím věrohodným. Přesně kvůli tomuto mechanismu je OmniGlyph vůči tomu fail-closed: hodnoty přesné na bajt vždy cestují jako text vedle obrázku, modely, které čtou špatně, blokuje gate, a změřená produkční konfigurace vyprodukovala **nula** tichých konfabulací v ~300 čtecích testech — neúspěšná čtení se zdrží.

**Co práce přesná na bajt (hashe, ID, tajemství)?**
Nedávné tahy a přesné identifikátory zůstávají textem záměrně. Pro zátěže, které jsou *celé* přesné na bajt, je nasměrujte na model mimo allowlist (např. subagenta na jiném modelu Claude) — cokoli mimo allowlist prochází beze změny, bajt po bajtu.

**Nevyřešil DeepSeek-OCR, jestli tohle funguje?**
Dokázal, že funguje *kanál* — s párem enkodér/dekodér natrénovaným přímo na tuto úlohu. Skepse pochází z doby, kdy žádný běžný produkční model neuměl přečíst husté rendery; to se změnilo a [skóre podle modelu](../../../README.md#-the-numbers--measured-not-estimated) výše ukazuje přesně, kdo je dnes umí přečíst, s doklady. [Harness benchmarků](../../../benchmarks/README.md) jedním příkazem přetestuje jakýkoli nový model — gate se řídí daty, ne hypem.

**Mohu to použít bez Claude Code — Cursor, ChatGPT, prostá roura?**
Ano, dvěma způsoby. Jako **proxy** to funguje s libovolným klientem, který umožňuje nastavit základní API URL (`ANTHROPIC_BASE_URL` nebo základní URL OpenAI) — Claude Code, vaše vlastní skripty, cokoli přes HTTP. A pro nástroje, které proxy nepodporují, **Offline export** výše vykreslí kontext do PNG stránek, které vložíte ručně — `omniglyph export --stdin` dokonce čte přímo z Unixové roury.

**Jak vlastně mění text na obrázek?**
Přeformátuje text a vykreslí jej 1bitovou 5×8pixelovou atlasovou mřížkou glyfů na husté PNG stránky 1568×728 — jeden bit na pixel, žádné vyhlazování, takže model účtuje stránku podle jejích rozměrů, ne podle toho, kolik znaků je uvnitř. **Jak to funguje** výše popisuje pipeline; dokument s benchmarky obsahuje geometrii a to, proč hustší není vždy levnější.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Poděkování

OmniGlyph stojí na ramenou jednoho projektu obzvlášť — tato část je naše trvalé poděkování.

| Projekt | Jak ovlivnil OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Objev, na kterém celý tento projekt stojí.** pxpipe s doklady prokázal, že vizuální kanál produkčního LLM dokáže nést hustý textový kontext za zlomek ceny v tokenech — a že o konverzi se musí rozhodovat per-request na základě přesné billingové matematiky, nikdy podle pocitu. Husté 1bitové vykreslování, gate ziskovosti, kontrafaktuál `count_tokens`, fail-closed allowlist modelů i kultura dokumentace „změř, než něco tvrdíš" — to vše tam vzniklo jako první. OmniGlyph přímo vychází z toho kódu (MIT — původní řádek copyrightu zůstává v naší [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Rodina 5×8 bitmapových fontů, ze které vychází naše hustá 1bitová atlasová mřížka glyfů (licence v `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Pokrytí glyfů mimo rozsah Spleen ve stejné atlasové mřížce (licence v `assets/`). |

Pokud vám OmniGlyph přijde užitečný, dejte hvězdičku i upstreamu — objev je jejich. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licence

MIT — viz [LICENSE](../../../LICENSE).
