# Vipimo

Kila nambari inayodaiwa na OmniGlyph inatoka kwenye mmoja wa mifumo miwili
hapa chini — inayoweza kuendeshwa upya, thabiti pale inapowezekana, ikiwa
na risiti ghafi za kila jibu katika `*/results/*.jsonl`. Uchambuzi
ulioratibiwa: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — picha inagharimu nini hasa?

Uchunguzi wa bure wa `count_tokens` dhidi ya API ya Anthropic ya moja kwa
moja, ukilinganisha fomula iliyoachwa `w·h/750` na muundo wa sasa wa
kipande cha pikseli 28 katika jiometri 11 za uchunguzi kwenye miundo 2 ×
ngazi 2 za ubora.

**Matokeo (2026-07-05): muundo wa kipande unalingana na mabaki SIFURI kwenye
kila uchunguzi** — kilichotozwa = `⌈w/28⌉ × ⌈h/28⌉` baada ya kubadilisha
ukubwa kwa ngazi, pamoja na token za ziada +3/+4 kwa kila kizuizi cha picha.
Ukurasa wa uzalishaji (1568×728) hugharimu token 1,460 kamili na hubeba
herufi 28,080 ≈ **herufi 19.2 kwa kila token** ikilinganishwa na herufi ~2
kwa kila token kama maandishi mnene.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # makadirio tu, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # uchunguzi wa moja kwa moja, bado $0 (count_tokens ni bure)
```

## 2. `density-frontier/` — je, muundo unaweza KWELI kuisoma?

Gharama (nje ya mtandao, sahihi) × usahihi wa usomaji (moja kwa moja)
katika mipangilio ya uchoraji, jiometri za ukurasa, atlasi za glyph, na
watoa huduma. Kundi la data hupanda sindano za mfuatano sahihi kabisa
(vitambulisho vya hex, camelCase, mfuatano wa tarakimu) pamoja na
**vikengeushi vya karibu-kukosa vilivyojengwa kutoka jozi za kufanana za
glyph zilizopimwa** — hivyo uvumbuzi wa kimya hugunduliwa, si tu kuhesabiwa
kuwa kibaya. Upimaji ni thabiti (bila hakimu wa LLM): `correct` /
`abstained` (`ILEGIVEL` ya uaminifu) / `silent_wrong` / `no_answer`.

**Matokeo makuu** (n=30 kwa kila kikundi):

| kikundi | usomaji sahihi | maelezo |
|---|---:|---|
| Fable 5 · ukurasa wa kawaida · atlasi ya 1-bit (uzalishaji) | **30/30** | hitilafu sifuri, uvumbuzi sifuri |
| Fable 5 · ukurasa wa kawaida · atlasi ya AA (chaguo-msingi la zamani) | 25/30 | kujiepusha 5 kwa uaminifu — kwa nini uzalishaji ulibadilika kwenda 1-bit |
| Fable 5 · ukurasa wa ubora wa juu 1928² | 1–2/30 | umetozwa mara 3.3 lakini kichakataji kimerudisha ukubwa — mtego wa bili, haujawashwa |
| Opus 4.8 · glyph za 10×16 | 23–26/30 | hali salama ya hiari |
| GPT-5.5 · ukanda wa px 768 (atlasi zote mbili) | 0/60 | + upandishaji wa token za matokeo ~mara 40 ikilinganishwa na udhibiti wake wa maandishi (30/30, token 62) |
| Gemini 2.5-flash (sehemu, mgao) | 0/26 | hubuni badala ya kujiepusha |

Usafirishaji watatu: API ya moja kwa moja
(`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`), OpenRouter
(`OPENROUTER_API_KEY`), na `--via-cli` (usajili wa Claude Code — $0). Tahadhari
iliyojifunzwa kwa njia ngumu: wapatanishi (OpenRouter, zana ya Read ya CLI)
hurudisha ukubwa wa picha kubwa; matokeo ya API ya moja kwa moja pekee ndiyo
yenye mamlaka kwa usomekaji.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # jedwali la gharama, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # kupitia usajili, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Majaribio ya kitengo yanayobainisha sehemu safi (kundi la data, upimaji,
fomula za gharama): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
