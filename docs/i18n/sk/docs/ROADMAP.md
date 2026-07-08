# Plán forku — „náš OmniGlyph" + integrácia s OmniRoute

Konsolidovaný pracovný plán (2026-07-05) z: nameraného billing sweepu,
auditu OpenAI/Gemini oproti oficiálnej dokumentácii, analýzy súvisiacich
nástrojov a harnessu density-frontier. Stav každej položky: ☐ čaká · ◐
čiastočné · ☑ hotové tu.

## Fáza 0 — Základ merania (HOTOVÉ v tomto repozitári)

- ☑ Presné účtovanie Anthropic (28px záplaty, 2 úrovne, +4/blok) —
  `src/core/anthropic-vision.ts`, sweep v `benchmarks/billing-sweep/`.
- ☑ Brána ziskovosti s presnými nákladmi (nahradila w·h/750 × 1,10).
- ☑ Geometria na úroveň: Fable/Opus 4.8/Sonnet 5 → stránky 1928×1928 (3,3×
  menej obrázkov); štandard → 1568×728. 691 testov zelených.
- ☑ Harness `benchmarks/density-frontier/` (offline náklady × presnosť cez
  API, ihly so zameniteľnými distraktormi, deterministické hodnotenie).

## Fáza 1 — Opravy účtovania viacerých poskytovateľov (chyby potvrdené auditom)

Priorita nastavená auditom (oficiálna dokumentácia zachytená 2026-07-05):

1. ☐ **D2 (OBRÁTENÁ brána)**: `gpt-4o-mini` spadá do predvolenej dlaždice
   85/170, ale stojí **2833 základ / 5667 na dlaždicu** (~33× podhodnotené,
   ~0,8 znaku/token) — obrázkovanie na ňom je vždy strata a brána ho
   schvaľuje. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` sa posiela bezpodmienečne
   (`src/core/openai.ts:392,402`), ale existuje iba v gpt-5.4+; odvodiť z
   profilu.
3. ☐ **D1**: multiplikátor `o4-mini` 1,62 → **1,72** (podhodnocuje o 5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` sú
   v patch bucket **strop 1536 bez `original`** (kód predpokladá 10000);
   `gpt-5-codex-mini` je v nesprávnom režime (dlaždica → patch).
5. ☐ **Geometria GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (zosúlaďuje s OBOMA
   režimami: 64×32 záplat a 4×512 dlaždíc; +6,25 % znakov navyše zadarmo).
   Dedikovaný profil `original` 5.4/5.5: až 1568×5984 (9 163 záplat ≤ 10k,
   ~233 tis. znakov v jednom bloku) — najprv A/B test čitateľnosti.
6. ☐ **Podpora Gemini** (nová): `src/core/gemini.ts` +
   `gemini-model-profiles.ts` + cesty `:generateContent`/
   `:streamGenerateContent` v proxy. Zdokumentovateľná geometria:
   **1152×1536 (presná jednotka orezu 768, 4 dlaždice, 42,2 znaku/token —
   najlepší zdokumentovaný pomer z 3 poskytovateľov)**; stávky na
   kalibráciu: 768² s `media_resolution:MEDIUM` (56,4) a Gemini 3 HIGH.
   Pozor: kompatibilný endpoint OpenAI od Gemini by prešiel cez
   transformer OpenAI so zlým účtovaním.

## Fáza 2 — Kvalita čítania (harness density-frontier ako rozhodca)

- ◐ Rozhodujúci A/B test std vs high-res na Fable (beží; hranica: gist ==
  text A nulové tiché-zlé A úspory > 0).
- ☐ Vyriešiť rozpor AA vs 1-bit na hustej ceste (kód hovorí „iba pre eval",
  produkcia používa AA).
- ☐ (ODLOŽENÉ s odôvodnením 2026-07-06) Chirurgia glyfov: produkčná
  konfigurácia číta 30/30 — dnes neexistuje merateľný neúspech, ktorý by
  chirurgia mala opraviť. Prehodnotiť, ak sa do rozsahu dostane cieľ pod
  100 % (napr. Opus) alebo ak nové merania ukážu regresiu.
- ☑ ~~A/B test svetlej témy~~ VYRIEŠENÉ inšpekciou (2026-07-06): render UŽ
  JE čierny na bielom (render.ts:635/822, inverzia po blitovaní) —
  zosúladené s literatúrou; hypotéza sa zrodila zo zlej premisy (upstream
  ukážkový obrázok).
- ☐ Zoznam slov s kontrolným súčtom pre presné ID na úrovni bajtov
  (upstream #38, schválené) + banner zdržania sa (#31/#32) + camelCase vo
  factsheete (#33/#34).
- ☑ Port #45: `$schema/$id` zachované, n-tice odstránené pre každý prvok
  (commit na main).
- ☑ Opakovanie pri odmietnutí (#37/H11): sniffer bezstratového prehrania +
  jedno opakovanie s pôvodným telom; telemetria `refusalRetried` (commit na
  main).
- ☐ Nástroj na rehydratáciu (`RecoverableBlock` → volateľný nástroj;
  LensVLM validuje selektívnu opätovnú expanziu).

## Fáza 3 — Výkon/robustnosť

- ☐ LRU render cache (deterministický podľa invariantu; slab + zamrznuté
  chunky sa dnes renderujú znova pri každej požiadavke).
- ☐ PNG kódovanie vo worker vlákne; konfigurovateľná úroveň deflate.
- ☐ Portovať otvorené upstream opravy: #44 (typované natívne nástroje →
  400), #45 (schema-strip draft-07 → 400 slučka), #42 (CONNECT proxy pre
  Claude Desktop), #19 (dvojité účtovanie popisov GPT).
- ☐ Implementovať ADAPTIVE_CPT_PLAN (cpt na rolu bloku; reálny slab =
  1,50).

## Fáza 4 — Samotný fork

- ☐ Vlastný názov/repozitár (rozhodnutie Diega) + upstream `git remote` pre
  cherry-picky.
- ☐ **TS všade**: jadro je už TS; konvertovať `eval/*.mjs`, `demo/`,
  `scripts/*.mjs`, `bench/` (vzor: tsx + vitest; `benchmarks/density-frontier/`
  takto vznikol).
- ☐ Štandard kvality OmniRoute: eslint 9 + prettier, CI s
  typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n
  (najprv pt-BR), sémantický CHANGELOG.
- ☐ **GIF-y namiesto videí** v README (nahrať pomocou vhs/asciinema+agg;
  vedľa seba plain vs proxy).
- ☐ Dashboard v2 (reimplementovať cez HTTP API — nededit kód tretej
  strany): launcher „otvor terminál s ANTHROPIC_BASE_URL", kontrola „ide
  cez mňa premávka?", inšpektor obrázok-vs-text, sessions, panel nákladov v
  mene, ľahké i18n, SSE namiesto pollingu, perzistencia SQLite s retenciou
  (jej 24-stĺpcová schéma je dobrým východiskovým bodom).
- ☐ Mikronápady z dense-image-gen: režim `lines` (rozloženie zachované pre
  kód/tabuľky), `--keep-ws`, titulok pôvodu na stránku ("systémový prompt" /
  "dokumentácia nástrojov" / "kolo histórie N"), samostatné CLI
  `render subor.md -o out.png`.

## Fáza 5 — Port do OmniRoute

- ☐ Engine `CompressionEngine` (šablóna `cavemanAdapter.ts`), registrovaný v
  `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`,
  `applyAsync`.
- ☐ Prepojenie: predať `supportsVision` v `chatCore.ts:1297` (1 riadok)
  alebo vyriešiť cez `isVisionModelId`.
- ☐ Poradie zásobníka: posledný (RTK/Caveman/sémantické renderery najprv;
  OmniGlyph obrázkuje zvyšok).
- ☐ Invarianty: nikdy neprepisovať bloky s klientskym `cache_control`
  (lekcia #4560); brána vernosti (#5127) potrebuje deklarovanú výnimku
  alebo textový factsheet, ktorý spĺňa invarianty; telemetria pokusov so
  `skip_reason` (lekcia #4268).
- ☐ Smerovanie: fallback/opakovanie po enginu musí rešpektovať schopnosť
  vízie a allowlist (opätovná kompresia alebo obídenie).
- ☐ Synergia s CCR: `emitRecoverable` → úložisko CCR s načítaním po
  úsekoch (`head/tail/grep`, #5187) = plná selektívna opätovná expanzia.
- ☐ Naťahovanie bezplatnej úrovne ako marketingová vlastnosť: každý token
  bezplatnej úrovne prináša ~2-3× viac znakov na vizuálnych modeloch;
  bezplatná úroveň Gemini + geometria 1152×1536 je najsilnejší prípad.

## Otvorené riziká

- Odmietnutia Fable po redeploji v obrázkovanom kontexte (upstream #37) —
  zmierniť pred predvoleným zapnutím v OmniRoute.
- Cenová arbitráž: ak Anthropic prehodnotí ceny vízie, úspory sa zmenia —
  kontrafaktuál na požiadavku (`count_tokens`) je obranou.
- OpenAI: komunitné meranie (PageWatch) zaznamenalo nárast tokenov
  dokončenia a 2× latenciu — merať na poskytovateľa pred zapnutím.

## Výsledky A/B testu 2026-07-05 (cez OpenRouter — NEPRESVEDČIVÉ pre geometriu, platné pre režimy zlyhania)

| konfigurácia | verbatim | zdrž. | filtrované | tiché-zlé |
|---|---|---|---|---|
| fable std 5×8 (AA aj 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predikované) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predikované) |
| opus hires 10×16 | **7/9 čítaní** | 0 | 21 mimo kreditov | 2 (číslica) |

Platné zistenia: (1) klasifikátor (issue #37) je DOMINANTNÝ režim zlyhania
pre otázky prepisu na štandardnej stránke — 100 % filtrované — a nespúšťa
sa na veľkej stránke; formulácia je dôležitá. (2) Zdržanie sa funguje: 20×
ILEGIVEL oproti 5 konfabuláciám na veľkej stránke. (3) Opus pri 10×16 číta
78 % presne (n=9) oproti 0 % historicky pri 5×8 — prvý priamy dôkaz kolena.
(4) Nečitateľnosť veľkej stránky cez OpenRouter naznačuje transportný
RESAMPLE (Bedrock/Vertex štandardná úroveň?) — rozhodujúca hypotéza na
otestovanie na priamom API Anthropicu; A/B test geometrie zostáva OTVORENÝ
dovtedy. Kredity OpenRouter sa minuli uprostred ramena Opus.

## Finálna matica 2×2 (2026-07-05, cez CLI/subscription, Fable 5, n=30/rameno)

| stránka × atlas | 1-bit | AA |
|---|---|---|
| štandard 1568×728 | **30/30 (100 %)** | 25/30 + 5 zdrž. |
| high-res 1928×1928 | **20/30 (67 %)** + 10 zdrž. | 0/30 + 29 zdrž. |

Nulová konfabulácia naprieč 4 ramenami (120 otázok — každý neúspech bol
ILEGIVEL). APLIKOVANÉ: DENSE_RENDER_STYLE prepnuté na 1-bit (aa:false) s
pripnutím v tests/dense-style.test.ts. Opus 4.8: 26/30 pri 10×16 na veľkej
stránke, 30/30 ILEGIVEL pri 5×8 — bezpečný režim Opus je životaschopný.
Veľká stránka zostáva degradovaná transportami (CLI Read/OpenRouter
resample); verdikt o WYSIWYG geometrii stále závisí od priameho API.
