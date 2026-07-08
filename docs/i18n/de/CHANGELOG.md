# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Semantic Versioning.

## [1.0.0] — 2026-07-07

Erste öffentliche Veröffentlichung.

### Das Produkt

- **Kontext-als-Bild-Kompressionsproxy**: schreibt die umfangreichen Teile jedes
  LLM-Requests (System-Prompt, Tool-Doku, alter Verlauf, große Tool-Ausgaben) in
  dichte 1-Bit-PNG-Seiten um, bevor sie Ihren Rechner verlassen. Lokaler
  Node-Server und Cloudflare-Workers-Host.
- **Exakte Billing-Mathematik pro Anbieter** (`src/core/`): Anthropic
  28px-Patches + 3–4 Tokens/Block Overhead (eigener Sweep, Residuum null),
  OpenAI- und Gemini-Formeln gegen die offizielle Dokumentation geprüft. An
  der Paket-Wurzel exportiert (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, Tarifobergrenzen).
- **Vermessene Produktions-Renderkonfiguration**: dichter 1-Bit-Glyphenatlas
  (kein Anti-Aliasing), Standard-Tarifseiten — jede Entscheidung durch einen
  Benchmark-Beleg in `benchmarks/*/results/` gestützt.
- **Benchmark-Harnesses** (`benchmarks/`): billing-sweep (Token-Abrechnung)
  und density-frontier (Lesegenauigkeits-Frontier über Modelle/Dichten
  hinweg), erneut ausführbar über API, OpenRouter, Claude Code CLI oder
  über OmniRoute (`--via-omniroute`).
- **Refusal-Retry**: SSE/JSON-Sniffer spielt den ursprünglichen Request
  erneut ab, wenn ein Modell die gerenderte Seite ablehnt (Kill-Switch
  `retryRefusalWithOriginal`).
- **LRU-Render-Cache** für deterministische Seiten.
- **OmniRoute-Engine**: wird als `omniglyph`-Kompressions-Engine in
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) ausgeliefert
  (Single-Modus und gestapelte Pipeline), mit Fail-closed-Gates und
  bildbewusster Token-Abrechnung.

### Die Zahlen (alle reproduzierbar)

- Beispiel-UI-Rendering: 1015 Zeichen → 438×120 PNG, 254 → 84 Tokens
  (**66,9 % gespart**).
- Standardseite 1568×728 = 1456 Bild-Tokens, unabhängig davon, wie viel Text
  sie enthält.
- Claude liest dichte 1-Bit-Seiten mit 100 % bei Produktionsdichte; Opus 4.8
  liest 77–87 % bei 10×16.

### Negative Entscheidungen (gemessen, keine Meinungen)

- **Die Hochauflösungsstufe ist eine Billing-Falle**: die 1928²-Seite wird
  WYSIWYG abgerechnet, aber der Encoder erhält nicht die volle Auflösung —
  beide Tarifstufen rendern Standardseiten.
- **GPT-5.5 abgelehnt**: 0/60 Lesevorgänge des dichten Streifens und ~40×
  Completion-Aufblähung gegenüber der Textkontrolle.
- **gpt-4o-mini wird nie verbildlicht** (2833/5667-Token-Untergrenze macht
  es unwirtschaftlich).
- **Gemini 2.5-flash konfabuliert** statt sich bei dichten Seiten zu
  enthalten (0/26) — erneuter Test mit bezahltem Kontingent ausstehend.
