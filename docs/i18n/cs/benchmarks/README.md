# Benchmarky

🌐 Přeloženo: [všechny jazyky](../../README.md)

Každé číslo, které OmniGlyph tvrdí, pochází z jednoho ze dvou níže uvedených
harness — opakovatelné, kde je to možné deterministické, se surovými doklady
na jednotlivé odpovědi v `*/results/*.jsonl`. Konsolidovaná analýza: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Jak fungují úspory (na jednom obrázku)

Poskytovatelé účtují **text podle tokenu**, ale účtují **obrázek podle jeho
rozměrů** — ne podle toho, kolik textu je v něm natěsnáno. Jedna standardní
stránka má fixní náklad bez ohledu na to, jak hustý je text:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Stejný kontext, účtovaný dvěma způsoby:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Proč obrázek vyhrává — znaky přenesené na token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph provede tuto záměnu pouze tehdy, když přesná matematika říká, že
vyhrává, a pouze pro modely, které prokázaly, že stránku umí přečíst. Dva
níže uvedené harness dokazují každou polovinu.

## 1. `billing-sweep/` — kolik skutečně stojí obrázek?

Bezplatné testy `count_tokens` proti živému API Anthropic, srovnávající
zastaralý vzorec `w·h/750` proti aktuálnímu modelu patchů 28 px napříč 11
testovanými geometriemi na 2 modelech × 2 úrovních rozlišení.

**Výsledek (2026-07-05): model patchů sedí s NULOVÝM reziduálem na každém testu**
— účtováno = `⌈w/28⌉ × ⌈h/28⌉` po zmenšení podle úrovně, plus pevných +3/+4
tokeny za obrázkový blok. Produkční stránka (1568×728) stojí přesně 1 460
tokenů a nese 28 080 znaků ≈ **19,2 znaků/token** oproti ~2 znakům/token
jako hustý text.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — umí to model skutečně PŘEČÍST?

Náklady (offline, přesné) × přesnost čtení (živě) napříč konfiguracemi
renderu, geometriemi stránek, atlasy glyfů a poskytovateli. Korpus vysazuje
přesné řetězcové jehly (hex ID, camelCase, číselné řady) plus **distraktory
téměř na hraně záměny sestavené ze změřených dvojic zaměnitelnosti glyfů** —
takže tichá konfabulace je detekována, nejen počítána jako chyba. Skórování
je deterministické (žádný LLM soudce): `correct` / `abstained` (poctivé
`ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Hlavní výsledky** (n=30 na rameno):

| rameno | přesná čtení | poznámky |
|---|---:|---|
| Fable 5 · standardní stránka · 1bitový atlas (produkce) | **30/30** | nula chyb, nula konfabulace |
| Fable 5 · standardní stránka · AA atlas (starý výchozí) | 25/30 | 5 poctivých zdržení se — proč se produkce přepnula na 1bit |
| Fable 5 · high-res stránka 1928² | 1–2/30 | účtováno 3,3× více, ale enkodér resampluje — billingová past, nezapnuto |
| Opus 4.8 · glyfy 10×16 | 23–26/30 | volitelný bezpečný režim |
| GPT-5.5 · proužek 768px (oba atlasy) | 0/60 | + ~40× nafouknutí výstupních tokenů oproti vlastní textové kontrole (30/30, 62 tok) |
| Gemini 2.5-flash (částečné, kvóta) | 0/26 | konfabuluje místo zdržení se |

Přesnost čtení na první pohled — toto **je** fail-closed model gate, vykresleno:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Odesílá se pouze rameno ✅. Cokoli, co se čte špatně, je zablokováno *s
dokladem*, a trojcestné skóre znamená, že model, který hádá špatně
(`silent_wrong`), je považován za horší než ten, který poctivě přizná
neúspěch (`ILEGIVEL`).

Tři transporty: přímé API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`) a `--via-cli` (předplatné Claude Code —
$0). Poučení vydřené na vlastní kůži: prostředníci (OpenRouter, nástroj Read
v CLI) zmenšují velké obrázky; pro čitelnost jsou směrodatné pouze výsledky
přímého API.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unit testy ukotvující čisté části (korpus, skórování, vzorce nákladů):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
