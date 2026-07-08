# Fork-Roadmap — "unser OmniGlyph" + OmniRoute-Integration

Konsolidierter Arbeitsplan (2026-07-05) aus: gemessenem Billing-Sweep,
OpenAI/Gemini-Audit gegen die offizielle Dokumentation, Analyse verwandter
Tools und dem density-frontier-Harness. Status jedes Punkts: ☐ ausstehend · ◐ teilweise · ☑ hier erledigt.

## Phase 0 — Messgrundlage (in diesem Repo ERLEDIGT)

- ☑ Exaktes Anthropic-Billing (28px-Patches, 2 Tarifstufen, +4/Block) — `src/core/anthropic-vision.ts`, Sweep in `benchmarks/billing-sweep/`.
- ☑ Profitabilitäts-Gate mit exakten Kosten (ersetzte w·h/750 × 1,10).
- ☑ Geometrie pro Tarifstufe: Fable/Opus 4.8/Sonnet 5 → 1928×1928-Seiten (3,3× weniger Bilder); Standard → 1568×728. 691 Tests grün.
- ☑ `benchmarks/density-frontier/`-Harness (Offline-Kosten × Genauigkeit via API, Nadeln mit verwechselbaren Distraktoren, deterministische Bewertung).

## Phase 1 — Multi-Provider-Billing-Fixes (im Audit bestätigte Bugs)

Priorität durch das Audit gesetzt (offizielle Docs erfasst am 2026-07-05):

1. ☐ **D2 (INVERTIERTES Gate)**: `gpt-4o-mini` fällt in die Standard-Kachel 85/170, kostet aber **2833 Basis / 5667 pro Kachel** (~33× unterschätzt, ~0,8 Zeichen/Token) — Verbildlichung ist bei ihm immer ein Verlust, und das Gate genehmigt es. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` wird bedingungslos gesendet (`src/core/openai.ts:392,402`), existiert aber nur ab gpt-5.4+; aus dem Profil ableiten.
3. ☐ **D1**: `o4-mini`-Multiplikator 1,62 → **1,72** (unterschätzt um 5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` liegen im Patch-Bucket **Cap 1536 ohne `original`** (Code nimmt 10000 an); `gpt-5-codex-mini` liegt im falschen Regime (Kachel → Patch).
5. ☐ **GPT-Geometrie**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (passt zu BEIDEN Regimes: 64×32 Patches und 4×512 Kacheln; +6,25 % kostenlose Zeichen). Dediziertes 5.4/5.5-`original`-Profil: bis zu 1568×5984 (9.163 Patches ≤ 10k, ~233k Zeichen in einem Block) — zuerst Lesbarkeits-A/B.
6. ☐ **Gemini-Unterstützung** (neu): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent`-Routen im Proxy. Dokumentierbare Geometrie: **1152×1536 (exakte Zuschnitt-Einheit 768, 4 Kacheln, 42,2 Zeichen/Token — bestes dokumentiertes Verhältnis der 3 Anbieter)**; zu kalibrierende Wetten: 768² mit `media_resolution:MEDIUM` (56,4) und Gemini 3 HIGH. Achtung: Geminis OpenAI-kompatibler Endpunkt würde durch den OpenAI-Transformer mit falschem Billing laufen.

## Phase 2 — Lesequalität (density-frontier-Harness als Richter)

- ◐ Entscheidender Std-vs-High-Res-A/B-Test auf Fable (läuft; Messlatte: Gist == Text UND null stille Fehler UND Einsparung > 0).
- ☐ Den AA-vs-1-Bit-Widerspruch im dichten Pfad auflösen (Code sagt "nur für Eval", Produktion verwendet AA).
- ☐ (ZURÜCKGESTELLT mit Begründung 2026-07-06) Glyphen-Chirurgie: die Produktionskonfiguration liest 30/30 — es gibt heute keinen messbaren Fehltreffer, den die Chirurgie beheben könnte. Erneut betrachten, falls ein Ziel unter 100 % in den Umfang kommt (z. B. Opus) oder neue Messungen eine Regression zeigen.
- ☑ ~~Hellmodus-A/B~~ AUFGELÖST durch Inspektion (2026-07-06): das Rendering IST BEREITS Schwarz-auf-Weiß (render.ts:635/822, Post-Blit-Invertierung) — passend zur Literatur; die Hypothese entstand aus einer falschen Prämisse (Upstream-Beispielbild).
- ☐ Wortliste mit Prüfsumme für byte-exakte IDs (Upstream #38, befürwortet) + Enthaltungs-Banner (#31/#32) + camelCase im Factsheet (#33/#34).
- ☑ Portierung von #45: $schema/$id erhalten, Tupel pro Element gestrippt (Commit auf main).
- ☑ Retry-on-Refusal (#37/H11): verlustfreier Replay-Sniffer + einzelner Retry mit dem Original-Body; refusalRetried-Telemetrie (Commit auf main).
- ☐ Rehydrate-Tool (`RecoverableBlock` → aufrufbares Tool; LensVLM validiert selektive Re-Expansion).

## Phase 3 — Performance/Robustheit

- ☐ LRU-Render-Cache (deterministisch nach Invariante; Slab + eingefrorene Chunks rendern heute bei jedem Request neu).
- ☐ PNG-Encoding in einem Worker-Thread; konfigurierbares Deflate-Level.
- ☐ Offene Upstream-Fixes portieren: #44 (typisierte native Tools → 400), #45 (Schema-Strip Draft-07 → 400-Loop), #42 (CONNECT-Proxy für Claude Desktop), #19 (GPT-Beschreibungen Doppelabrechnung).
- ☐ ADAPTIVE_CPT_PLAN implementieren (cpt pro Blockrolle; realer Slab = 1,50).

## Phase 4 — Der Fork selbst

- ☐ Eigener Name/Repo (Diegos Entscheidung) + Upstream-`git remote` für Cherry-Picks.
- ☐ **TS überall**: der Core ist bereits TS, `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` konvertieren (Muster: tsx + vitest; `benchmarks/density-frontier/` wurde bereits so geboren).
- ☐ OmniRoute-Qualitätsstandard: eslint 9 + prettier, CI mit typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README-i18n (zuerst pt-BR), semantischer CHANGELOG.
- ☐ **GIFs statt Videos** in der README (Aufnahme mit vhs/asciinema+agg; nebeneinander plain vs. proxy).
- ☐ Dashboard v2 (Neuimplementierung über HTTP-API — Drittanbietercode nicht übernehmen): "Terminal mit ANTHROPIC_BASE_URL öffnen"-Launcher, "geht der Traffic durch mich?"-Check, Bild-vs-Text-Inspektor, Sessions, Kostenpanel in Währung, leichtes i18n, SSE statt Polling, SQLite-Persistenz mit Aufbewahrung (das 24-Spalten-Schema ist ein guter Ausgangspunkt).
- ☐ Micro-Ideen aus dense-image-gen: `lines`-Modus (Layout erhalten für Code/Tabellen), `--keep-ws`, Ursprungstitel pro Seite ("system prompt" / "tool docs" / "history turn N"), eigenständige CLI `render arquivo.md -o out.png`.

## Phase 5 — Portierung nach OmniRoute

- ☐ `CompressionEngine`-Engine (`cavemanAdapter.ts`-Vorlage), registriert in `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Verkabelung: `supportsVision` in `chatCore.ts:1297` übergeben (1 Zeile) oder über `isVisionModelId` auflösen.
- ☐ Stack-Reihenfolge: zuletzt (RTK/Caveman/semantische Renderer zuerst; OmniGlyph verbildlicht den Rest).
- ☐ Invarianten: niemals Blöcke mit dem `cache_control` des Clients umschreiben (Lektion #4560); das Fidelity-Gate (#5127) braucht eine deklarierte Ausnahme oder ein Text-Factsheet, das die Invarianten erfüllt; Versuchs-Telemetrie mit `skip_reason` (Lektion #4268).
- ☐ Routing: Post-Engine-Fallback/Retry muss Vision-Fähigkeit und die Allowlist respektieren (erneut komprimieren oder umgehen).
- ☐ CCR-Synergie: `emitRecoverable` → CCR-Store mit Retrieval pro Slice (`head/tail/grep`, #5187) = vollständige selektive Re-Expansion.
- ☐ Kostenloses-Tier-Stretching als Marketing-Feature: jeder Free-Tier-Token liefert bei Vision-Modellen ~2-3× mehr Zeichen; Gemini-Free-Tier + 1152×1536-Geometrie ist der stärkste Fall.

## Offene Risiken

- Fable-Ablehnungen nach Redeploy im verbildlichten Kontext (Upstream #37) — abmildern vor Default-on in OmniRoute.
- Preis-Arbitrage: wenn Anthropic Vision neu bepreist, ändern sich die Einsparungen — das Pro-Request-Kontrafaktum (`count_tokens`) ist die Verteidigung.
- OpenAI: Community-Messung (PageWatch) sah steigende Completion-Tokens und 2× Latenz — pro Anbieter messen, bevor aktiviert wird.

## A/B-Ergebnisse 2026-07-05 (via OpenRouter — NICHT SCHLÜSSIG für Geometrie, gültig für Fehlermodi)

| Konfiguration | wörtlich | Enth. | gefiltert | still falsch |
|---|---|---|---|---|
| fable std 5×8 (AA und 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 vorhergesagt) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 vorhergesagt) |
| opus hires 10×16 | **7/9 gelesen** | 0 | 21 von Kontingent | 2 (Ziffer) |

Gültige Erkenntnisse: (1) der Klassifikator (Issue #37) ist der DOMINANTE
Fehlermodus für Transkriptionsfragen auf der Standardseite — 100 %
gefiltert — und greift nicht auf der großen Seite; die Formulierung ist
entscheidend. (2) Enthaltung funktioniert: 20× ILEGIVEL vs. 5 Konfabulationen
auf der großen Seite. (3) Opus bei 10×16 liest 78 % exakt (n=9) vs. 0 %
historisch bei 5×8 — erster direkter Beweis für den Knick. (4) Die
Unlesbarkeit der großen Seite via OpenRouter deutet auf ein Transport-
RESAMPLING hin (Bedrock/Vertex-Standardtarif?) — entscheidende Hypothese, um
sie an Anthropics direkter API zu testen; der Geometrie-A/B bleibt bis dahin
OFFEN. OpenRouter-Kontingent ging mitten im Opus-Arm zur Neige.

## Finale 2×2-Matrix (2026-07-05, via CLI/Abo, Fable 5, n=30/Arm)

| Seite × Atlas | 1-bit | AA |
|---|---|---|
| Standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 Enth. |
| High-Res 1928×1928 | **20/30 (67 %)** + 10 Enth. | 0/30 + 29 Enth. |

Null Konfabulation über die 4 Arme (120 Fragen — jeder Fehltreffer war
ILEGIVEL). ANGEWENDET: DENSE_RENDER_STYLE auf 1-bit (aa:false) umgestellt,
mit Pin in tests/dense-style.test.ts. Opus 4.8: 26/30 bei 10×16 auf der
großen Seite, 30/30 ILEGIVEL bei 5×8 — Opus-Sicherheitsmodus tragfähig. Die
High-Res-Seite bleibt durch die Transporte degradiert (CLI Read/OpenRouter-
Resampling); das WYSIWYG-Geometrie-Urteil hängt weiterhin von der direkten
API ab.
