# Pag-aambag sa OmniGlyph

Salamat sa iyong interes! Ang proyektong ito ay may dalawang di-negotiable na
patakaran sa kultura — ito ang dahilan kung bakit mapagkakatiwalaan ang bawat
numero sa README.

## Patakaran 1 — Mahigpit na TDD

Lahat ng production code ay isinisilang mula sa isang test na unang nabigo:

1. Isulat ang test at **panoorin itong mabigo sa tamang dahilan**.
2. Isulat ang pinakamababang kailangan para pumasa ito.
3. I-refactor habang nananatiling green.

Ang buong bar ay: `pnpm run typecheck && pnpm test && pnpm run build` — lahat
ng tatlo, palagi (ang docs link-lint at ang rebrand guard ay tumatakbo sa
loob ng `pnpm test` sa pamamagitan ng `tests/docs-integrity.test.ts`).

## Patakaran 2 — Pagsukat bago ang mga claim

Walang pagbabago sa geometry, atlas, billing formula, o saklaw ng modelo ang
pumapasok nang walang sinukat na numero. Ang repository ay itinayo sa
paligid ng disiplinang ito:

- Gastos sa billing → patunayan ito gamit ang `benchmarks/billing-sweep/`
  (libre ang `count_tokens`; inaasahang residual: zero).
- Kakayahang mabasa → patunayan ito gamit ang `benchmarks/density-frontier/`
  (n≥30 kada arm, deterministic scoring, mga JSONL receipt na naka-commit sa
  `benchmarks/*/results/`).
- Ang acceptance bar para baguhin ang isang production default: gist ==
  text baseline **AT** zero na tahimik na eksaktong error sa string **AT**
  positibong savings.

Ang mga hypothesis na walang numero ay napupunta sa `docs/ROADMAP.md` bilang
hypothesis — hindi kailanman sa README bilang mga katotohanan. Dalawang
"halatang" ideya ang napabulaanan na ng datos (ang high-res na pahina, ang
anti-aliased na atlas); gumagana ang proseso.

## Setup

```bash
pnpm install
pnpm test              # buong suite, ~40–90s
pnpm run dev:node      # lokal na proxy sa watch mode
```

Node ≥18 (sinusubok ng CI ang 20/22/24), pnpm 10 (naka-pin ng `packageManager`
sa package.json).

## Istraktura

| folder | patakaran |
|---|---|
| `src/core/` | runtime-agnostic (Web APIs lamang — tumatakbo sa Node at Workers) |
| `src/node.ts` / `src/worker.ts` | host plumbing lamang |
| `benchmarks/` | mga harness na maaaring paulit-ulit na patakbuhin; ang mga resultang JSONL ay resibo, naka-commit |
| `docs/` | benchmarks/ (mga numero), architecture/ (mapa), ROADMAP (mga hypothesis), ops/ (OmniRoute) |

## Mga Commit at PR

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), na may body na nagpapaliwanag ng *bakit* kasama ang
  mga kaugnay na numero.
- Maliit, nakatuon na mga PR; ang mga pagbabago sa behavior ay may kasamang
  test na nagpipin dito at, kung naaangkop, ang benchmark na nagbibigay-katwiran dito.
- Huwag isulat-muli ang mga block ng `cache_control` ng client, huwag
  magdagdag ng runtime dependencies nang walang diskusyon (ang core ay
  sadyang magaan sa dependencies), huwag gumamit ng `Math.random`/timestamps
  sa mga render path (ang determinism ay isang matibay na invariant, sinubok
  sa pamamagitan ng byte-identity).
