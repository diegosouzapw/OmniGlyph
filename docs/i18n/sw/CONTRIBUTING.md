# Kuchangia katika OmniGlyph

Asante kwa kupendezwa! Mradi huu una kanuni mbili za utamaduni zisizoweza
kujadiliwa — ndizo sababu kila nambari katika README inaweza kuaminiwa.

## Kanuni 1 — TDD Kali

Msimbo wote wa uzalishaji huzaliwa kutoka kwa jaribio lililofeli kwanza:

1. Andika jaribio na **uone likifeli kwa sababu sahihi**.
2. Andika kiwango cha chini kinachohitajika ili lipite.
3. Panga upya huku ukibaki katika hali ya kijani.

Kigezo kamili ni: `pnpm run typecheck && pnpm test && pnpm run build` — vyote
vitatu, kila wakati (ukaguzi wa viungo vya hati na ulinzi wa urejeshaji wa
chapa hufanyika ndani ya `pnpm test` kupitia `tests/docs-integrity.test.ts`).

## Kanuni 2 — Upimaji kabla ya madai

Hakuna mabadiliko ya jiometri, atlasi, fomula ya bili, au wigo wa muundo
yanayoingia bila nambari iliyopimwa. Hazina hii imejengwa kuzunguka nidhamu
hii:

- Gharama ya bili → thibitisha kwa `benchmarks/billing-sweep/` (`count_tokens`
  ni bure; mabaki yanayotarajiwa: sifuri).
- Usomekaji → thibitisha kwa `benchmarks/density-frontier/` (n≥30 kwa kila
  kikundi, upimaji thabiti, risiti za JSONL zilizowekwa katika
  `benchmarks/*/results/`).
- Kigezo cha kukubali kubadilisha chaguo-msingi la uzalishaji: mfano == msingi
  wa maandishi **NA** hitilafu sifuri za kimya za mfuatano sahihi **NA**
  akiba chanya.

Nadharia bila nambari huenda kwenye `docs/ROADMAP.md` kama nadharia — kamwe
si kwenye README kama ukweli. Mawazo mawili "dhahiri" tayari yamekanushwa na
data (ukurasa wa ubora wa juu, atlasi iliyolainishwa kingo); mfumo huu
unafanya kazi.

## Usanidi

```bash
pnpm install
pnpm test              # mfumo mzima, ~40–90s
pnpm run dev:node      # proxy ya ndani katika hali ya kuangalia
```

Node ≥18 (CI hujaribu 20/22/24), pnpm 10 (imebainishwa na `packageManager`
katika package.json).

## Muundo

| folda | kanuni |
|---|---|
| `src/core/` | isiyotegemea muda wa uendeshaji (API za Wavuti pekee — huendesha kwenye Node na Workers) |
| `src/node.ts` / `src/worker.ts` | mabomba ya mwenyeji pekee |
| `benchmarks/` | mifumo inayoweza kuendeshwa upya; matokeo ya JSONL ni risiti, yamewekwa |
| `docs/` | benchmarks/ (nambari), architecture/ (ramani), ROADMAP (nadharia), ops/ (OmniRoute) |

## Makubaliano na Maombi ya Kuunganisha (PR)

- Makubaliano ya kawaida (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), mwili unaoeleza *sababu* pamoja na nambari husika.
- PR ndogo, zenye lengo mahususi; mabadiliko ya tabia huja pamoja na jaribio
  linaloyabainisha na, inapofaa, kipimo kinachoyahalalisha.
- Usiandike upya vizuizi vya `cache_control` vya mteja, usiongeze utegemezi
  wa muda wa uendeshaji bila majadiliano (msingi una utegemezi mdogo kwa
  makusudi), usitumie `Math.random`/muhuri wa muda katika njia za uchoraji
  (ubainifu thabiti ni sharti gumu, linalojaribiwa kwa ulinganifu wa bayti).
