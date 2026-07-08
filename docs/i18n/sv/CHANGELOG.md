# Ändringslogg

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantisk versionshantering.

## [1.0.0] — 2026-07-07

Första offentliga utgåvan.

### Produkten

- **Kontext-som-bild-kompressionsproxy**: skriver om de skrymmande delarna av
  varje LLM-förfrågan (systemprompt, verktygsdokumentation, gammal historik,
  stora verktygsutdata) till täta 1-bitars PNG-sidor innan de lämnar din
  dator. Lokal Node-server och Cloudflare Workers-värd.
- **Exakt faktureringsmatematik per leverantör** (`src/core/`): Anthropic
  28px-patchar + 3–4 tokens/block overhead (egen mätning, noll residual),
  OpenAI- och Gemini-formler granskade mot officiell dokumentation.
  Exporteras vid paketets rot (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, nivåtak).
- **Mätt produktionsrenderingskonfiguration**: tät 1-bitars glyfatlas (ingen
  kantutjämning), standardnivåsidor — varje val backat av ett
  benchmark-belägg i `benchmarks/*/results/`.
- **Benchmark-ramverk** (`benchmarks/`): billing-sweep (tokenredovisning) och
  density-frontier (läsnoggrannhetsgräns över modeller/densiteter), körbara
  igen via API, OpenRouter, Claude Code CLI, eller genom OmniRoute
  (`--via-omniroute`).
- **Avvisningsomförsök**: SSE/JSON-sniffer spelar upp den ursprungliga
  förfrågan igen när en modell avvisar den renderade sidan
  (dödomkopplare `retryRefusalWithOriginal`).
- **LRU-renderingscache** för deterministiska sidor.
- **OmniRoute-motor**: levereras som `omniglyph`-kompressionsmotorn i
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (enkelläge och
  staplad pipeline), med fail-closed-spärrar och bildmedveten
  tokenredovisning.

### Siffrorna (alla reproducerbara)

- Exempel på UI-rendering: 1015 tecken → 438×120 PNG, 254 → 84 tokens
  (**66,9 % sparat**).
- Standardsida 1568×728 = 1456 bild-tokens oavsett hur mycket text den
  innehåller.
- Claude läser täta 1-bitars sidor med 100 % vid produktionsdensitet;
  Opus 4.8 läser 77–87 % vid 10×16.

### Negativa beslut (mätta, inga åsikter)

- **Högupplöst nivå är en faktureringsfälla**: 1928²-sidan faktureras
  WYSIWYG men kodaren tar inte emot full upplösning — båda nivåerna
  renderar standardsidor.
- **GPT-5.5 avvisad**: 0/60 läsningar av den täta remsan och ~40×
  utdataförstoring jämfört med textkontroll.
- **gpt-4o-mini avbildas aldrig** (2833/5667-tokengolvet gör det olönsamt).
- **Gemini 2.5-flash konfabulerar** i stället för att avstå på täta sidor
  (0/26) — väntar på omtest med betald kvot.
