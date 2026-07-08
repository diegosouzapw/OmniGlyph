# Security Policy

## Sicherheitslücken melden

Eröffnen Sie einen privaten Sicherheitshinweis (private security advisory) auf
GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) oder
kontaktieren Sie den Maintainer direkt (diegosouza.pw@outlook.com). Öffnen Sie
kein öffentliches Issue für eine ausnutzbare Sicherheitslücke.

## Bedrohungsmodell (was OmniGlyph ist)

OmniGlyph ist ein **lokaler Proxy** zwischen Ihrem Client (z. B. Claude Code)
und den LLM-APIs. Konstruktionsbedingt sieht er den gesamten Inhalt Ihrer
Sitzung sowie Ihre Anmeldedaten während der Übertragung. Die entsprechenden
Sicherheitsentscheidungen:

- **Bindet standardmäßig an Loopback** (`127.0.0.1`): das Dashboard hat keine
  Authentifizierung und liefert erfassten Sitzungskontext aus (Quelltext der
  Bilder, Telemetrie). `HOST=0.0.0.0` ist ein ausdrückliches Opt-in und legt
  all das im Netzwerk offen — nur in einem vertrauenswürdigen Netzwerk
  verwenden.
- **Anmeldedaten**: der Proxy leitet die Auth-Header des Clients an das
  Upstream weiter und speichert sie nicht dauerhaft. Über Umgebungsvariablen
  bereitgestellte Schlüssel (`ANTHROPIC_API_KEY` usw.) bleiben im Speicher.
- **Lokale Telemetrie**: `~/.omniglyph/events.jsonl` enthält Metadaten pro
  Request (Token-Zahlen, Body-Hashes) und, bei 4xx-Fehlern, komprimierte
  Body-Beispiele — behandeln Sie die Datei als sensibel.
- **Verbildlichter Inhalt ist verlustbehaftet**: byte-exakte Werte (Secrets,
  Hashes) dürfen niemals von Bildlesevorgängen abhängen; die Pipeline hält sie
  als Text vor, aber die goldene Regel lautet: keine Secrets in den
  LLM-Kontext geben.
- **Lieferkette**: `pnpm-workspace.yaml` erzwingt ein `minimumReleaseAge` von
  3 Tagen für jedes neue Paket; der Core hat eine einzige Laufzeitabhängigkeit.

## Unterstützte Versionen

Nur die aktuellste Release-Linie (`main` / neuestes `v1.x`) erhält Fixes.
