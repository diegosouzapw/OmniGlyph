# Security Policy

## Reporting vulnerabilities

Open a private security advisory on GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) or
contact the maintainer directly (diegosouza.pw@outlook.com). Do not open a
public issue for an exploitable vulnerability.

## Threat model (what OmniGlyph is)

OmniGlyph is a **local proxy** between your client (e.g. Claude Code) and the
LLM APIs. By design it sees all your session content and your credentials in
transit. The corresponding security decisions:

- **Binds to loopback by default** (`127.0.0.1`): the dashboard has no
  authentication and serves captured session context (source text of the
  images, telemetry). `HOST=0.0.0.0` is an explicit opt-in and exposes all of
  that to the network — only use it on a trusted network.
- **Credentials**: the proxy forwards the client's auth headers to the
  upstream and does not persist them. Keys supplied via env
  (`ANTHROPIC_API_KEY` etc.) stay in memory.
- **Local telemetry**: `~/.omniglyph/events.jsonl` holds per-request metadata
  (token counts, body hashes) and, on 4xx errors, compressed body samples —
  treat the file as sensitive.
- **Imaged content is lossy**: byte-exact values (secrets, hashes) must never
  depend on image reads; the pipeline keeps them as text, but the golden rule
  is: don't put secrets in LLM context.
- **Supply chain**: `pnpm-workspace.yaml` enforces a `minimumReleaseAge` of
  3 days for any new package; the core has a single runtime dependency.

## Supported versions

Only the latest release line (`main` / most recent `v1.x`) receives fixes.
