# Ramani ya njia ya tawi (fork) — "OmniGlyph yetu" + ushirikiano na OmniRoute

Mpango wa kazi ulioratibiwa (2026-07-05) kutoka: uchunguzi wa bili uliopimwa,
ukaguzi wa OpenAI/Gemini dhidi ya hati rasmi, uchambuzi wa zana husika, na
mfumo wa density-frontier. Hali ya kila kipengele: ☐ inasubiri · ◐ sehemu ·
☑ imekamilika hapa.

## Awamu ya 0 — Msingi wa upimaji (IMEKAMILIKA katika hazina hii)

- ☑ Bili sahihi ya Anthropic (vipande vya pikseli 28, ngazi 2, +4/kizuizi) —
  `src/core/anthropic-vision.ts`, uchunguzi katika `benchmarks/billing-sweep/`.
- ☑ Lango la faida lenye gharama sahihi (lilibadilisha w·h/750 × 1.10).
- ☑ Jiometri kwa kila ngazi: Fable/Opus 4.8/Sonnet 5 → kurasa 1928×1928 (mara
  3.3 picha chache); kawaida → 1568×728. Majaribio 691 ya kijani.
- ☑ Mfumo wa `benchmarks/density-frontier/` (gharama × usahihi nje ya
  mtandao kupitia API, sindano zenye vikengeushi vinavyofanana, upimaji
  thabiti).

## Awamu ya 1 — Marekebisho ya bili ya watoa huduma wengi (hitilafu
zilizothibitishwa katika ukaguzi)

Kipaumbele kimewekwa na ukaguzi (hati rasmi zilizonaswa 2026-07-05):

1. ☐ **D2 (lango LILILOGEUZWA)**: `gpt-4o-mini` huanguka katika kigae
   chaguo-msingi 85/170, lakini hugharimu **msingi 2833 / kigae 5667**
   (~mara 33 kupunguzwa makadirio, ~herufi 0.8 kwa kila token) — kuchora
   kama picha kwenye hii daima ni hasara na lango hulikubali. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` hutumwa bila masharti (`src/core/openai.ts:392,402`),
   lakini ipo tu katika gpt-5.4+; ipatikane kutoka wasifu.
3. ☐ **D1**: kizidishi cha `o4-mini` 1.62 → **1.72** (hupunguza makadirio kwa
   5.8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` zipo
   katika kikundi cha kipande **kikomo 1536 bila `original`** (msimbo hudhania
   10000); `gpt-5-codex-mini` ipo katika utawala usio sahihi (kigae → kipande).
5. ☐ **Jiometri ya GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (inalingana na
   TAWALA ZOTE MBILI: vipande 64×32 na vigae 4×512; +6.25% herufi bure).
   Wasifu maalum wa `original` wa 5.4/5.5: hadi 1568×5984 (vipande 9,163 ≤
   10k, ~herufi 233k katika kizuizi kimoja) — usomekaji A/B kwanza.
6. ☐ **Msaada wa Gemini** (mpya): `src/core/gemini.ts` +
   `gemini-model-profiles.ts` + njia za `:generateContent`/`:streamGenerateContent`
   katika proxy. Jiometri inayoweza kuandikwa: **1152×1536 (kitengo halisi
   cha ukataji 768, vigae 4, herufi 42.2 kwa kila token — uwiano bora
   uliowekwa kati ya watoa huduma 3**); dau za kurekebisha: 768² na
   `media_resolution:MEDIUM` (56.4) na Gemini 3 HIGH. Tahadhari: kituo
   kinachooana na OpenAI cha Gemini kingepitia kibadilishaji cha OpenAI
   chenye bili isiyo sahihi.

## Awamu ya 2 — Ubora wa usomaji (mfumo wa density-frontier kama hakimu)

- ◐ A/B ya maamuzi kati ya std na high-res kwenye Fable (inaendelea; kigezo:
  mfano == maandishi NA hitilafu sifuri za kimya NA akiba > 0).
- ☐ Kutatua mgongano wa AA dhidi ya 1-bit katika njia mnene (msimbo husema
  "eval-only", uzalishaji hutumia AA).
- ☐ (IMEAHIRISHWA na sababu 2026-07-06) Upasuaji wa glyph: mpangilio wa
  uzalishaji husoma 30/30 — hakuna kukosa kunakoweza kupimwa kwa upasuaji
  kurekebisha leo. Kurejewa ikiwa lengo chini ya 100% litaingia wigoni (mf.
  Opus) au ikiwa vipimo vipya vinaonyesha kurudi nyuma.
- ☑ ~~A/B ya mandhari nyepesi~~ IMETATULIWA kwa ukaguzi (2026-07-06): uchoraji
  TAYARI NI weusi-kwenye-weupe (render.ts:635/822, ugeuzaji baada ya blit) —
  unalingana na fasihi; nadharia ilizaliwa kutoka msingi usio sahihi (picha
  ya mfano ya juu ya mkondo).
- ☐ Orodha ya maneno yenye checksum kwa vitambulisho sahihi kabisa (upstream
  #38, iliyoidhinishwa) + bango la kujiepusha (#31/#32) + camelCase katika
  factsheet (#33/#34).
- ☑ Ubebaji wa #45: $schema/$id imehifadhiwa, tuples zimeondolewa kwa kila
  kipengele (commit kwenye main).
- ☑ Kujaribu-tena-baada-ya-kukataliwa (#37/H11): kichunguzi cha kurudia bila
  hasara + jaribio moja tena na mwili wa asili; telemetria ya
  refusalRetried (commit kwenye main).
- ☐ Zana ya kurejesha (`RecoverableBlock` → zana inayoweza kuitwa; LensVLM
  huhakiki upanuzi wa kuchagua tena).

## Awamu ya 3 — Utendaji/uimara

- ☐ Kache ya uchoraji ya LRU (thabiti kwa ubainifu; slab + vipande
  vilivyoganda huchorwa upya kwa kila ombi leo).
- ☐ Usimbaji wa PNG katika uzi wa kazi (worker thread); kiwango cha deflate
  kinachoweza kusanidiwa.
- ☐ Kubeba marekebisho ya upstream yaliyo wazi: #44 (zana asilia zilizoandikwa
  → 400), #45 (mzunguko wa kuondoa schema draft-07 → 400), #42 (proxy ya
  CONNECT kwa Claude Desktop), #19 (utozaji maradufu wa maelezo ya GPT).
- ☐ Kutekeleza ADAPTIVE_CPT_PLAN (cpt kwa kila jukumu la kizuizi; slab halisi
  = 1.50).

## Awamu ya 4 — Tawi (fork) lenyewe

- ☐ Jina/hazina yake (uamuzi wa Diego) + `git remote` ya upstream kwa
  cherry-pick.
- ☐ **TS kila mahali**: msingi tayari ni TS, badilisha `eval/*.mjs`, `demo/`,
  `scripts/*.mjs`, `bench/` (muundo: tsx + vitest; `benchmarks/density-frontier/`
  ilizaliwa hivyo).
- ☐ Kiwango cha ubora cha OmniRoute: eslint 9 + prettier, CI na
  typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n
  (pt-BR kwanza), CHANGELOG ya kisemantiki.
- ☐ **GIF badala ya video** katika README (rekodi na vhs/asciinema+agg;
  bega kwa bega sahili dhidi ya proxy).
- ☐ Dashibodi v2 (tekeleza upya kupitia HTTP API — usirithi msimbo wa
  mhusika wa tatu): kizinduzi cha "fungua terminal na ANTHROPIC_BASE_URL",
  ukaguzi wa "je, trafiki inapita kupitia mimi?", mkaguzi wa picha-dhidi-ya-maandishi,
  vipindi, paneli ya gharama katika sarafu, i18n nyepesi, SSE badala ya
  kuuliza mara kwa mara, uhifadhi wa SQLite na uhifadhi wa muda (schema
  yake ya safu 24 ni mwanzo mzuri).
- ☐ Mawazo madogo kutoka dense-image-gen: hali ya `lines` (mpangilio
  umehifadhiwa kwa msimbo/majedwali), `--keep-ws`, kichwa cha asili cha kila
  ukurasa ("maelekezo ya mfumo" / "hati za zana" / "zamu ya historia N"),
  CLI huru `render arquivo.md -o out.png`.

## Awamu ya 5 — Ubebaji kwenda OmniRoute

- ☐ Injini ya `CompressionEngine` (kiolezo cha `cavemanAdapter.ts`),
  iliyosajiliwa katika `engines/index.ts` + `engineCatalog.ts`;
  `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Mabomba: pitisha `supportsVision` katika `chatCore.ts:1297` (mstari 1) au
  itatue kupitia `isVisionModelId`.
- ☐ Mpangilio wa rafu: mwisho (RTK/Caveman/vichoraji vya kisemantiki kwanza;
  OmniGlyph huchora kama picha kilichobaki).
- ☐ Ubainifu: kamwe usiandike upya vizuizi vyenye `cache_control` ya mteja
  (somo #4560); lango la uaminifu (#5127) linahitaji msamaha ulioelezwa au
  karatasi ya ukweli wa maandishi inayotimiza ubainifu; telemetria ya jaribio
  na `skip_reason` (somo #4268).
- ☐ Uelekezaji: fallback/jaribio-tena baada ya injini lazima liheshimu uwezo
  wa maono na orodha inayoruhusiwa (banaji upya au epuka).
- ☐ Muunganiko wa CCR: `emitRecoverable` → hifadhi ya CCR na urejeshaji wa
  kipande kwa kipande (`head/tail/grep`, #5187) = upanuzi kamili wa kuchagua
  tena.
- ☐ Kuongeza wigo wa ngazi bure kama kipengele cha uuzaji: kila token ya
  ngazi bure hutoa herufi ~mara 2-3 zaidi kwenye miundo ya maono; ngazi bure
  ya Gemini + jiometri ya 1152×1536 ndiyo kesi yenye nguvu zaidi.

## Hatari zilizo wazi

- Kukataliwa kwa Fable baada ya kupelekwa upya katika muktadha
  uliochorwa (upstream #37) — punguza kabla ya kuwasha chaguo-msingi
  katika OmniRoute.
- Uhamishaji wa bei: ikiwa Anthropic itabadilisha bei ya maono, akiba
  hubadilika — hesabu-linganishi kwa kila ombi (`count_tokens`) ndiyo ulinzi.
- OpenAI: kipimo cha jamii (PageWatch) kiliona token za umalizio zikiongezeka
  na muda wa kusubiri mara 2 — pima kwa kila mtoa huduma kabla ya kuwasha.

## Matokeo ya A/B 2026-07-05 (kupitia OpenRouter — HAYAKAMILIKI kwa jiometri,
sahihi kwa hali za kushindwa)

| mpangilio | halisi | kujiepusha | kilichochujwa | kimya-kibaya |
|---|---|---|---|---|
| fable std 5×8 (AA na 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 zilizotabiriwa) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 zilizotabiriwa) |
| opus hires 10×16 | **7/9 zilisomwa** | 0 | 21 zilikwisha mikopo | 2 (tarakimu) |

Matokeo halali: (1) kiainishi (suala #37) ndiyo hali TAWALA ya kushindwa kwa
maswali ya unukuzi katika ukurasa wa kawaida — 100% zimechujwa — na haitokei
kwenye ukurasa mkubwa; maneno yana umuhimu. (2) Kujiepusha kunafanya kazi:
mara 20 ILEGIVEL dhidi ya ubunifu 5 kwenye ukurasa mkubwa. (3) Opus katika
10×16 husoma 78% sahihi (n=9) dhidi ya 0% ya kihistoria kwa 5×8 — ushahidi wa
kwanza wa moja kwa moja wa goti. (4) Kutosomeka kwa ukurasa mkubwa kupitia
OpenRouter kunaonyesha RESAMPLE ya usafirishaji (Bedrock/Vertex ngazi ya
kawaida?) — nadharia ya maamuzi ya kujaribu kwenye API ya moja kwa moja ya
Anthropic; A/B ya jiometri inabaki WAZI hadi hapo. Mikopo ya OpenRouter
iliisha katikati ya kikundi cha Opus.

## Muundo wa mwisho wa 2×2 (2026-07-05, kupitia CLI/usajili, Fable 5, n=30/kikundi)

| ukurasa × atlasi | 1-bit | AA |
|---|---|---|
| kawaida 1568×728 | **30/30 (100%)** | 25/30 + kujiepusha 5 |
| ubora wa juu 1928×1928 | **20/30 (67%)** + kujiepusha 10 | 0/30 + kujiepusha 29 |

Uvumbuzi sifuri katika vikundi 4 (maswali 120 — kila kukosa kulikuwa
ILEGIVEL). IMETEKELEZWA: DENSE_RENDER_STYLE imegeuzwa kwenda 1-bit (aa:false)
na pini katika tests/dense-style.test.ts. Opus 4.8: 26/30 kwa 10×16 kwenye
ukurasa mkubwa, 30/30 ILEGIVEL kwa 5×8 — hali salama ya Opus inaweza
kutekelezwa. Ukurasa wa ubora wa juu unabaki umeharibika kwa njia za
usafirishaji (CLI Read/urejeshaji wa OpenRouter) — uamuzi wa jiometri ya
WYSIWYG bado unategemea API ya moja kwa moja.
