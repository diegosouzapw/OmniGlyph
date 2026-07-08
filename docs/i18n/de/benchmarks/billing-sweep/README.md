# Anthropic-Vision-Billing-Sweep

Kostenloser `count_tokens`-Sweep, der zwei offene Geometriefragen entscheidet:

1. **Formel** — rechnet die API `ceil(w/28) × ceil(h/28)` Patches ab
   (aktuelle Docs) oder das zurückgezogene `w·h/750`? Die Sondenmenge trennt
   die beiden um 25–180 Tokens pro Zeile.
2. **Tarifstufe** — bekommt `claude-fable-5` die Hochauflösungs-Obergrenzen
   (lange Kante ≤ 2576 px, ≤ 4784 visuelle Tokens)? Die Zeile
   `page-old-1928x1928` ist der Entscheider: ≈ **4761** gemessen bedeutet
   High-Res-WYSIWYG (die alte große Seite trägt ~3,3× mehr Zeichen pro Bild
   als die heutige 1568×728, bei gleichem Zeichen/Token-Verhältnis); ≈
   **1521** bedeutet Resampling in der Standardstufe, und 1568×728 bleibt
   korrekt.

Kontext: der Sweep vom 2026-07-01 hinter der aktuellen 1568×728-Seite
(Lesbarkeits-Audit, 2026-07-01) wurde an `claude-sonnet-4-5` gemessen — ein
Modell der Standardstufe — während die Produktion auf Fable 5 zielt, das
die Vision-Docs in die Hochauflösungsstufe einordnen. Dieses Audit maß auch
die aktuelle Seite bei 1460 Tokens: näher an der Patch-Formel-Vorhersage
1456 als an der von /750 vorhergesagten 1522, was darauf hindeutet, dass
die API bereits auf Patch-Billing umgestellt hatte.

## Ausführen

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Muss die API **direkt** treffen — niemals über den OmniGlyph-Proxy, der den
Body transformieren würde. `count_tokens` ist kostenlos; der volle Sweep
macht ~25 Requests.

## Die Ausgabe lesen

Pro Modell zeigt jede Sondenzeile gemessene Bild-Tokens (mit Bild minus
Nur-Text-Baseline) gegen alle vier Vorhersagen
(`patch`/`legacy750` × `standard`/`highres`); die Zusammenfassung ordnet die
Hypothesen nach mittlerem absolutem Residuum. `--probe-multi` prüft die
Obergrenze pro Bild (2×1092² ≈ 2×1521); `--probe-20plus` prüft die
Über-20-Bilder-Regel (eine Seite >2000 px muss abgelehnt, nicht resampled
werden). Zeilen landen in `results/*.jsonl`; die Vorhersagemathematik lebt
in `formulas.mjs`, fixiert durch `tests/billing-sweep-formulas.test.ts`.

## Nach dem Urteil

- Patch-Formel bestätigt → OmniGlyph-PR #27 portieren (exakte
  Größenanpassungs-Übersetzung) und die
  `ANTHROPIC_PIXELS_PER_TOKEN`-Gate-Mathematik in `src/core/transform.ts`
  angleichen.
- Hochauflösungsstufe bei Fable bestätigt → eine Seitengeometrie pro
  Tarifstufe wieder einführen (Seiten der Klasse 1928×1928 für Fable/Opus
  4.8/Sonnet 5, 1568×728 für Standard), analog dazu, wie der GPT-Pfad bereits
  sein eigenes `GPT_MAX_HEIGHT_PX` beibehält.
