# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [Unreleased]

### Docs

- **docs:** add a "Use with Claude clients" section to the README (and all 41
  translations) covering Claude Code CLI on macOS/Linux, the **Windows
  PowerShell** variant (`$env:ANTHROPIC_BASE_URL`), and **Claude Desktop** setup.
  (thanks @ousamabenyounes)

## [Unreleased]

### Added

- **feat(openai):** compress completed **Responses tool pairs**. The Responses
  leg no longer collapses a contiguous transcript prefix: it images only OLD,
  unambiguously completed `function_call`/`function_call_output` pairs, each
  replaced at its original position, while messages, reasoning/compaction
  items, open calls, malformed/orphan shapes and the newest completed pairs
  (default 6, `gptHistory.keepRecentPairs`) stay native. The history-image
  budget rises to 32 pages (override with `OMNIGLYPH_GPT_HISTORY_MAX_IMAGES`,
  clamped 1–100). Every Responses request also records a local o200k
  **composition breakdown** (instructions / tool JSON / function calls &
  outputs / reasoning / compaction) persisted to JSONL and rendered in the
  dashboard Details panel, and each dashboard page thumbnail now maps to the
  exact source text that produced that page.
- **feat(grok):** opt-in support for xAI **Grok** on the OpenAI-compatible wire.
  Grok renders at an effective 9×12 cell (denser than the 5×8 default) with the
  verbatim fact-sheet, is priced by a measured ~1000 tokens/megapixel model and
  xAI cache/output rates, and stays **fail-closed**: even in `OMNIGLYPH_MODELS`
  it is text-only until an operator explicitly acks the risk via
  `OMNIGLYPH_UNVERIFIED_MODELS=grok-4.5` — pending OmniGlyph's own reading
  receipt. The OpenAI-wire profile resolver is now provider-neutral and accepts
  the `OMNIGLYPH_MODEL_PROFILES` env (legacy `OMNIGLYPH_GPT_PROFILES` still
  works).
- **feat(node):** the Node proxy's OpenAI leg falls back to the **Codex ChatGPT
  login** (`~/.codex/auth.json`, override with `OMNIGLYPH_CODEX_AUTH_FILE`) when
  `OPENAI_API_KEY` is unset. An explicit `OPENAI_API_KEY` still wins; only the
  `chatgpt` auth mode is honored (an `api-key` file is ignored). `node.ts` runs
  `main()` only as a direct entrypoint now, so the config can be unit-tested.
  (thanks @ousamabenyounes)
- **bench(gate-backtest):** a cache-aware realized-savings reconciliation and
  gate-policy back-test (`benchmarks/gate-backtest/run.mjs`). Streams the proxy
  log (`~/.omniglyph/events.jsonl` or `$OMNIGLYPH_LOG`), reconstructs sessions
  from `first_user_sha8` + `ts`, and scores hypothetical passthrough gates using
  only what the proxy knows at transform time — an honest test of a shippable
  rule. Scoring mirrors `src/core/baseline.ts` exactly. (thanks @akigogikar)
- **feat(secret-guard):** opt-in detection of live credentials (API keys, PEM
  blocks, bearer tokens, secret-named assignments, high-entropy values) in any
  text bound for a rendered artifact — image, factsheet line, or IDS block.
  `OMNIGLYPH_GUARD_SECRETS=text` keeps the whole block native instead of
  imaging it; `redact` masks each match in place (short prefix +
  `[REDACTED:kind]`) so the rest of the block still images normally. Off by
  default and traffic-invariant: the guard only changes what gets rendered,
  never what the upstream API receives. Hit counts (never the matched text)
  are persisted per request as `secret_hits`. (thanks @rYo-STUDIO-1bit)

### Changed

- **feat(grok):** repack the opt-in Grok render profile from the dense
  effective 9×12 cell to **stock Spleen 5×8 on white AA** — no grid, 152-col
  strip (768px short-side floor), short 512px pages. Upstream re-measured
  pure-image on grok-4.5: the dense cell confabulates exact IDs, while white
  5×8 + an in-image **IDS block** is the stable exact-recall recipe. That IDS
  block (`appendIdsBlock`: hex/uuid/camel/path/port tokens, one per rendered
  row, max 16, deterministic) now rides inside **every** imaged path — the
  Anthropic slab, tool results, collapsed history, and both OpenAI-wire slab
  and history legs — as defense in depth beside the text fact-sheet. The
  fact-sheet budget grows 64 → 96 tokens and `factSheetText` pages past the
  262 KiB scan bound so late identifiers still surface. The OpenAI-wire
  profitability gate now bills the **last page at its residual height** (not a
  full strip) and uses the real **o200k** count as its default text baseline
  (`grok-billing.test.ts` renders real PNGs and matches the gate token for
  token). New render knobs (`inkDilate`/`inkDilateAxis`, `invert`,
  `colorByClass`, `classTick`, `paperGray`) stay off in production and are
  retunable per model via `OMNIGLYPH_MODEL_PROFILES`. Grok itself remains
  **fail-closed** (`OMNIGLYPH_UNVERIFIED_MODELS` ack still required) pending
  OmniGlyph's own reading receipt in `eval/grok-density`.
- **test:** pin `OMNIGLYPH_MODELS` to the built-in default scope in the
  savings-math e2e so the file is deterministic regardless of a developer's
  ambient shell. The GPT cases drive `gpt-5.6`; a shell that exports a narrowed
  `OMNIGLYPH_MODELS` (excluding GPT) previously made them fail on env alone.
  Snapshot/set/restore, same convention as `proxy-usage.test.ts`. Assertions
  unchanged.
- **test:** raise the Vitest per-test timeout to 30s so genuinely slow render
  e2e cases (full reflow + PNG encode) are not false-negative timeouts on
  slower/CI machines. Assertions are unchanged. (thanks @ousamabenyounes)

### Fixed

- **fix(transform):** the profitability gate no longer counts the reflow ↵
  sentinel as a visual row break. Reflow packs hard newlines into one
  soft-wrapped stream (↵ is an inline glyph the renderer never breaks on), so
  treating it as a break overstated image pages up to ~6× on reflowed history —
  which flipped genuinely profitable history collapses to `not_profitable` and
  left savings on the table. The gate now counts visual rows exactly as the
  renderer wraps them.
- **fix(factsheet):** capture transactional exact-token classes — email
  addresses, IBAN-like account strings, and currency amounts (`$14,360`). They
  join the protected tier-0 anchors (alongside SHAs, UUIDs, `CONST_IDS`, tickets,
  flags, numbers) so they are never dropped from the exact-value factsheet.
  (thanks @ousamabenyounes)
- **fix(factsheet):** protect multi-hump camelCase/PascalCase identifiers
  (`tokenLedgerShard`, `extractFactSheetTokens`) — the residual OCR miss class
  from the legibility audit. They land in tier 1, strictly below the byte-critical
  tier-0 shapes (SHAs, UUIDs, CONST_IDS, tickets, flags, numbers), so they can
  never evict a byte-critical token from the 64-token budget. (thanks @rldyourmnd)
- **fix(prompting):** the imaged session-configuration banner and the
  history-transcript framing now instruct the model to defer exact identifiers,
  hashes, version strings, and numbers to the exact-value factsheet or the
  source text, instead of guessing a value seen only in an image. (thanks @rldyourmnd)
- **fix(transform):** pass tool-search managed tools through the tool rewrite
  untouched. A tool marked `defer_loading: true` (or the server `tool_search_tool_*`
  itself) is not injected into context until the model searches for it — the API
  bills it at ~zero until then. Imaging its docs materialized documentation the
  API was keeping free, inflating every request (a large MCP surface ships
  hundreds of deferred tools — ~477k chars observed). They now pass through
  byte-identical and stay out of the imaged Tool Reference; a new
  `deferred_tools_skipped` telemetry field reports how many were exempted.
  (thanks @byingyang)
- **fix(openai):** stop double-billing native GPT tool descriptions. On the GPT
  path the native `tools[]` keep their `description` (only schema annotations are
  stripped), so imaging the description billed it twice — native text **and**
  image pixels — while the savings baseline credited only the stripped-schema
  delta. The imaged tool doc is now heading + schema only; the rendered-context
  framing no longer claims the image holds "full tool" docs. (thanks @rldyourmnd)

## [1.2.0] — 2026-07-08

Documentation and a test-only hardening pass. No change to the compression
path, billing math or dashboard behavior.

### Security

- **Resolve a CodeQL `js/regex/missing-regexp-anchor` alert** in the
  docs-integrity guard. The upstream-credit assertion matched its target link
  with an unanchored regex; it now uses a literal, scheme-qualified substring
  check instead — stricter (a bare host mention no longer satisfies it) and
  regex-free. Test-only; no change to shipped behavior.

### Docs

- **Offline export, documented.** New README section (mirrored across the 41
  translations) showing how to render context to PNG pages with `omniglyph
  export` — no proxy, no Claude Code — for pasting into Cursor, ChatGPT, or any
  chat that reads images. Two new FAQ entries cover using OmniGlyph outside
  Claude Code and how the text→image render works. Documentation only; no
  behavior change.

## [1.1.0] — 2026-07-08

Dashboard release. The compression path and billing math are unchanged; this is
a full rebuild of the local dashboard plus documentation.

### Added

- **Multi-page dashboard**, visually aligned with the OmniRoute family (coral/
  indigo palette, graph-paper backdrop, warm shadows). Six server-rendered
  pages behind real routes: **Overview** (mission-control KPI grid — savings %,
  $ saved, latency p95, first-byte, cache hits, errors, imaged chars — with a
  savings sparkline and a live event feed), **Live Flow** (the pipeline as a
  dependency-free SVG node graph with a particle per request), **Telemetry**
  (a token/$ odometer and a live request timeline; the image-vs-text breakdown
  and image↔source inspector live here), **Benchmarks**, **Sessions**, and
  **History**.
- **Benchmarks from the UI**: the harness receipts are rendered straight from
  `benchmarks/*/results/*.jsonl` (one row per model·config experiment), and the
  harnesses run from the page — `$0` dry-runs stream their stdout live; live
  runs stay gated behind `ANTHROPIC_API_KEY` and an explicit cost confirmation.
  Closed-enum, shell-less spawn, one run at a time; results stay append-only
  through the harness.
- **Live updates over SSE** (`GET /events/stream`): per-request frames and a
  stats snapshot push from the proxy, refreshing fragments instantly and
  driving the odometer and flow particles. Polling remains the fallback.
- **Dashboard localized into 42 languages** with a flag language selector in the
  top bar (`omniglyph_lang` cookie, falling back to `OMNIGLYPH_LANG`/`LC_ALL`/
  `LANG`, English fail-closed). RTL locales (`ar`, `fa`, `he`, `ur`) render
  mirrored.
- Accessibility pass: skip-link, nav landmarks, focus-visible rings, an
  `aria-live` odometer, consolidated `prefers-reduced-motion`, and AA contrast.

### Changed

- Every dashboard percentage still derives from the cache-weighted pair and a
  weighted net loss renders as a loss — the same honesty invariant as before,
  now applied across the KPI grid, flow ribbon and telemetry.

### Fixed

- Dashboard nav/KPI/theme icons use emoji glyphs instead of rare Unicode
  symbols, so they render everywhere instead of falling back to tofu boxes on
  font stacks that lack those symbols.

### Docs

- README gains a **dashboard** section (with screenshots) and an
  **Acknowledgments** section crediting the upstream context-as-image discovery
  and the Spleen/Unifont typefaces; both translated across the 41 locale
  READMEs. New library-use and FAQ sections; refreshed ROADMAP, `llm.txt` and
  wiki.

## [1.0.2] — 2026-07-08

Release-automation only. No change to the package's code or behavior.

### Changed

- Releases now publish from GitHub Actions via **npm trusted publishing (OIDC)**,
  so every release carries **provenance** and no long-lived npm token is used.
- Each release is also mirrored to **GitHub Packages** as
  `@diegosouzapw/omniglyph` (the npmjs.com package stays unscoped `omniglyph`).

## [1.0.1] — 2026-07-08

Security and documentation release. No behavior change to the compression path.

### Security

- **Resolve all CodeQL code-scanning alerts.** Rewrote regex-heavy hot paths to
  run in linear time (the tag sniffer and `<env>` extraction in `transform.ts`
  now locate delimiters with `indexOf` instead of backtracking regexes; trailing
  slash/space strips and variant-tag stripping became linear scans). Closed two
  time-of-check/time-of-use file reads (`export-collect.ts` and the reflow corpus
  reader now `fstat` the same fd they read). Fixed an automatic-semicolon-insertion
  hazard in `render.ts`.

### Docs

- Documentation translated into **41 languages** under `docs/i18n/`, with a
  localized CLI `--help` (`OMNIGLYPH_LANG`). English remains the source of truth.
- Visual benchmark explainers (text-vs-image token bars, the patch grid the API
  bills, the cost×accuracy frontier, the three-outcome scoring legend).
- Standard community health files (issue/PR templates, CODEOWNERS, FUNDING) and
  the AI-assistant contributor guides (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`).

## [1.0.0] — 2026-07-07

First public release.

### The product

- **Context-as-image compression proxy**: rewrites the bulky parts of each LLM
  request (system prompt, tool docs, old history, large tool outputs) into dense
  1-bit PNG pages before they leave your machine. Local Node server and
  Cloudflare Workers host.
- **Exact per-provider billing math** (`src/core/`): Anthropic 28px patches +
  3–4 tokens/block overhead (own sweep, zero residual), OpenAI and Gemini
  formulas audited against official docs. Exported at the package root
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, tier caps).
- **Measured production render config**: dense 1-bit glyph atlas (no
  anti-aliasing), standard-tier pages — every choice backed by a benchmark
  receipt in `benchmarks/*/results/`.
- **Benchmark harnesses** (`benchmarks/`): billing-sweep (token accounting) and
  density-frontier (read-accuracy frontier across models/densities), re-runnable
  via API, OpenRouter, Claude Code CLI, or through OmniRoute
  (`--via-omniroute`).
- **Refusal retry**: SSE/JSON sniffer replays the original request when a model
  refuses the rendered page (kill switch `retryRefusalWithOriginal`).
- **LRU render cache** for deterministic pages.
- **OmniRoute engine**: ships as the `omniglyph` compression engine in
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (single mode and
  stacked pipeline), with fail-closed gates and image-aware token accounting.

### The numbers (all reproducible)

- Sample UI render: 1015 chars → 438×120 PNG, 254 → 84 tokens (**66.9% saved**).
- Standard page 1568×728 = 1456 image tokens regardless of how much text it holds.
- Claude reads dense 1-bit pages at 100% on production density; Opus 4.8 reads
  77–87% at 10×16.

### Negative decisions (measured, not opinions)

- **High-res tier is a billing trap**: the 1928² page is billed WYSIWYG but the
  encoder does not receive full resolution — both tiers render standard pages.
- **GPT-5.5 rejected**: 0/60 reads of the dense strip and ~40× completion
  inflation vs text control.
- **gpt-4o-mini never imaged** (2833/5667 token floor makes it unprofitable).
- **Gemini 2.5-flash confabulates** instead of abstaining on dense pages
  (0/26) — pending paid-quota retest.

### Acknowledgments

Several fixes that shipped in this first release originated with outside
contributors; crediting them here retroactively:

- **`/v1/models` auth-style routing:** never forward an `sk-ant` OAuth bearer
  (Claude Code subscription auth) to the OpenAI upstream — a credential leak and
  a guaranteed 401. (thanks @XyraSinclair)
- **Schema stripper keeps `$schema`/`$id`:** stripping the dialect declaration
  re-dialected draft-07 schemas to 2020-12 and 400'd legal tuple-form `items`.
  (thanks @Monivancan)
- **Dashboard `hx-vals` escaping:** a crafted model id could break out of the
  single-quoted attribute; the value is now HTML-escaped, closing the JSON
  injection and the attribute-breakout XSS. (thanks @dex0shubham)
