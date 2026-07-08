# density-frontier — gharama × usahihi kwa kila ubora

🌐 Imetafsiriwa: [lugha zote](../../../README.md)

Mfumo unaopima **mpaka wa Pareto kati ya gharama na usomekaji** wa uchoraji
wa maandishi-kwenda-picha, kwa kila mtoa huduma (Anthropic / OpenAI /
Gemini), jiometri ya ukurasa, seli ya glyph, na mtindo wa atlasi.

Kurasa za bei nafuu (mnene zaidi) hubeba herufi zaidi kwa kila token lakini
hatimaye huacha kusomeka. Mpangilio unaruhusiwa kusafirishwa tu pale
**vyote viwili** vinapotimia — gharama ni ya chini *na* muundo bado
unaisoma kikamilifu:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

Kila jibu hupimwa likawe mojawapo kati ya matokeo matatu kamili — lile la
katikati ndilo linalofanya lango liaminike:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Mpangilio unaozalisha hata 🔴 moja unadondoshwa, haijalishi ni wa bei nafuu
kiasi gani.

Ulinganifu mkuu: tangu uchunguzi wa bili (2026-07-05,
`benchmarks/billing-sweep/`), **gharama inaweza kutabiriwa kwa usahihi nje
ya mtandao** — vipande vya pikseli 28 + 4/kizuizi kwenye Anthropic
(`src/core/anthropic-vision.ts`), wasifu wa kipande/kigae kwenye OpenAI
(`src/core/openai.ts`), vigae/media_resolution kwenye Gemini
(`gemini-cost.ts`). Ni **usahihi wa usomaji** pekee unaohitaji API.

## Muundo

- **Kundi la data** (`corpus.ts`): kijazio mnene cha aina ya log/JSON +
  sindano zilizopandwa kutoka kwa madarasa ambayo muundo wa kufanana
  husema hushindwa (hex ya herufi 12, camelCase, tarakimu 6/8/5/3) +
  **vikengeushi vya karibu-kukosa** vilivyojengwa kutoka jozi za kufanana
  zilizopimwa. Ikiwa muundo unajibu kwa kikengeushi, mkanganyiko ulitabiriwa
  — hilo ndilo hali ya kushindwa kimya inayogunduliwa, si kuhesabiwa tu kuwa
  kibaya. Thabiti (mulberry32).
- **Mipangilio** (`configs.ts`): gridi iliyoteuliwa — kurasa za kawaida
  1568×728 dhidi ya ubora wa juu 1928×1928 (A/B inayoamua jiometri kwa kila
  ngazi), AA dhidi ya 1-bit (hutatua mgongano wa uchoraji mnene), seli za
  7×10/10×16 (hali salama ya Opus), ukanda wa GPT, na dau mbili za Gemini
  (≤384² = tambarare 258; `media_resolution: low` = 280 fasta →
  ~herufi 116 kwa token *ikiwa inasomeka*).
- **Upimaji** (`score.ts`): ulinganifu sahihi thabiti, bila hakimu wa LLM.
  Matokeo matatu: `correct` / `abstained` (kiashiria cha ILEGIVEL —
  kushindwa kwa uaminifu) / `silent_wrong` (hali hatari), na alama ya
  kikengeushi.

## Kuendesha

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Mipangilio mahususi: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Majibu huishia katika `results/*.jsonl` (mstari mmoja kwa kila swali, na
jibu ghafi kwa ukaguzi).

## Kigezo cha kukubali (kilichorithiwa kutoka upstream PR #35/#36)

Mpangilio unakuwa chaguo-msingi la uzalishaji tu ikiwa: **mfano == msingi
wa maandishi** NA **hitilafu sifuri za kimya za mfuatano sahihi** NA
**akiba chanya**. Uendeshaji wa kwanza wa lazima ni `anthropic-std-5x8-aa`
dhidi ya `anthropic-hires-5x8-aa` kwenye Fable — ukaguzi wa haraka wa
usomekaji wa ukurasa mkubwa kabla ya kuwasha ngazi ya ubora wa juu.

## `--via-omniroute` — e2e kupitia OmniRoute (P3: uthibitisho wa kutoharibika)

Usafirishaji hapo juu huchora maandishi→PNG **ndani ya mfumo** na kutuma
picha. `--via-omniroute` hufanya kinyume, ambayo ndiyo njia ya uzalishaji:
hutuma **maandishi mnene** kwenda kwenye mfano wa OmniRoute unaoendesha,
huruhusu injini ya **`omniglyph`** **kuchora** kurasa na kuzisafirisha
kwenda Anthropic, na hupima usomaji + akiba. Ikiwa usomaji unabaki sawa na
njia ya moja kwa moja **na** OmniRoute inaripoti ubanaji, imethibitishwa
kuwa uchoraji+usafirishaji wa OmniRoute **hauharibu** kurasa.

Masharti ya awali (ya uendeshaji):

1. **OmniRoute inaendesha** (`npm run dev`, chaguo-msingi
   `http://localhost:20128`).
2. Mtoa huduma wa **Anthropic** amesanidiwa katika OmniRoute na **ufunguo
   halisi** (njia ya moja kwa moja — lango la
   `providerTransport==='direct'` hupita tu kwa mtoa huduma wa `anthropic`).
3. **Injini ya `omniglyph` IMEWASHWA** katika usanidi wa ubanaji wa
   OmniRoute (`config.engines.omniglyph.enabled = true`) — kichwa cha
   `engine:omniglyph` hutokea tu injini ikiwa imewashwa. (Injini ni
   `stable:false`/onyesho la awali; iwashe waziwazi.)
4. Ufunguo wa API wa OmniRoute katika `OMNIROUTE_API_KEY` (ule ambao mteja
   hutumia kuthibitisha dhidi ya OmniRoute, si ule wa Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Kila jibu hurekodi `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(kutoka kichwa cha jibu cha `X-OmniRoute-Compression`) katika JSONL; safu
ya jedwali huonyesha ni majibu mangapi yalirudi yakiwa yamebanwa + akiba
ya wastani. **Kigezo cha P3**: usomaji sawa wa verbatim/mfano kama njia ya
moja kwa moja (kutoharibika) **na** `omnirouteSavings` isiyo tupu (ikithibitisha
uchoraji ulitokea, si usomaji wa maandishi ghafi). Ikiwa `did NOT compress`
inaonekana, injini haijawashwa katika OmniRoute (au mwili haukupitisha
malango ya kufunga-kushindwa).

Majaribio ya sehemu safi: `tests/density-frontier.test.ts` (inajumuisha
`buildOmnirouteRequest` na `parseCompressionSavings` kutoka usafirishaji wa
via-omniroute).
