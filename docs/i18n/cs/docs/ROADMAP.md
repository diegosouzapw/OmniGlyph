# Roadmapa forku — „náš OmniGlyph" + integrace s OmniRoute

Konsolidovaný pracovní plán (2026-07-05) z: změřeného billing sweep,
auditu OpenAI/Gemini oproti oficiální dokumentaci, analýzy souvisejících
nástrojů a harness density-frontier. Stav každé položky: ☐ čeká · ◐ částečně · ☑ hotovo zde.

## Fáze 0 — Základ měření (HOTOVO v tomto repozitáři)

- ☑ Přesný billing Anthropic (28px patche, 2 úrovně, +4/blok) — `src/core/anthropic-vision.ts`, sweep v `benchmarks/billing-sweep/`.
- ☑ Gate ziskovosti s přesnými náklady (nahradil w·h/750 × 1,10).
- ☑ Geometrie po úrovních: Fable/Opus 4.8/Sonnet 5 → stránky 1928×1928 (3,3× méně obrázků); standard → 1568×728. 691 zelených testů.
- ☑ Harness `benchmarks/density-frontier/` (offline náklady × přesnost přes API, jehly s matoucími distraktory, deterministické skórování).

## Fáze 1 — Opravy billingu pro více poskytovatelů (chyby potvrzené v auditu)

Priorita stanovená auditem (oficiální dokumentace zachycena 2026-07-05):

1. ☐ **D2 (OBRÁCENÝ gate)**: `gpt-4o-mini` spadá do výchozí dlaždice 85/170, ale stojí **2833 základ / 5667 na dlaždici** (~33× podhodnoceno, ~0,8 znak/token) — vykreslování na něm je vždy ztráta a gate ho schvaluje. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` se posílá bezpodmínečně (`src/core/openai.ts:392,402`), ale existuje jen od gpt-5.4+; odvoďte to z profilu.
3. ☐ **D1**: `o4-mini` multiplikátor 1,62 → **1,72** (podhodnocuje o 5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` jsou v patch bucketu **cap 1536 bez `original`** (kód předpokládá 10000); `gpt-5-codex-mini` je ve špatném režimu (dlaždice → patch).
5. ☐ **Geometrie GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (sladí se s OBĚMA režimy: 64×32 patchů a 4×512 dlaždic; +6,25 % znaků zdarma). Vyhrazený profil `original` pro 5.4/5.5: až 1568×5984 (9 163 patchů ≤ 10k, ~233k znaků v jednom bloku) — nejprve A/B test čitelnosti.
6. ☐ **Podpora Gemini** (nové): `src/core/gemini.ts` + `gemini-model-profiles.ts` + trasy `:generateContent`/`:streamGenerateContent` v proxy. Zdokumentovatelná geometrie: **1152×1536 (přesná jednotka ořezu 768, 4 dlaždice, 42,2 znaků/token — nejlepší zdokumentovaný poměr ze 3 poskytovatelů)**; sázky ke kalibraci: 768² s `media_resolution:MEDIUM` (56,4) a Gemini 3 HIGH. Pozor: kompatibilní OpenAI endpoint Gemini by procházel transformerem OpenAI se špatným billingem.

## Fáze 2 — Kvalita čtení (harness density-frontier jako soudce)

- ◐ Rozhodující A/B std vs. high-res na Fable (probíhá; laťka: gist == text A ZÁROVEŇ nula tichých chyb A ZÁROVEŇ úspory > 0).
- ☐ Vyřešit rozpor AA vs. 1bit v husté cestě (kód říká „pouze pro eval", produkce používá AA).
- ☐ (ODLOŽENO s odůvodněním 2026-07-06) Chirurgie glyfů: produkční konfigurace čte 30/30 — dnes není měřitelný neúspěch, který by tato chirurgie opravovala. Znovu zvážit, pokud vstoupí do rozsahu cíl pod 100 % (např. Opus) nebo pokud nová měření ukáží regresi.
- ☑ ~~A/B světlého tématu~~ VYŘEŠENO inspekcí (2026-07-06): render UŽ JE černý na bílém (render.ts:635/822, invert po blitu) — v souladu s literaturou; hypotéza vznikla ze špatné premisy (upstream ukázkový obrázek).
- ☐ Slovník s kontrolním součtem pro ID přesná na bajt (upstream #38, schváleno) + banner zdržení se (#31/#32) + camelCase ve factsheetu (#33/#34).
- ☑ Port #45: $schema/$id zachovány, n-tice odstraněny po prvcích (commit v main).
- ☑ Opakování při odmítnutí (#37/H11): bezeztrátový replay sniffer + jediné opakování s původním tělem; telemetrie refusalRetried (commit v main).
- ☐ Nástroj rehydratace (`RecoverableBlock` → volatelný nástroj; LensVLM validuje selektivní zpětné rozbalení).

## Fáze 3 — Výkon/robustnost

- ☐ LRU cache renderů (deterministická podle invariantu; slab + zmrazené chunky se dnes znovu vykreslují při každém requestu).
- ☐ PNG kódování ve worker threadu; konfigurovatelná úroveň deflate.
- ☐ Portovat otevřené upstream opravy: #44 (typované nativní nástroje → 400), #45 (schema-strip draft-07 → smyčka 400), #42 (CONNECT proxy pro Claude Desktop), #19 (dvojité účtování popisů GPT).
- ☐ Implementovat ADAPTIVE_CPT_PLAN (cpt podle role bloku; skutečný slab = 1,50).

## Fáze 4 — Samotný fork

- ☐ Vlastní název/repozitář (rozhodnutí Diega) + upstream `git remote` pro cherry-picky.
- ☐ **TS všude**: jádro je už TS, převést `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (vzor: tsx + vitest; `benchmarks/density-frontier/` takto vznikl).
- ☐ Standard kvality OmniRoute: eslint 9 + prettier, CI s typecheck/test/build/link-check, CONTRIBUTING, SECURITY, i18n README (nejprve pt-BR), sémantický CHANGELOG.
- ☐ **GIFy místo videí** v READMEs (nahrávat pomocí vhs/asciinema+agg; vedle sebe holý vs. proxy).
- ☐ Dashboard v2 (znovu implementovat přes HTTP API — nedědit kód třetích stran): launcher „otevřít terminál s ANTHROPIC_BASE_URL", kontrola „prochází provoz přese mě?", inspektor obrázek-vs-text, relace, panel nákladů v měně, lehké i18n, SSE místo pollingu, perzistence SQLite s retencí (jeho 24sloupcové schéma je dobrý výchozí bod).
- ☐ Mikro-nápady z dense-image-gen: režim `lines` (zachovaný layout pro kód/tabulky), `--keep-ws`, název původu na stránku ("system prompt" / "tool docs" / "history turn N"), samostatné CLI `render soubor.md -o out.png`.

## Fáze 5 — Port do OmniRoute

- ☐ Engine `CompressionEngine` (šablona `cavemanAdapter.ts`), registrovaný v `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Propojení: předat `supportsVision` v `chatCore.ts:1297` (1 řádek) nebo vyřešit přes `isVisionModelId`.
- ☐ Pořadí stacku: poslední (nejprve RTK/Caveman/sémantické renderery; OmniGlyph zobrazuje jako obrázek zbytek).
- ☐ Invarianty: nikdy nepřepisovat bloky s klientovým `cache_control` (poučení #4560); gate věrnosti (#5127) potřebuje deklarovanou výjimku nebo textový factsheet, který splňuje invarianty; telemetrie pokusů se `skip_reason` (poučení #4268).
- ☐ Routing: post-engine fallback/retry musí respektovat schopnost vidění a allowlist (re-komprimovat nebo obejít).
- ☐ Synergie CCR: `emitRecoverable` → úložiště CCR s načtením po částech (`head/tail/grep`, #5187) = plné selektivní zpětné rozbalení.
- ☐ Prodloužení free tieru jako marketingová funkce: každý token free tieru přinese ~2-3× více znaků na vision modelech; free tier Gemini + geometrie 1152×1536 je nejsilnější případ.

## Otevřená rizika

- Odmítnutí Fable po redeploy v zobrazeném kontextu (upstream #37) — zmírnit před výchozím zapnutím v OmniRoute.
- Cenová arbitráž: pokud Anthropic přecení vision, úspory se změní — kontrafaktuál na jeden request (`count_tokens`) je obranou.
- OpenAI: měření komunity (PageWatch) vidělo nárůst completion tokenů a 2× latenci — měřit podle poskytovatele před zapnutím.

## Výsledky A/B 2026-07-05 (přes OpenRouter — NEPRŮKAZNÉ pro geometrii, platné pro režimy selhání)

| konfigurace | doslovné | zdrž. | filtrováno | tiše-špatně |
|---|---|---|---|---|
| fable std 5×8 (AA i 1bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predikováno) |
| fable hires 5×8 (1bit) | 0/30 | 20 | 1 | 4 (2 predikováno) |
| opus hires 10×16 | **7/9 přečteno** | 0 | 21 došel kredit | 2 (číslice) |

Platná zjištění: (1) klasifikátor (issue #37) je DOMINANTNÍ režim selhání pro
otázky na přepis na standardní stránce — 100 % filtrováno — a nespouští se na
velké stránce; na formulaci záleží. (2) Zdržení se funguje: 20× ILEGIVEL vs.
5 konfabulací na velké stránce. (3) Opus při 10×16 čte 78 % přesně (n=9) vs.
0 % historicky při 5×8 — první přímý důkaz zlomu (knee). (4) Nečitelnost
velké stránky přes OpenRouter naznačuje transportní RESAMPLE (Bedrock/Vertex
standardní úroveň?) — rozhodující hypotéza k otestování na přímém API
Anthropicu; A/B geometrie zůstává OTEVŘENÉ do té doby. Kredity OpenRouter
došly uprostřed ramene Opus.

## Finální matice 2×2 (2026-07-05, přes CLI/předplatné, Fable 5, n=30/rameno)

| stránka × atlas | 1bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 zdrž. |
| high-res 1928×1928 | **20/30 (67 %)** + 10 zdrž. | 0/30 + 29 zdrž. |

Nulová konfabulace napříč 4 rameny (120 otázek — každý neúspěch byl
ILEGIVEL). APLIKOVÁNO: DENSE_RENDER_STYLE přepnuto na 1bit (aa:false) s
pinem v tests/dense-style.test.ts. Opus 4.8: 26/30 při 10×16 na velké
stránce, 30/30 ILEGIVEL při 5×8 — bezpečný režim Opus je životaschopný.
Velká stránka zůstává degradovaná transporty (CLI Read/OpenRouter resample);
verdikt WYSIWYG geometrie stále závisí na přímém API.
