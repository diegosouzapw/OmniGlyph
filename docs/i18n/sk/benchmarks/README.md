# Benchmarky

🌐 Preložené: [všetky jazyky](../../README.md)

Každé číslo, ktoré OmniGlyph tvrdí, pochádza z jedného z dvoch harnessov
nižšie — opätovne spustiteľných, kde je to možné deterministických, so
surovými dôkazmi na odpoveď v `*/results/*.jsonl`. Konsolidovaná analýza:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Ako fungujú úspory (na jednom obrázku)

Poskytovatelia účtujú **text po tokene**, ale účtujú **obrázok podľa jeho
rozmerov** — nie podľa toho, koľko textu je do neho napchaté. Jedna
štandardná stránka je fixný náklad bez ohľadu na to, aký hustý je text:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Ten istý kontext, účtovaný dvoma spôsobmi:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Prečo obrázok vyhráva — znaky prenesené na token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph robí túto zámenu iba vtedy, keď presná matematika hovorí, že
vyhráva, a iba pre modely, ktoré preukázateľne vedia stránku prečítať. Dva
harnesse nižšie dokazujú každú polovicu.

## 1. `billing-sweep/` — koľko naozaj stojí obrázok?

Bezplatné sondy `count_tokens` proti živému API Anthropicu, porovnávajúce
vyradený vzorec `w·h/750` oproti aktuálnemu modelu 28 px záplat naprieč 11
sondovými geometriami na 2 modeloch × 2 úrovniach rozlíšenia.

**Výsledok (2026-07-05): patch model sedí s rezíduom NULA na každej sonde**
— účtované = `⌈w/28⌉ × ⌈h/28⌉` po zmene veľkosti podľa úrovne, plus fixná
+3/+4 tokeny na blok obrázka. Produkčná stránka (1568×728) stojí presne
1 460 tokenov a nesie 28 080 znakov ≈ **19,2 znaku/token** oproti ~2
znakom/token ako hustý text.

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

## 2. `density-frontier/` — dokáže to model naozaj PREČÍTAŤ?

Náklady (offline, presné) × presnosť čítania (živá) naprieč konfiguráciami
renderu, geometriami stránok, atlasmi glyfov a poskytovateľmi. Korpus
zasadzuje presné reťazcové ihly (hex ID, camelCase, číselné rady) plus
**blízke distraktory postavené na meraných pároch zameniteľnosti glyfov**
— takže tichá konfabulácia sa deteguje, nielen počíta ako chyba. Hodnotenie
je deterministické (žiadny LLM rozhodca): `correct` / `abstained` (čestné
`ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Hlavné výsledky** (n=30 na rameno):

| rameno | presné čítania | poznámky |
|---|---:|---|
| Fable 5 · štandardná stránka · 1-bit atlas (produkcia) | **30/30** | nulové chyby, nulová konfabulácia |
| Fable 5 · štandardná stránka · AA atlas (starý predvolený) | 25/30 | 5 čestných zdržaní sa — prečo produkcia prepla na 1-bit |
| Fable 5 · high-res stránka 1928² | 1–2/30 | účtovaná 3,3× viac, ale enkodér resampluje — účtovacia pasca, nenasadené |
| Opus 4.8 · glyfy 10×16 | 23–26/30 | voliteľný bezpečný režim |
| GPT-5.5 · 768px pás (oba atlasy) | 0/60 | + ~40× nafúknutie výstupných tokenov oproti vlastnej textovej kontrole (30/30, 62 tok) |
| Gemini 2.5-flash (čiastočné, kvóta) | 0/26 | konfabuluje namiesto zdržania sa |

Presnosť čítania na jeden pohľad — toto **je** fail-closed brána modelu, nakreslená:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Do produkcie ide iba rameno ✅. Čokoľvek, čo sa číta zle, je blokované *s
dôkazom*, a trojcestné skóre znamená, že model, ktorý háda nesprávne
(`silent_wrong`), sa považuje za horší než ten, ktorý sa čestne zdrží
(`ILEGIVEL`).

Tri transporty: priame API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`) a `--via-cli` (predplatiteľská session
Claude Code — $0). Poučenie získané tvrdou cestou: sprostredkovatelia
(OpenRouter, nástroj Read v CLI) zmenšujú veľké obrázky; iba výsledky
priameho API sú smerodajné pre čitateľnosť.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Jednotkové testy pripínajúce čisté časti (korpus, hodnotenie, vzorce
nákladov): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
