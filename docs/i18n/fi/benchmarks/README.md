# Benchmarkit

Jokainen luku, jonka OmniGlyph väittää, tulee jommastakummasta alla olevasta
työkalusta — uudelleenajettavissa, deterministisiä siinä määrin kuin
mahdollista, raa'at vastauskohtaiset kuitit kansiossa `*/results/*.jsonl`.
Koottu analyysi: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — mitä kuva todella maksaa?

Ilmaisia `count_tokens`-mittauksia live-Anthropic-API:a vasten, vertaillen
poistettua `w·h/750`-kaavaa nykyiseen 28 px -palamalliin 11 koegeometrian
poikki 2 mallilla × 2 resoluutiotasolla.

**Tulos (2026-07-05): palamalli sopii residuaalilla NOLLA jokaisessa kokeessa**
— laskutus = `⌈w/28⌉ × ⌈h/28⌉` tasokohtaisen uudelleenkoon jälkeen, plus
kiinteä +3/+4 tokenia per kuvalohko. Tuotantosivu (1568×728) maksaa tarkalleen
1 460 tokenia ja sisältää 28 080 merkkiä ≈ **19,2 merkkiä/tokeni** verrattuna
~2 merkkiä/tokeni tiheänä tekstinä.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — osaako malli todella LUKEA sen?

Kustannus (offline, tarkka) × lukutarkkuus (live) renderöintikonfiguraatioiden,
sivugeometrioiden, glyfiatlasten ja palveluntarjoajien poikki. Korpus
istuttaa tarkkoja merkkijononeuloja (hex-id:t, camelCase, numerosarjat) sekä
**mitatuista glyfi-hämäysparityksistä rakennettuja lähes-samanlaisia
häiriötekijöitä** — jolloin hiljainen konfabulaatio havaitaan, ei vain
lasketa väärin. Pisteytys on deterministinen (ei LLM-tuomaria):
`correct` / `abstained` (rehellinen `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Otsikkotulokset** (n=30 per haara):

| haara | tarkat lukukokeet | huomiot |
|---|---:|---|
| Fable 5 · standardisivu · 1-bit-atlas (tuotanto) | **30/30** | nolla virhettä, nolla konfabulaatiota |
| Fable 5 · standardisivu · AA-atlas (vanha oletus) | 25/30 | 5 rehellistä pidättäytymistä — miksi tuotanto vaihtoi 1-bittiin |
| Fable 5 · high-res 1928²-sivu | 1–2/30 | laskutettu 3,3× mutta enkooderin uudelleennäytteistämä — laskutusansa, ei käytössä |
| Opus 4.8 · 10×16-glyfit | 23–26/30 | opt-in-turvatila |
| GPT-5.5 · 768px-liuska (molemmat atlakset) | 0/60 | + ~40× tulostetokenien paisuminen omaan tekstikontrolliinsa verrattuna (30/30, 62 tok) |
| Gemini 2.5-flash (osittainen, kiintiö) | 0/26 | konfabuloi sen sijaan että pidättäytyisi |

Kolme siirtotapaa: suora API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), ja `--via-cli` (Claude Code -tilaus —
$0). Kovalla tavalla opittu varoitus: välikädet (OpenRouter, CLI:n Read-
työkalu) muuttavat suurten kuvien kokoa; vain suora API -tulokset ovat
luotettavia luettavuudelle.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Yksikkötestit, jotka pinnaavat puhtaat osat (korpus, pisteytys, kustannuskaavat):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
