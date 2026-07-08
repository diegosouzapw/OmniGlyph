# OmniGlyph — Konsolidierte Messungen (2026-07-05)

🌐 Übersetzt: [alle Sprachen](../../../README.md)

Alles GEMESSEN in dieser Sitzung, mit Quelle und n; Hypothesen am Ende klar
getrennt aufgeführt. Belege: `benchmarks/billing-sweep/results/` und
`benchmarks/density-frontier/results/` (JSONL pro Antwort).

## TL;DR — das gesamte Ergebnis in zwei Balken

**Kosten** — eine Standardseite von 1568×728 fasst 28.080 Zeichen für
pauschal 1.460 Tokens; derselbe Text roh gesendet kostet ~10× mehr:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Genauigkeit** — aber nur dort, wo das Modell die Seite tatsächlich liest.
Das Gate ist fail-closed; nur die ✅-Zeile geht in Produktion:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Der Rest dieses Dokuments sind die Belege hinter diesen beiden Balken.

## 1. Anthropic-Billing (direktes count_tokens, $0, 11 Geometrien × 2 Modelle)

Bestätigte Formel: `tokens = ceil(w/28) × ceil(h/28)` nach Größenanpassung
pro Tarifstufe, **+3/Block (Fable 5) / +4/Block (Sonnet 4.5)** — NULL
Residuum über alle Zeilen.

| Probe | Abmessungen | Fable 5 (High-Res) | Sonnet 4.5 (Standard) |
|---|---|---:|---:|
| Dokumentanker | 1092×1092 | 1524 | 1525 |
| Dokumentanker | 1000×1000 | 1299 | 1300 |
| Standardseite | 1568×728 | 1459 | 1460 |
| **Große Seite** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (Resampling) |
| High-Res-Obergrenze | 1960×1960 | 4764 (Clamp) | 1525 |
| High-Res lange Kante | 2576×1204 | 3959 | 1516 |
| Hoher Streifen | 768×1932 | 1935 | 1292 (Resampling) |
| 2×1092² (mehrfach) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 Bilder) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→Downscale, NICHT abgelehnt bei count_tokens) | 3585 |

Abgeleitete Entscheidungen (umgesetzt): exaktes Patch-Gate; Tarifstufe pro
Modell (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = High-Res); `cols` 313→312.

## 2. Lesegenauigkeit (density-frontier, Hex/camelCase/Ziffern-Nadeln + Distraktoren)

### Fable-5-2×2-Matrix — via CLI/Abo, n=30/Arm, gleicher Korpus (~16,6k Zeichen)

| Seite × Atlas | exakt | Enthaltungen (ILEGIVEL) | stille Fehler |
|---|---:|---:|---:|
| Standard 1568×728 · **1-bit** | **30/30 (100 %)** | 0 | 0 |
| Standard 1568×728 · AA | 25/30 (83 %) | 5 | 0 |
| High-Res 1928×1928 · **1-bit** | 20/30 (67 %) | 10 | 0 |
| High-Res 1928×1928 · AA | 0/30 | 29 | 1 (durch die Matrix vorhergesagt) |

→ **1-bit > AA auf beiden Seiten; null Konfabulation über 120 Fragen.**
ANGEWENDET: `DENSE_RENDER_STYLE` → `aa:false` (Commit 9a25585).
⚠️ High-Res kommt durch Transport-Resampling degradiert an (siehe H1/H3);
die 67 % sind eine Untergrenze, keine Obergrenze.

### Opus 4.8 — via CLI/Abo, n=30/Arm

| Konfiguration | exakt | Enthaltungen | Fehler |
|---|---:|---:|---:|
| High-Res · 10×16-Zelle | **26/30 (87 %)** | 0 | 4 (Ziffern) |
| Standard · 5×8-Zelle | 0/30 | 30 | 0 |

→ Opus-Knick mit eigener n bestätigt (Upstream maß 95 % bei 10×16 mit
n=20). "Opus-Sicherheitsmodus" ist tragfähig: 10×16 auf der großen Seite ≈
1,7 Zeichen pro Bild-Token im Harness-Korpus.

### Via OpenRouter (gleicher Korpus/gleiche Fragen) — nicht schlüssig für Lesbarkeit

| gemessene Tatsache | Zahl |
|---|---|
| content_filter bei Transkriptionsfragen (Standardseiten) | 60/60 (100 %) |
| content_filter bei High-Res-Seiten | 5-6/30 (~20 %) |
| Fable High-Res: Enthaltungen + Fehler | 20 ILEGIVEL + 5 Fehler (2 vorhergesagt) |
| Opus 10×16 (bevor das Kontingent zur Neige ging) | 7/9 exakt (78 %) |
| durch die Verwechselbarkeitsmatrix vorhergesagte Fehllesungen | 4→a, 0→8, S/s-Groß-/Kleinschreibung |

### Transport-Vergleich (gleiche Frage, gleicher Inhalt)

| Transport | Filter/Ablehnung | große Seite lesbar? |
|---|---|---|
| Direkte API (n=9, bevor das Kontingent zur Neige ging) | 0 | nicht getestet |
| OpenRouter | ~100 % Standard / ~20 % High-Res | nein (Verdacht: Resampling) |
| Claude Code CLI (Abo) | 0 content_filter; ~50 % der großen Batches stockten (behoben mit Chunks von 10 + Retry) | nein (Verdacht: Read verkleinert) |

## 3. Kosten pro Anbieter (offline, exakt — VOLLE Seiten, theoretisch)

| Anbieter · Seite | Tokens/Seite | Zeichen/Seite | **Zeichen/Token** | Status |
|---|---:|---:|---:|---|
| Anthropic Std 1568×728 (alle Modelle) | 1460 | 28.080 | **19,2** | gemessen |
| Anthropic High-Res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× weniger Bilder) | Billing gemessen; Lesbarkeit ausstehend (H1) |
| GPT-5 (Kachel) Streifen 768×2048 | 1190 | ~38.760 | **32,6** | geprüfte Docs |
| GPT-5.4/5.5 (Patch, original) bis 1568×5984 | ~9.163 | ~233k | **25,4** | Docs; Lesbarkeit ungetestet |
| gpt-4o-mini | 48.169/Streifen | — | **0,8 — NIE verbildlichen** | Docs (Bug D2 behoben) |
| Gemini-Kachel 1533×1152 (native Zuschnitt-Einheit 768) | 1032 | 43.615 | **42,3 ← bestes dokumentiertes** | Docs; Lesbarkeit ungetestet |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (wenn lesbar)** | Hypothese H6 |

## 4. Gefundene und behobene Bugs (Audit gegen offizielle Docs)

| ID | Bug | Auswirkung | Commit |
|---|---|---|---|
| D2 | gpt-4o-mini fiel in die Standard-Kachel 85/170 (tatsächlich: 2833/5667) | Kosten um ~33× unterschätzt — **invertiertes Gate** | e6bc75f |
| D1 | o4-mini-Multiplikator 1,62 (tatsächlich 1,72) | −5,8 % | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) mit Cap 10000 (tatsächlich 1536, kein original) | würde bei größeren Seiten brechen | e6bc75f |
| D4 | gpt-5-codex-mini im Kachel-Regime (tatsächlich: Patch 1536) | ≥+23 % unterschätzt | e6bc75f |
| D5 | detail:'original' für jedes Modell hartkodiert (existiert nur ab 5.4+) | vertragswidrig | e6bc75f |
| #44 | Beschreibungs-Stub in typisierte Tools injiziert → 400 + stiller Fallback | Einsparung ohne Signal auf null gesetzt | 0f66e32 |
| AA | AA-Atlas in der Produktion entgegen dem "nur für Eval"-Kommentar | −17pp Lesequote bei Fable | 9a25585 |
| — | Slab-cols 313 (1573px) → 0,997×-Resampling + zusätzliche Patch-Spalte | auf 312 korrigiert | Baseline |

## 5. Offene Hypothesen (was jede einzelne zum Abschließen kostet)

| ID | Hypothese | aktuelle Evidenz | entscheidender Test | Kosten |
|---|---|---|---|---|
| H1 | Die 1928²-Seite liest sich auf der direkten API ≥ Standard (WYSIWYG im Billing bewiesen) | Billing 4764 ohne Resampling; 1-bit liest bereits 67 % selbst degradiert | direkter A/B Std vs. High-Res (1-bit) | ~US$4 API |
| H2 | High-Res + 1-bit auf der direkten API ≈ 100 % bei 3,3× weniger Bildern | H1 + 2×2-Matrix | wie H1 | gleich |
| H3 | Der Read der CLI und OpenRouter verkleinern Bilder >1568/2000px | 5×8 stirbt und 10×16 überlebt AUF DERSELBEN Seite | eine 1928²-Seite mit 20×32-Glyphen pro Transport | ~US$0 (CLI) |
| H4 | Ablehnung hängt von der Formulierung ab (Agent-liest-eine-Datei ≈ 0 % vs. rohe API ≈ 100 %) | obiger Transport-Vergleich | Formulierungs-A/B auf dem echten Proxy-Pfad | niedrig |
| H5 | Gemini-Kachel 1533×1152 lesbar bei 5×8 (42 Zeichen/Tok) | keine | density-frontier mit GEMINI_API_KEY | ~kostenlos (Free-Tier) |
| H6 | media_resolution:low lesbar (116 Zeichen/Tok) | unwahrscheinlich (Low-Res-Encoder), aber niemand hat es gemessen | 1 Aufruf | ~kostenlos |
| H7 | GPT: Streifen-Lesbarkeit + Completion-Token-Inflation (PageWatch-Risiko) | Community sah −40 % Prompt, aber +Completion/2× Latenz | density-frontier mit OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyphen-Chirurgie (H~K, 0/8, 5/3…) verwandelt Enthaltungen in Lesevorgänge | nach 1-bit wurden ALLE Fable-Fehltreffer zu Enthaltungen | ~10 Bitmaps editieren + Matrix erneut ausführen | $0 (CLI) |
| H9 | Hellmodus (Schwarz-auf-Weiß) > invertiert | Literatur (Glyph-Paper, Tesseract); nie an einem kommerziellen VLM gemessen | Style-Flag + 2 Arme | $0 (CLI) |
| H10 | Opus bei 7×10 liegt zwischen 0 % (5×8) und 87 % (10×16) → guter Trade-off | Upstream-Kurve 35 % bei 7×10 (n=20) | 1 zusätzlicher Arm | $0 (CLI) |
| H11 | Retry-on-Refusal im Proxy rettet die ~50 % der gefilterten Batches | Ablehnung ist pro Aufruf stochastisch | implementieren + in Produktion messen | Code |

## 6. Offene operative Punkte

1. `gh auth login` → privates `diegosouzapw/omniglyph` erstellen + pushen (10 lokale Commits).
2. Anthropic-Guthaben (H1/H2, das Geometrie-Urteil) und OpenRouter (aufgebraucht).
3. **Die** im Chat offengelegten Anthropic- und OpenRouter-**Schlüssel rotieren**.
4. Code-Warteschlange: #45 (Schema-Strip Draft-07), Retry-on-Refusal (H11), Glyphen-Chirurgie (H8), Phase 4 (TS in den Skripten, GIFs, Docs, Dashboard v2), Phase 5 (OmniRoute-Engine).

## NACHTRAG 2026-07-06 — A/B via direkte API (165 Aufrufe): H1/H2 WIDERLEGT

| Konfiguration | exakt | Enth. | Ablehnung | Fehler |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA und 1-bit) | 0/60 | 0 | **60/60 Ablehnung** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 vorhergesagt) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 vorhergesagt) |
| opus hires 10×16 | **23/30 (77 %)** | 1 | 0 | 6 |

URTEIL: die High-Res-Stufe der 1928²-Seite wird WYSIWYG ABGERECHNET (4764
Tok, Sweep), aber der ENCODER erhält nicht die volle Auflösung — 1-2/30
gelesen, mit Einzelglyphen-Vertauschungsfehlern (6→8, a→4), der Signatur
eines internen Resamplings. **Billing ≠ Encoder-Eingabe → Falle: 3,3× die
Kosten, schlechtere Lesbarkeit.** ANGEWENDET: pageGeometryForTier()
zurückgenommen — beide Tarifstufen rendern 1568×728; Tarifstufen-Infrastruktur
beibehalten (exaktes Billing bleibt gültig, und die künftige Neuabstimmung
ist 1 Zeile). H3 aktualisiert: das "Transport-Resampling" war (auch) der
eigene Encoder der API. Ablehnung bei Transkription via rohe API: 100 % auf
der Standardseite (H4 bestätigt — nur die Agenten-Formulierung entkommt).
Opus 10×16 auf beiden Transporten bestätigt (77-87 %).

## NACHTRAG 2026-07-06 (2) — GPT-5.5-Batterie via direkte API: H7 abgeschlossen (FEHLGESCHLAGEN)

| Arm | wörtlich | Gist | Ausgabe/Antwort |
|---|---:|---:|---:|
| Streifen 768×2048 5×8 AA | 0/30 (18 Enth., 5 gefiltert, 7 Fehler) | 0/3 | 2.639 Tok |
| Streifen 5×8 1-bit | 0/30 (15 Enth., 5 gefiltert, 10 Fehler) | 1/3 | 2.383 Tok |
| TEXT (Kontrolle) | **30/30** | **3/3** | **62 Tok** |

GPT-5.5 kann 5×8-Glyphen nicht lesen (0/60; nicht einmal der Gist überlebt)
und bläht die Completion beim Versuch der Entzifferung ~40× auf
(2,4-2,7k Reasoning-Tokens pro Frage) — die Prompt-Einsparungen werden von
der Ausgabe aufgefressen. Die perfekte Textkontrolle beweist, dass Korpus
und Fragen einwandfrei sind. Bestätigt und quantifiziert das 5.5-Opt-in;
gpt-5.6 (Standard) bleibt ungetestet (Konto hat keinen Zugriff). Zukünftig
(H12): das GPT-Gate muss Ausgabe-Inflation modellieren, nicht nur
Prompt-Tokens.

## NACHTRAG 2026-07-06 (3) — Gemini 2.5-flash (TEILWEISE: Free-Tier-Kontingent brach mitten im Lauf zusammen)

Von den ~26 Bildantworten, die vor dem Kontingent-Ausfall durchkamen:
**0 korrekt, 1 Enthaltung, ~25 KONFABULATIONEN** — und das sind keine
Glyphen-Verwechslungen: es sind zufällige Ziffern
(`indexLedgerInd → 0040375615`), d. h. der Encoder sieht bei den getesteten
Dichten fast nichts (native Kachel 42 Zeichen/Tok und MEDIUM pauschal), und
2.5-flash ERFINDET statt sich zu enthalten (ignoriert die
ILEGIVEL-Anweisung). Textkontrolle: 3/3 bei den durchgekommenen. Keine
Ausgabe-Inflation (6-28 Tok/Antwort).

Vorläufiges Signal: H5/H6 tendieren bei 2.5-flash zu NEIN, mit einem
Fehlermodus, der SCHLECHTER ist als bei GPT (stille Konfabulation statt
Enthaltung) — Gemini würde zusätzliche Sicherungen im Proxy benötigen.
Noch abzuschließen: erneuter Lauf mit bezahltem Kontingent oder an einem
anderen Tag, und Test von gemini-2.5-pro (Flash ist der schwächste Leser in
der Familie). Die native Kachelseite hat weiterhin das beste DOKUMENTIERTE
Verhältnis (42,3 Zeichen/Token); es ist die Lesbarkeit, die infrage steht.

Kostenhinweis: Teilseiten (die letzte des Korpus) rechnen sich im
Kachel-Regime schlecht ab (geringere Höhe → kleinere Zuschnitt-Einheit →
mehr Kacheln) — das Auffüllen der letzten Seite auf 1152px Höhe ist eine
zwingende Optimierung, falls Gemini hinzukommt.
