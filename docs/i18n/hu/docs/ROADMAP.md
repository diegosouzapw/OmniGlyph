# Fork ütemterv — "a mi OmniGlyph-unk" + OmniRoute integráció

Konszolidált munkaterv (2026-07-05) forrásai: mért billing sweep,
OpenAI/Gemini audit a hivatalos dokumentáció alapján, kapcsolódó eszközök
elemzése, és a density-frontier harness. Az egyes tételek állapota: ☐ függőben · ◐ részleges · ☑ kész itt.

## 0. fázis — Mérési alapok (KÉSZ ebben a repóban)

- ☑ Pontos Anthropic számlázás (28px-es patch-ek, 2 szint, +4/blokk) — `src/core/anthropic-vision.ts`, sweep a `benchmarks/billing-sweep/`-ben.
- ☑ Nyereségességi kapu pontos költséggel (a w·h/750 × 1,10 helyettesítve).
- ☑ Szintenkénti geometria: Fable/Opus 4.8/Sonnet 5 → 1928×1928-as oldalak (3,3×-szal kevesebb kép); standard → 1568×728. 691 teszt zöld.
- ☑ `benchmarks/density-frontier/` harness (offline költség × pontosság API-n keresztül, tűk összekeverhető elterelőkkel, determinisztikus pontozás).

## 1. fázis — Több szolgáltatós számlázási javítások (az auditban megerősített hibák)

Prioritás az audit alapján (hivatalos dokumentáció rögzítve 2026-07-05-én):

1. ☐ **D2 (FORDÍTOTT kapu)**: a `gpt-4o-mini` az alapértelmezett 85/170-es csempébe esik, de a valós költsége **2833 alap / 5667 csempénként** (~33×-szal alulbecsülve, ~0,8 karakter/token) — a képesítés rajta mindig veszteséges, és a kapu mégis jóváhagyja. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: a `detail:'original'` feltétel nélkül kerül elküldésre (`src/core/openai.ts:392,402`), de csak az 5.4+ verzióknál létezik; a profilból kell levezetni.
3. ☐ **D1**: `o4-mini` szorzó 1,62 → **1,72** (5,8%-kal alulbecsül).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` a patch-bucketben van **1536-os plafonnal `original` nélkül** (a kód 10000-et feltételez); a `gpt-5-codex-mini` a rossz rezsimben van (csempe → patch).
5. ☐ **GPT geometria**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (mindkét rezsimhez illeszkedik: 64×32 patch és 4×512 csempe; +6,25% ingyenes karakter). Dedikált 5.4/5.5 `original` profil: akár 1568×5984-ig (9163 patch ≤ 10k, ~233k karakter egyetlen blokkban) — előbb olvashatósági A/B teszt.
6. ☐ **Gemini támogatás** (új): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent` útvonalak a proxyban. Dokumentálható geometria: **1152×1536 (pontos vágási egység 768, 4 csempe, 42,2 karakter/token — a 3 szolgáltató közül a legjobb dokumentált arány)**; kalibrálandó fogadások: 768² `media_resolution:MEDIUM`-mal (56,4) és Gemini 3 HIGH. Figyelem: a Gemini OpenAI-kompatibilis végpontja az OpenAI-transzformeren menne át rossz számlázással.

## 2. fázis — Olvasási minőség (density-frontier harness mint bíró)

- ◐ Döntő std vs high-res A/B a Fable-en (folyamatban; mérce: a lényeg == szöveges alapvonal ÉS nulla néma-hibás ÉS a megtakarítás > 0).
- ☐ Az AA vs 1-bit ellentmondás feloldása a sűrű útvonalban (a kód azt mondja "csak-eval", az élesben AA fut).
- ☐ (HALASZTVA indoklással 2026-07-06) Glif-sebészet: az éles konfiguráció 30/30-at olvas — nincs mérhető hibás olvasás, amit a sebészetnek ma javítania kellene. Újratárgyalandó, ha egy 100% alatti cél kerül a hatókörbe (pl. Opus), vagy ha új mérések regressziót mutatnak.
- ☑ ~~Világos téma A/B~~ MEGOLDVA vizsgálattal (2026-07-06): a renderelés MÁR IS fekete-fehéren (render.ts:635/822, blit utáni invertálás) — összhangban a szakirodalommal; a hipotézis egy rossz feltevésből született (upstream példakép).
- ☐ Szólista ellenőrzőösszeggel byte-pontos azonosítókhoz (upstream #38, jóváhagyva) + tartózkodási banner (#31/#32) + camelCase a factsheet-ben (#33/#34).
- ☑ Port #45: $schema/$id megőrizve, tuple-k elemenként eltávolítva (commit a main-en).
- ☑ Elutasításnál-újrapróbálkozás (#37/H11): veszteségmentes visszajátszási sniffer + egyetlen újrapróbálkozás az eredeti body-val; refusalRetried telemetria (commit a main-en).
- ☐ Rehidratáló eszköz (`RecoverableBlock` → hívható eszköz; LensVLM validálja a szelektív újbóli kibontást).

## 3. fázis — Teljesítmény/robusztusság

- ☐ LRU render gyorsítótár (invariáns alapján determinisztikus; a slab + fagyasztott chunk-ok ma minden kéréssel újrarenderelődnek).
- ☐ PNG kódolás worker szálon; konfigurálható deflate szint.
- ☐ Nyitott upstream javítások portolása: #44 (típusos natív eszközök → 400), #45 (schema-strip draft-07 → 400 hurok), #42 (CONNECT proxy Claude Desktophoz), #19 (GPT-leírások duplán számlázása).
- ☐ ADAPTIVE_CPT_PLAN implementálása (cpt blokkszerepenként; a valós slab = 1,50).

## 4. fázis — Maga a fork

- ☐ Saját név/repo (Diego döntése) + upstream `git remote` a cherry-pickekhez.
- ☐ **TS mindenütt**: a mag már TS; konvertálja az `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` fájlokat (minta: tsx + vitest; a `benchmarks/density-frontier/` így született).
- ☐ OmniRoute minőségi mérce: eslint 9 + prettier, CI típusellenőrzéssel/teszttel/build-del/link-check-kel, CONTRIBUTING, SECURITY, README i18n (pt-BR először), szemantikus CHANGELOG.
- ☐ **GIF-ek videók helyett** a README-ben (rögzítés vhs/asciinema+agg-gel; egymás mellett sima vs proxy).
- ☐ Dashboard v2 (újraimplementálás HTTP API-n keresztül — ne örökölje a harmadik féltől származó kódot): "terminál nyitása ANTHROPIC_BASE_URL-lel" indító, "a forgalmam rajtam megy át?" ellenőrzés, kép-vs-szöveg vizsgáló, munkamenetek, költségpanel pénznemben, könnyű i18n, SSE polling helyett, SQLite perzisztencia megőrzési idővel (a jelenlegi 24 oszlopos séma jó kiindulópont).
- ☐ Mikro-ötletek a dense-image-gen-ből: `lines` mód (elrendezés megtartva kódhoz/táblázatokhoz), `--keep-ws`, oldalankénti eredetcím ("rendszerprompt" / "eszközdokumentáció" / "N. előzményforduló"), önálló CLI `render fajl.md -o out.png`.

## 5. fázis — Portolás az OmniRoute-ra

- ☐ `CompressionEngine` motor (`cavemanAdapter.ts` sablon), regisztrálva az `engines/index.ts` + `engineCatalog.ts`-ben; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Bekötés: `supportsVision` átadása a `chatCore.ts:1297`-ben (1 sor) vagy feloldás az `isVisionModelId`-vel.
- ☐ Stack sorrend: utolsó (RTK/Caveman/szemantikus rendererek előbb; az OmniGlyph a maradékot képesíti).
- ☐ Invariánsok: soha ne írja át a kliens `cache_control` blokkjait (#4560-as tanulság); a hűségkapunak (#5127) deklarált kivételre vagy olyan szöveges factsheetre van szüksége, amely kielégíti az invariánsokat; próbálkozás-telemetria `skip_reason`-nel (#4268-as tanulság).
- ☐ Útválasztás: a motor utáni fallback/retry-nak tiszteletben kell tartania a vizuális képességet és az engedélyezőlistát (újratömörítés vagy megkerülés).
- ☐ CCR szinergia: `emitRecoverable` → CCR tároló szeletenkénti lekéréssel (`head/tail/grep`, #5187) = teljes szelektív újbóli kibontás.
- ☐ Ingyenes szint nyújtása mint marketing funkció: minden ingyenes szintbeli token ~2-3×-szal több karaktert eredményez vizuális modelleken; a Gemini ingyenes szint + 1152×1536 geometria a legerősebb eset.

## Nyitott kockázatok

- Fable elutasítások újratelepítés után képesített kontextusban (upstream #37) — enyhítendő az alapértelmezett bekapcsolás előtt az OmniRoute-ban.
- Árarbitrázs: ha az Anthropic átárazza a vizuális funkciót, a megtakarítás megváltozik — a kérésenkénti ellentényező (`count_tokens`) a védelem.
- OpenAI: közösségi mérés (PageWatch) a completion tokenek emelkedését és 2×-es késleltetést látott — mérje szolgáltatónként, mielőtt bekapcsolja.

## A/B eredmények 2026-07-05 (OpenRouteren keresztül — NEM DÖNTŐ a geometriára, érvényes a hibamódokra)

| konfig | szó szerinti | tartózkodás | szűrt | néma-hibás |
|---|---|---|---|---|
| fable std 5×8 (AA és 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predikált) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predikált) |
| opus hires 10×16 | **7/9 olvasás** | 0 | 21 kifogyott kreditből | 2 (számjegy) |

Érvényes megállapítások: (1) a klasszifikátor (#37-es issue) a DOMINÁNS
hibamód a transzkripciós kérdéseknél a standard oldalon — 100%
szűrve — és nem indul be a nagy oldalon; a megfogalmazás számít. (2) A
tartózkodás működik: 20× ILEGIVEL vs 5 konfabuláció a nagy oldalon. (3) Az
Opus 10×16-nál 78%-ban olvas pontosan (n=9) vs 0% történelmi 5×8-nál —
első kézből származó bizonyíték a görbe töréspontjára. (4) A nagy oldal
olvashatatlansága OpenRouteren keresztül egy transzport RESAMPLE-t sugall
(Bedrock/Vertex standard szint?) — döntő hipotézis, amit az Anthropic
közvetlen API-ján kell tesztelni; a geometriai A/B addig NYITOTT marad.
Az OpenRouter kreditek elfogytak az Opus kar közepén.

## Végső 2×2-es mátrix (2026-07-05, CLI/előfizetésen keresztül, Fable 5, n=30/kar)

| oldal × atlasz | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 tartózkodás |
| high-res 1928×1928 | **20/30 (67%)** + 10 tartózkodás | 0/30 + 29 tartózkodás |

Nulla konfabuláció mind a 4 karban (120 kérdés — minden hiba ILEGIVEL volt).
ALKALMAZVA: a DENSE_RENDER_STYLE átállítva 1-bitre (aa:false), pinnel a
tests/dense-style.test.ts-ben. Opus 4.8: 26/30 10×16-nál a nagy oldalon,
30/30 ILEGIVEL 5×8-nál — az Opus biztonságos mód életképes. A
nagyfelbontású oldal továbbra is degradált a transzportok által (CLI
Read/OpenRouter resample); a WYSIWYG geometria végső ítélete még a
közvetlen API-tól függ.
