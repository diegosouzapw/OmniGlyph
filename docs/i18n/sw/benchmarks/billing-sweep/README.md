# Uchunguzi wa bili ya maono ya Anthropic

🌐 Imetafsiriwa: [lugha zote](../../../README.md)

**Kwa nini ipo:** lango la faida ni salama tu ikiwa makadirio ya gharama ni
*sahihi kabisa*. Fomula iliyokosea kidogo tu ingebadilisha vizuizi ambavyo
kwa kweli vinagharimu zaidi. Kwa hiyo uchunguzi huu unabainisha fomula kwa
nambari halisi za API kabla ya kusafirishwa — hadi **mabaki sifuri**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Uchunguzi wa bure wa `count_tokens` unaoamua maswali mawili wazi ya
jiometri:

1. **Fomula** — je, API hutoza vipande `ceil(w/28) × ceil(h/28)` (hati za
   sasa) au `w·h/750` iliyoachwa? Kundi la uchunguzi hutenganisha hizo mbili
   kwa token 25–180 kwa kila safu.
2. **Ngazi** — je, `claude-fable-5` hupata ukomo wa ubora wa juu (ukingo
   mrefu ≤ px 2576, ≤ token za kuona 4784)? Safu ya `page-old-1928x1928`
   ndiyo mwamuzi: ≈ **4761** iliyopimwa inamaanisha WYSIWYG ya ubora wa juu
   (ukurasa mkubwa wa zamani hubeba ~mara 3.3 herufi zaidi kwa kila picha
   kuliko ukurasa wa leo wa 1568×728, kwa uwiano uleule wa herufi/token); ≈
   **1521** inamaanisha resample ya ngazi ya kawaida, na 1568×728 inabaki
   sahihi.

Muktadha: uchunguzi wa 2026-07-01 nyuma ya ukurasa wa sasa wa 1568×728
(ukaguzi wa usomekaji, 2026-07-01) ulipimwa kwenye `claude-sonnet-4-5` —
muundo wa ngazi ya kawaida — wakati uzalishaji unalenga Fable 5, ambayo hati
za maono huiweka katika ngazi ya ubora wa juu. Ukaguzi huo pia ulipima
ukurasa wa sasa kwa token 1460: karibu zaidi na fomula ya kipande ya 1456
kuliko /750 ya 1522, ikidokeza API ilikuwa tayari imehamia kwenye bili ya
kipande.

## Kuendesha

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Lazima ipige API **moja kwa moja** — kamwe si kupitia proxy ya OmniGlyph,
ambayo ingebadilisha mwili. `count_tokens` ni bure; uchunguzi kamili hufanya
maombi ~25.

## Kusoma matokeo

Kwa kila muundo, kila safu ya uchunguzi inaonyesha token za picha
zilizopimwa (na-picha ukiondoa msingi wa maandishi-tu) dhidi ya makadirio
yote manne (`patch`/`legacy750` × `standard`/`highres`); muhtasari
hupanga nadharia kwa mabaki wastani kabisa. `--probe-multi` hukagua kikomo
cha kila picha (2×1092² ≈ 2×1521); `--probe-20plus` hukagua kanuni ya
zaidi-ya-picha-20 (ukingo wa zaidi ya px 2000 lazima ukataliwe, si
kupunguzwa ukubwa). Safu huishia katika `results/*.jsonl`; hisabati ya
makadirio inaishi katika `formulas.mjs`, iliyobainishwa na
`tests/billing-sweep-formulas.test.ts`.

## Baada ya uamuzi

- Fomula ya kipande imethibitishwa → beba OmniGlyph PR #27 (tafsiri sahihi
  ya kubadilisha ukubwa) na lainisha hesabu ya lango la
  `ANTHROPIC_PIXELS_PER_TOKEN` katika `src/core/transform.ts`.
- Ngazi ya ubora wa juu imethibitishwa kwenye Fable → rejesha jiometri ya
  ukurasa kwa kila ngazi (kurasa za aina 1928×1928 kwa
  Fable/Opus 4.8/Sonnet 5, 1568×728 kwa kawaida), ikiakisi jinsi njia ya GPT
  tayari inavyoshikilia `GPT_MAX_HEIGHT_PX` yake yenyewe.
