# Contributing to OmniGlyph

Danke für Ihr Interesse! Dieses Projekt hat zwei nicht verhandelbare
Kulturregeln — sie sind der Grund, warum jeder Zahl in der README vertraut
werden kann.

## Regel 1 — Strikte TDD

Jeglicher Produktionscode entsteht aus einem Test, der zuerst fehlgeschlagen ist:

1. Den Test schreiben und **beobachten, dass er aus dem richtigen Grund fehlschlägt**.
2. Das Minimum schreiben, um ihn bestehen zu lassen.
3. Refactoren, während alles grün bleibt.

Die vollständige Messlatte ist: `pnpm run typecheck && pnpm test && pnpm run build`
— alle drei, immer (Docs-Link-Lint und der Rebrand-Guard laufen innerhalb von
`pnpm test` über `tests/docs-integrity.test.ts`).

## Regel 2 — Messung vor Behauptungen

Keine Änderung an Geometrie, Atlas, Billing-Formel oder Modellumfang landet
ohne eine gemessene Zahl. Das Repository ist um diese Disziplin herum
aufgebaut:

- Billing-Kosten → mit `benchmarks/billing-sweep/` belegen (`count_tokens`
  ist kostenlos; erwartetes Residuum: null).
- Lesbarkeit → mit `benchmarks/density-frontier/` belegen (n≥30 pro Arm,
  deterministische Bewertung, JSONL-Belege in `benchmarks/*/results/`
  committet).
- Die Abnahmeschwelle für eine Änderung eines Produktions-Defaults: Gist ==
  Text-Baseline **UND** null stille exakte-String-Fehler **UND** positive
  Einsparungen.

Hypothesen ohne Zahlen gehen als Hypothesen nach `docs/ROADMAP.md` — niemals
als Fakten in die README. Zwei "offensichtliche" Ideen wurden bereits mit
Daten widerlegt (die Hochauflösungsseite, der Anti-Aliasing-Atlas); der
Prozess funktioniert.

## Setup

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI testet 20/22/24), pnpm 10 (fixiert über `packageManager` in
package.json).

## Struktur

| Ordner | Regel |
|---|---|
| `src/core/` | laufzeitunabhängig (nur Web-APIs — läuft auf Node und Workers) |
| `src/node.ts` / `src/worker.ts` | nur Host-Verkabelung |
| `benchmarks/` | erneut ausführbare Harnesses; JSONL-Ergebnisse sind Belege, committet |
| `docs/` | benchmarks/ (Zahlen), architecture/ (Karte), ROADMAP (Hypothesen), ops/ (OmniRoute) |

## Commits und PRs

- Conventional Commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), Body erklärt das *Warum* mit den relevanten Zahlen.
- Kleine, fokussierte PRs; Verhaltensänderungen kommen mit dem Test, der sie
  fixiert, und, wo zutreffend, dem Benchmark, der sie rechtfertigt.
- Keine `cache_control`-Blöcke des Clients umschreiben, keine
  Laufzeitabhängigkeiten ohne Diskussion hinzufügen (der Core ist bewusst
  abhängigkeitsarm), kein `Math.random`/Zeitstempel in Render-Pfaden
  verwenden (Determinismus ist eine harte Invariante, getestet durch
  Byte-Identität).
