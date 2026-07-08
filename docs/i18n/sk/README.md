🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontext ako obrázok

### Znížte svoj účet za Claude o **59 – 70 %** tak, že objemný kontext vykreslíte ako husté PNG stránky — ten istý obsah, za zlomok tokenov.

**Modely účtujú text po tokenoch, ale obrázok účtujú podľa jeho rozmerov — nie podľa toho, koľko textu je vnútri.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Súčasť rodiny [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Všetky jazyky](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| metrika | výsledok | dôkaz |
|---|---|---|
| Zníženie účtu end-to-end | **59 – 70 %** | produkčná stopa, 13 709 požiadaviek |
| Tokeny na konvertovaný blok | **10× menej** (28 080 znakov: 14 040 → 1 460 tokenov) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Presnosť účtovacieho vzorca | rezíduum **nula** naprieč 22 sondami `count_tokens`, 2 modely × 2 úrovne | `benchmarks/billing-sweep/results/` |
| Presnosť presného čítania, produkčná konfigurácia | **30/30 (100 %)** na Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Tiché konfabulácie v ~300 sondách čítania | **0** — každý neúspech sa zdrží ako `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Skóre modelov** (dokáže čítať husté rendery? n=30 na skupinu, deterministické hodnotenie):

| model | čítanie | verdikt |
|---|---|---|
| Claude **Fable 5** | **100 %** presne | ✅ produkčný cieľ |
| Claude Opus 4.8 | 77 – 87 % pri 4× veľkosti glyfov | ⚠️ voliteľný bezpečný režim (úspory klesnú na ~2×) |
| GPT-5.5 | 0/60 — a nafukuje svoje odpovede ~40× pri snahe | ❌ zablokované bránou, s dôkazom |
| Gemini 2.5-flash | 0/26 — a namiesto zdržania sa konfabuluje | ❌ zablokované (čiastočný test, obmedzené kvótou) |

Výhoda je **dnes špecifická pre Fable** — ostatné vizuálne enkodéry zatiaľ nedokážu rozlíšiť husté glyfy. [Benchmarkový harness](benchmarks/README.md) otestuje akýkoľvek nový model jedným príkazom.

# 🤔 Prečo OmniGlyph?

Každá dlhotrvajúca agentská session ťahá na každej požiadavke tú istú mŕtvu váhu: systémový prompt, dokumentáciu nástrojov a starú históriu — preúčtovanú za token, každé kolo. OmniGlyph je **lokálny proxy**, ktorý tieto objemné časti prepíše na husté PNG stránky *predtým, než opustia váš počítač*:

- **Presná účtovacia matematika, nie heuristiky** — počíta reálny vzorec poskytovateľa pre tokeny obrázka (meraný na nulové rezíduum) a konvertuje iba vtedy, keď matematika vyhráva.
- **Fail-closed dizajn** — modely, ktoré nedokážu čítať husté rendery, blokuje brána, s benchmarkovými dôkazmi. Žiadna tichá strata kvality.
- **Súkromné a lokálne-first** — prepis sa deje na `127.0.0.1`; nič navyše sa nikam neposiela.
- **Reprodukovateľné** — každé číslo vyššie má dôkaz v `benchmarks/*/results/`, opätovne spustiteľný jedným príkazom.

# ⚡ Rýchly štart

```bash
npx omniglyph                                     # proxy na 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # nasmerujte naň Claude Code
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Funguje oboma spôsobmi:
- **API kľúč** (platba za token): váš účet klesne o 59 – 70 % end-to-end.
- **Predplatiteľská session**: neplatíte menej, ale limity používania sa počítajú v tokenoch — takže vaše limity sa natiahnu **~2 – 3×**.

Dashboard na <http://127.0.0.1:47821/>: ušetrené tokeny, každá konverzia text→obrázok vedľa seba, vypínač, živé čipy modelov. Odpovede prúdia normálne — komprimuje sa iba *požiadavka*, nikdy výstup modelu.

# ⚙️ Ako to funguje

```
objemný blok požiadavky ──► brána ziskovosti ──► reflow + render (1-bitová 5×8 atlasová mriežka)
                       (presná účtovacia matematika)     ──► 1568×728 PNG stránky ──► spätné zošitie, priateľské k cache
```

- **Účtovanie sa počíta presne, pred konverziou**: Anthropic účtuje `⌈w/28⌉ × ⌈h/28⌉ + 4` tokenov na obrázok (28 px záplaty — merané na nulové rezíduum). Celá stránka nesie 28 080 znakov za 1 460 tokenov ≈ **19 znakov/token**, oproti ~2 znakom/token pri hustom texte. Brána konvertuje iba vtedy, keď matematika vyhráva.
- **Čo sa konvertuje**: statický systémový prompt + dokumentácia nástrojov, stará zbalená história, veľké výstupy nástrojov.
- **Čo sa nikdy nekonvertuje**: vaše správy, nedávne kolá, výstup modelu, riedka próza, hodnoty na úrovni bajtov (hashe/ID cestujú popri texte), a akýkoľvek model, ktorý neprešiel benchmarkom čítania.

# 📚 Použitie ako knižnica (bez proxy)

Všetko, čo proxy robí pri každej požiadavke, je zároveň zdokumentované, importovateľné API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Vykreslite ľubovoľný text do hustých 1-bitových PNG stránok
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Alebo si sami spustite celú transformáciu požiadavky — brána, presná účtovacia matematika a všetko
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // surové telo JSON /v1/messages
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` pripne bloky ako text; `options.emitRecoverable` vráti originály obrázkových blokov. Presná účtovacia matematika sa dodáva aj v koreni balíka (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — presne to používa [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Čistý JS runtime (Node aj edge/Workers). Celé rozhranie: `src/core/index.ts`.

# 🧭 The honest part

- **Je to stratové.** Presné čítanie na úrovni bajtov z obrázkov je zo svojej podstaty nespoľahlivé. Nasadené zmierňovania: presné identifikátory cestujú ako text vedľa obrázka a meraná produkčná konfigurácia priniesla **nulové tiché konfabulácie** — neúspešné čítania sa zdržia.
- **Dnes je schválený iba Fable 5**, s dôkazmi. GPT-5.5 a Gemini 2.5-flash merateľne nedokážu čítať husté rendery; Opus 4.8 potrebuje 4× väčšie glyfy. Brána toto vynucuje.
- **Našli a vyhli sme sa účtovacej pasci**: vysokorozlišovacia úroveň obrázka účtuje 3,3× viac za stránku, ale vizuálny enkodér nedostáva navyše rozlíšenie — väčšie stránky sa čítajú *horšie*. Merané, zdokumentované v [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), nenasadené.
- Ceny sa menia; trvalá metrika je zníženie tokenov, ktoré proxy loguje na požiadavku oproti bezplatnému kontrafaktuálu `count_tokens`.

# 🧠 FAQ

**Je tých 59 – 70 % end-to-end, alebo len na požiadavkách, ktorých sa to dotklo?**
End-to-end — celý účet. Väčšina kompresných nástrojov vykazuje úspory iba na časti, ktorej sa dotkli, čo číslo skresľuje v ich prospech. Náš menovateľ je *každá* požiadavka: tie malé, ktoré brána správne nechala nedotknuté, všetky zápisy a čítania z cache a všetky výstupné tokeny (ktoré proxy nikdy nekomprimuje). Číslo počítané iba z komprimovanej časti vychádza vyššie a uvádza sa samostatne, nikdy ako hlavné číslo.

**Ako sa meria úspora?**
Obe strany tej istej požiadavky, v tom istom okamihu. Pri každom POST na `/v1/messages` proxy vypáli bezplatnú sondu `count_tokens` na pôvodné nekomprimované telo (kontrafaktuál) paralelne so skutočným presmerovaním a načíta zo skutočnej odpovede blok použitia, ktorý účtoval poskytovateľ — oboje pristane v tom istom riadku udalosti. Cenotvorba cache sa uplatňuje identicky na oboch stranách, takže zľava za cache sa vyruší a nedá sa dvojito započítať ako „úspora“. Vzorec je v `src/core/baseline.ts`; odvoďte si ho znova z vlastného logu udalostí.

**Prečo by mal byť neúspech konfabuláciou namiesto chyby čítania?**
Pretože vizuálny modul modelu nie je OCR: stránka sa zmení na embeddingy záplat, nikdy na diskrétne znaky, takže neexistuje miera istoty na úrovni glyfu, na ktorej by mohlo čítanie nahlas zlyhať — keď pixely nedostatočne určujú glyf, jazykový prior doplní medzeru niečím pravdepodobným. Presne kvôli tomuto mechanizmu je OmniGlyph v tomto ohľade fail-closed: hodnoty na úrovni bajtov vždy cestujú ako text vedľa obrázka, modely, ktoré čítajú nesprávne, blokuje brána, a meraná produkčná konfigurácia priniesla **nulové** tiché konfabulácie v ~300 sondách čítania — neúspešné čítania sa zdržia.

**Čo s prácou na úrovni bajtov (hashe, ID, tajomstvá)?**
Nedávne kolá a presné identifikátory ostávajú textom podľa dizajnu. Pre záťaže, ktoré sú *celé* na úrovni bajtov, ich smerujte na model mimo zoznamu povolených (napr. subagenta na inom modeli Claude) — čokoľvek mimo zoznamu povolených prechádza bajtovo identické, nedotknuté.

**Nevyriešil DeepSeek-OCR už otázku, či to funguje?**
Dokázal, že *kanál* funguje — s párom enkodér/dekodér natrénovaným presne na túto úlohu. Skepticizmus pochádza z obdobia, keď žiadny bežný produkčný model nevedel čítať husté rendery; to sa zmenilo a [skóre modelov](../../../README.md#-the-numbers--measured-not-estimated) vyššie presne ukazuje, kto ich dnes dokáže čítať, s dôkazmi. [Benchmarkový harness](../../../benchmarks/README.md) otestuje akýkoľvek nový model jedným príkazom — brána sa riadi dátami, nie hype.

# 🔬 Zreprodukujte každé číslo

```bash
pnpm install && pnpm test                                     # celá sada
node benchmarks/billing-sweep/run.mjs --dry-run               # predikcie účtovania, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabuľka nákladov, $0
# s kľúčmi: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (alebo --via-cli pre predplatiteľskú session Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Kompletná metodika a všetky tabuľky výsledkov: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Surové dôkazy po jednotlivých odpovediach: `benchmarks/*/results/*.jsonl`.

# 🚀 Rodina OmniRoute

OmniGlyph sa tiež dodáva ako **natívny kompresný engine vnútri [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — bezplatnej AI brány. Tam beží ako engine `omniglyph` (samostatný single mode alebo vrstvený s ostatnými enginmi), s fail-closed bránami a účtovaním tokenov s ohľadom na obrázky.

# 🛠️ Technologický stack

| vrstva | technológia |
|---|---|
| Jazyk | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderovanie | vlastná 1-bitová atlasová mriežka glyfov (odvodená zo Spleen/Unifont, licencie v `assets/`) → PNG |
| Testy | Vitest — TDD, plus stráže integrity dokumentácie a rebrandingu |
| Benchmarky | harnessy v `benchmarks/` (billing-sweep, density-frontier) s JSONL dôkazmi |

## Štruktúra projektu

| cesta | čo |
|---|---|
| `src/` | proxy: transformačný pipeline, presné účtovanie na poskytovateľa, renderer, hosty (Node + Cloudflare Workers) |
| `benchmarks/` | harnessy, ktoré vyprodukovali každé číslo vyššie — opätovne spustiteľné |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Podpora a komunita

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — chyby a požiadavky na funkcie
- 🔒 [SECURITY.md](SECURITY.md) — hlásenia zraniteľností
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — striktné TDD + meranie pred tvrdeniami
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Poďakovania

OmniGlyph stojí na pleciach jedného projektu obzvlášť — táto sekcia je naše trvalé poďakovanie.

| Projekt | Ako ovplyvnil OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Objav, na ktorom je postavený celý tento projekt.** pxpipe s dôkazmi preukázal, že vizuálny kanál produkčného LLM dokáže niesť hustý textový kontext za zlomok nákladov na tokeny — a že o konverzii sa musí rozhodovať pri každej požiadavke presnou účtovacou matematikou, nikdy podľa pocitu. Husté 1-bitové vykresľovanie, brána ziskovosti, kontrafaktuál `count_tokens`, fail-closed zoznam povolených modelov a kultúra dokumentácie „najprv zmerať, potom tvrdiť“ — to všetko tam vzniklo ako prvé. OmniGlyph priamo vychádza z tohto kódu (MIT — pôvodný riadok copyrightu ostáva v našej [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Rodina bitmapových fontov 5×8, z ktorej vychádza náš hustý 1-bitový atlas glyfov (licencia v `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Pokrytie glyfov nad rámec rozsahu Spleen v tom istom atlase (licencia v `assets/`). |

Ak vám OmniGlyph príde užitočný, dajte hviezdičku aj pôvodnému projektu — objav bol ich. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licencia

MIT — pozri [LICENSE](../../../LICENSE).
