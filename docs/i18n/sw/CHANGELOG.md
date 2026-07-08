# Rekodi ya Mabadiliko

Muundo: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · uwekaji toleo wa kisemantiki.

## [1.0.0] — 2026-07-07

Toleo la kwanza la umma.

### Bidhaa

- **Proxy ya ubanaji wa muktadha-kama-picha**: hubadilisha sehemu nzito za kila
  ombi la LLM (maelekezo ya mfumo, hati za zana, historia ya zamani, matokeo
  makubwa ya zana) kuwa kurasa mnene za PNG za bit-1 kabla hazijatoka kwenye
  kompyuta yako. Seva ya Node ya ndani na mwenyeji wa Cloudflare Workers.
- **Hesabu sahihi ya bili kwa kila mtoa huduma** (`src/core/`): vipande vya
  pikseli 28 vya Anthropic + gharama ya token 3–4 kwa kila kizuizi (uchunguzi
  wake mwenyewe, mabaki sifuri), fomula za OpenAI na Gemini zilizohakikiwa
  dhidi ya hati rasmi. Zimesafirishwa kwenye mzizi wa pakiti
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, ukomo wa ngazi).
- **Mpangilio wa uzalishaji uliopimwa**: atlasi mnene ya glyph ya bit-1 (bila
  kulainisha kingo), kurasa za ngazi ya kawaida — kila chaguo lina risiti ya
  kipimo katika `benchmarks/*/results/`.
- **Mifumo ya vipimo** (`benchmarks/`): billing-sweep (uhasibu wa token) na
  density-frontier (mpaka wa usahihi wa usomaji katika miundo/msongamano
  mbalimbali), inayoweza kuendeshwa upya kupitia API, OpenRouter, CLI ya
  Claude Code, au kupitia OmniRoute (`--via-omniroute`).
- **Kujaribu tena baada ya kukataliwa**: kichunguzi cha SSE/JSON hurudia ombi
  la asili wakati muundo unakataa ukurasa uliochorwa (kizima cha dharura
  `retryRefusalWithOriginal`).
- **Kache ya uchoraji ya LRU** kwa kurasa zenye ubainifu thabiti.
- **Injini ya OmniRoute**: hutolewa kama injini ya ubanaji ya `omniglyph` katika
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (hali moja na
  mfumo uliopangwa), ikiwa na malango ya kufunga-kushindwa na uhasibu wa
  token unaotambua picha.

### Nambari (zote zinaweza kurudiwa)

- Mfano wa uchoraji wa UI: herufi 1015 → PNG ya 438×120, token 254 → 84
  (**66.9% zimeokolewa**).
- Ukurasa wa kawaida 1568×728 = token za picha 1456 bila kujali ni kiasi gani
  cha maandishi kinachobeba.
- Claude husoma kurasa mnene za bit-1 kwa 100% katika msongamano wa
  uzalishaji; Opus 4.8 husoma 77–87% kwa 10×16.

### Maamuzi hasi (yaliyopimwa, si maoni)

- **Ngazi ya ubora wa juu ni mtego wa bili**: ukurasa wa 1928² hutozwa kwa
  WYSIWYG lakini kichakataji hakipati ubora kamili — ngazi zote mbili
  huchora kurasa za kawaida.
- **GPT-5.5 imekataliwa**: 0/60 za usomaji wa mstari mnene na upandishaji wa
  ~mara 40 wa umalizio ikilinganishwa na udhibiti wa maandishi.
- **gpt-4o-mini haijawahi kuchorwa kama picha** (kikomo cha token 2833/5667
  hukifanya kisifaidi kifedha).
- **Gemini 2.5-flash hubuni** badala ya kujiepusha kwenye kurasa mnene
  (0/26) — inasubiri jaribio jipya na mgao ulioolipiwa.
