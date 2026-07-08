# Ændringslog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantisk versionering.

## [1.0.0] — 2026-07-07

Første offentlige udgivelse.

### Produktet

- **Kontekst-som-billede-komprimeringsproxy**: omskriver de fyldige dele af
  hver LLM-forespørgsel (systemprompt, værktøjsdokumentation, gammel historik,
  store værktøjsoutputs) til tætpakkede 1-bit PNG-sider, før de forlader din
  maskine. Lokal Node-server og Cloudflare Workers-host.
- **Præcis afregningsmatematik per udbyder** (`src/core/`): Anthropic 28px-patches +
  3–4 tokens/blok-overhead (egen sweep, nul afvigelse), OpenAI- og Gemini-
  formler revideret mod officiel dokumentation. Eksporteret ved pakkens rod
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, tier-lofter).
- **Målt produktionsrenderingskonfiguration**: tætpakket 1-bit glyf-atlas (uden
  anti-aliasing), sider på standardniveau — hvert valg understøttet af en
  benchmark-dokumentation i `benchmarks/*/results/`.
- **Benchmark-rammeværker** (`benchmarks/`): billing-sweep (token-regnskab) og
  density-frontier (læsenøjagtighedsfront på tværs af modeller/tætheder),
  kan genkøres via API, OpenRouter, Claude Code CLI eller gennem OmniRoute
  (`--via-omniroute`).
- **Genforsøg ved afvisning**: SSE/JSON-sniffer genafspiller den oprindelige
  forespørgsel, når en model afviser den renderede side (nødstop
  `retryRefusalWithOriginal`).
- **LRU-rendering-cache** for deterministiske sider.
- **OmniRoute-motor**: leveres som `omniglyph`-komprimeringsmotoren i
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (enkelttilstand og
  stablet pipeline), med fail-closed-spærringer og billedbevidst token-regnskab.

### Tallene (alle reproducerbare)

- Eksempel på UI-rendering: 1015 tegn → 438×120 PNG, 254 → 84 tokens (**66,9 % sparet**).
- Standardside 1568×728 = 1456 billedtokens uanset hvor meget tekst den rummer.
- Claude læser tætpakkede 1-bit-sider med 100 % ved produktionstæthed; Opus 4.8 læser
  77–87 % ved 10×16.

### Negative beslutninger (målt, ikke meninger)

- **Tier med høj opløsning er en afregningsfælde**: 1928²-siden afregnes WYSIWYG, men
  encoderen modtager ikke fuld opløsning — begge tiers renderer standardsider.
- **GPT-5.5 afvist**: 0/60 læsninger af den tætpakkede strimmel og ~40× fuldførelses-
  opblæsning mod tekstkontrollen.
- **gpt-4o-mini blev aldrig omdannet til billede** (2833/5667-token-gulvet gør det urentabelt).
- **Gemini 2.5-flash konfabulerer** i stedet for at afstå på tætpakkede sider
  (0/26) — afventer gentest med betalt kvote.
