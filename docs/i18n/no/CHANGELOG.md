# Endringslogg

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantisk versjonering.

## [1.0.0] — 2026-07-07

Første offentlige utgivelse.

### Produktet

- **Kontekst-som-bilde-komprimeringsproxy**: skriver om de tunge delene av
  hver LLM-forespørsel (systemprompt, verktøydokumentasjon, gammel historikk,
  store verktøyresultater) til tette 1-bit PNG-sider før de forlater maskinen
  din. Lokal Node-server og Cloudflare Workers-vert.
- **Eksakt faktureringsmatematikk per leverandør** (`src/core/`): Anthropic
  28px-patcher + 3–4 tokens/blokk overhead (egen sweep, null avvik), OpenAI-
  og Gemini-formler revidert mot offisiell dokumentasjon. Eksportert ved
  pakkeroten (`anthropicImageTokens`, `resolveAnthropicVisionTier`,
  nivåtak).
- **Målt produksjons-rendringskonfigurasjon**: tett 1-bit glyffatlas (ingen
  kantutjevning), standardnivå-sider — hvert valg understøttet av en
  benchmark-kvittering i `benchmarks/*/results/`.
- **Benchmark-rigger** (`benchmarks/`): billing-sweep (tokenregnskap) og
  density-frontier (lesenøyaktighetsfront på tvers av modeller/tetthet), kan
  kjøres på nytt via API, OpenRouter, Claude Code CLI, eller gjennom
  OmniRoute (`--via-omniroute`).
- **Avslag-gjenforsøk**: SSE/JSON-sniffer spiller av den opprinnelige
  forespørselen på nytt når en modell avslår den rendrede siden (kill switch
  `retryRefusalWithOriginal`).
- **LRU-rendringscache** for deterministiske sider.
- **OmniRoute-motor**: leveres som `omniglyph`-komprimeringsmotoren i
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (enkeltmodus og
  stablet pipeline), med fail-closed-porter og bildebevisst tokenregnskap.

### Tallene (alle reproduserbare)

- Eksempel på UI-rendring: 1015 tegn → 438×120 PNG, 254 → 84 tokens
  (**66,9 % spart**).
- Standardside 1568×728 = 1456 bildetokens uavhengig av hvor mye tekst den
  inneholder.
- Claude leser tette 1-bit-sider med 100 % ved produksjonstetthet; Opus 4.8
  leser 77–87 % ved 10×16.

### Negative beslutninger (målt, ikke meninger)

- **Høyoppløsningsnivået er en faktureringsfelle**: 1928²-siden faktureres
  WYSIWYG, men modellen mottar ikke full oppløsning — begge nivåene rendrer
  standardsider.
- **GPT-5.5 avvist**: 0/60 lesninger av den tette stripen og ~40×
  fullføringsoppblåsing mot tekstkontrollen.
- **gpt-4o-mini avbildes aldri** (2833/5667-tokengulvet gjør det ulønnsomt).
- **Gemini 2.5-flash konfabulerer** i stedet for å avstå på tette sider
  (0/26) — venter på ny test med betalt kvote.
