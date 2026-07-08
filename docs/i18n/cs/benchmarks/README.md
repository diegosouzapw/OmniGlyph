# Benchmarky

Každé číslo, které OmniGlyph tvrdí, pochází z jednoho ze dvou níže uvedených
harness — opakovatelné, kde je to možné deterministické, se surovými doklady
na jednotlivé odpovědi v `*/results/*.jsonl`. Konsolidovaná analýza:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — kolik skutečně stojí obrázek?

Bezplatné testy `count_tokens` proti živému API Anthropic, srovnávající
zastaralý vzorec `w·h/750` proti aktuálnímu modelu patchů 28 px napříč 11
testovanými geometriemi na 2 modelech × 2 úrovních rozlišení.

**Výsledek (2026-07-05): model patchů sedí s NULOVÝM reziduálem na každém testu**
— účtováno = `⌈w/28⌉ × ⌈h/28⌉` po zmenšení podle úrovně, plus pevných +3/+4
tokeny za obrázkový blok. Produkční stránka (1568×728) stojí přesně 1 460
tokenů a nese 28 080 znaků ≈ **19,2 znaků/token** oproti ~2 znakům/token
jako hustý text.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # jen predikce, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # živý sweep, stále $0 (count_tokens je zdarma)
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

Tři transporty: přímé API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`) a `--via-cli` (předplatné Claude Code —
$0). Poučení vydřené na vlastní kůži: prostředníci (OpenRouter, nástroj Read
v CLI) zmenšují velké obrázky; pro čitelnost jsou směrodatné pouze výsledky
přímého API.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # tabulka nákladů, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # přes předplatné, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unit testy ukotvující čisté části (korpus, skórování, vzorce nákladů):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
