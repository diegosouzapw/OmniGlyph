# Usanifu

Ramani ya ukurasa mmoja ya msimbo wa msingi.

## Bomba la ombi

```
mteja (Claude Code / SDK yoyote)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        wenyeji (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  kishikiliaji kimoja cha fetch cha Wavuti-thabiti:
  │                                uelekezaji, upitishaji wa uthibitishaji, hesabu-linganishi
  │                                ya count_tokens, matukio ya matumizi/telemetria
  ▼
src/core/transform.ts              BOMBA HILI (njia ya Anthropic):
  │   1. changanua mwili, tatua ngazi ya maono kutoka kwa muundo
  │   2. lango la faida — gharama sahihi ya picha dhidi ya gharama ya maandishi
  │   3. badilisha: slab tuli · tool_results kubwa · historia iliyokunjwa
  │   4. unganisha nyuma huku ukihifadhi nanga za cache_control za mteja
  ▼
API ya mtoa huduma (api.anthropic.com / api.openai.com)
```

## Bili (sahihi, iliyopimwa)

| moduli | mtoa huduma | muundo |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | vipande vya pikseli 28 + 4/kizuizi, ukomo wa kubadilisha ukubwa kwa kila ngazi; jiometri ya ukurasa (ngazi zote mbili huchora ukurasa wa kawaida 1568×728 — ngazi ya ubora wa juu ni mtego wa bili, angalia [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | tawala za kipande/kigae kwa kila muundo, `detail` kwa kila wasifu, jiometri ya ukataji |
| `src/core/gemini-model-profiles.ts` | Google | fomula ya kigae (`floor(min/1.5)` kitengo cha ukataji) + gharama tambarare za `media_resolution` |

## Uchoraji

- `src/core/render.ts` — maandishi → PNG kupitia atlasi ya glyph iliyookwa
  (Spleen 5×8 + akiba ya Unifont), upangaji upya na alama za mstari mpya
  `↵`, atlasi ya bit-1 katika uzalishaji (iliyopimwa kuwa bora kuliko AA
  kwenye Fable).
- `src/core/render-cache.ts` — ukumbukaji wa LRU wa uchoraji thabiti (slab
  tuli + vipande vya historia vilivyoganda huchorwa upya kwa kila ombi
  vinginevyo).
- `src/core/history.ts` — hukunja zamu za zamani kuwa vipande vya picha
  vinavyoongezwa mwishoni pekee vinavyobaki sawa kibayti ili prompt caching
  iendelee kupata mafanikio.
- `src/core/png.ts` — kisimbaji cha PNG chenye ubainifu thabiti (bila
  utegemezi asilia).

## Malinzi

- Orodha inayoruhusiwa ya miundo (`src/core/applicability.ts`): miundo
  iliyofaulu kigezo cha usomaji pekee ndiyo huchorwa kama picha; mengine
  yote hupita bila kubadilishwa kibayti.
- Thamani sahihi kabisa (SHA, vitambulisho) husafiri kama maandishi katika
  karatasi ya ukweli karibu na picha (`src/core/factsheet.ts`); asili
  zinazoweza kurejeshwa kupitia `emitRecoverable`.
- Zana asilia zilizoandikwa (`type !== 'custom'`) kamwe hazibadilishwi
  (ulinzi wa 400).

## Vipimo na risiti

`benchmarks/` inashikilia mifumo miwili iliyozalisha kila nambari katika
README — angalia [benchmarks/README.md](../../benchmarks/README.md).
