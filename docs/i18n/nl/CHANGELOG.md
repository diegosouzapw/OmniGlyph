# Changelog

Formaat: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

Eerste publieke release.

### Het product

- **Context-als-afbeelding compressieproxy**: herschrijft de omvangrijke delen
  van elk LLM-verzoek (systeemprompt, tool-documentatie, oude geschiedenis,
  grote tool-uitvoer) naar dichte 1-bit PNG-pagina's voordat ze uw machine
  verlaten. Lokale Node-server en Cloudflare Workers-host.
- **Exacte billing-wiskunde per provider** (`src/core/`): Anthropic 28px-patches
  + 3–4 tokens/blok overhead (eigen sweep, nul residu), OpenAI- en
  Gemini-formules geverifieerd tegen de officiële documentatie. Geëxporteerd
  op de package-root (`anthropicImageTokens`, `resolveAnthropicVisionTier`,
  tier-limieten).
- **Gemeten productie-renderconfiguratie**: dichte 1-bit glyf-atlas (geen
  anti-aliasing), standaard-tier pagina's — elke keuze onderbouwd door een
  benchmarkbewijs in `benchmarks/*/results/`.
- **Benchmark-harnesses** (`benchmarks/`): billing-sweep (tokenboekhouding) en
  density-frontier (leesnauwkeurigheidsgrens over modellen/dichtheden),
  opnieuw uit te voeren via API, OpenRouter, Claude Code CLI, of via OmniRoute
  (`--via-omniroute`).
- **Weigering-retry**: SSE/JSON-sniffer speelt het originele verzoek opnieuw af
  wanneer een model de gerenderde pagina weigert (noodstop
  `retryRefusalWithOriginal`).
- **LRU-rendercache** voor deterministische pagina's.
- **OmniRoute-engine**: wordt geleverd als de `omniglyph`-compressie-engine in
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (single-modus en
  gestapelde pijplijn), met fail-closed poorten en image-aware
  tokenboekhouding.

### De cijfers (alle reproduceerbaar)

- Voorbeeld UI-render: 1015 tekens → 438×120 PNG, 254 → 84 tokens
  (**66,9% bespaard**).
- Standaardpagina 1568×728 = 1456 image-tokens, ongeacht hoeveel tekst zij
  bevat.
- Claude leest dichte 1-bit pagina's met 100% op productiedichtheid; Opus 4.8
  leest 77–87% bij 10×16.

### Negatieve beslissingen (gemeten, geen meningen)

- **High-res tier is een billing-valkuil**: de 1928²-pagina wordt WYSIWYG
  gefactureerd, maar de encoder ontvangt niet de volledige resolutie — beide
  tiers renderen standaardpagina's.
- **GPT-5.5 afgewezen**: 0/60 lezingen van de dichte strip en ~40×
  completion-inflatie ten opzichte van de tekstcontrole.
- **gpt-4o-mini nooit als afbeelding** (2833/5667-tokenvloer maakt het
  onrendabel).
- **Gemini 2.5-flash confabuleert** in plaats van zich te onthouden op dichte
  pagina's (0/26) — in afwachting van hertest met betaald quotum.
