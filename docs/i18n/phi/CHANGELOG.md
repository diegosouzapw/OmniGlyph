# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

Unang pampublikong release.

### Ang produkto

- **Context-as-image compression proxy**: sinusulat-muli ang malalaking bahagi
  ng bawat LLM request (system prompt, dokumentasyon ng tool, lumang history,
  malalaking output ng tool) bilang siksik na 1-bit PNG pages bago pa man ito
  umalis sa iyong makina. Lokal na Node server at Cloudflare Workers host.
- **Eksaktong matematika ng billing kada provider** (`src/core/`): 28px na
  patches ng Anthropic + 3–4 tokens/block na overhead (sariling sweep, zero
  residual), mga formula ng OpenAI at Gemini na na-audit laban sa opisyal na
  dokumentasyon. Na-export sa root ng package (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, mga tier cap).
- **Sinukat na production render config**: siksik na 1-bit glyph atlas (walang
  anti-aliasing), mga pahina sa standard-tier — bawat desisyon ay may
  suportang benchmark receipt sa `benchmarks/*/results/`.
- **Mga benchmark harness** (`benchmarks/`): billing-sweep (pagbibilang ng
  token) at density-frontier (frontier ng katumpakan ng pagbasa sa iba't ibang
  modelo/densidad), maaaring paulit-ulit na patakbuhin sa pamamagitan ng API,
  OpenRouter, Claude Code CLI, o sa pamamagitan ng OmniRoute
  (`--via-omniroute`).
- **Refusal retry**: inuulit ng SSE/JSON sniffer ang orihinal na request kapag
  tumanggi ang isang modelo sa na-render na pahina (kill switch
  `retryRefusalWithOriginal`).
- **LRU render cache** para sa deterministic na mga pahina.
- **OmniRoute engine**: ipinapadala bilang ang `omniglyph` compression engine
  sa [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (single mode at
  stacked pipeline), na may fail-closed gates at image-aware na pagbibilang ng
  token.

### Ang mga numero (lahat ay maaaring paulit-ulit)

- Sample UI render: 1015 chars → 438×120 PNG, 254 → 84 tokens (**66.9% na natipid**).
- Standard page 1568×728 = 1456 image tokens anuman ang dami ng text na nilalaman nito.
- Nababasa ng Claude ang siksik na 1-bit pages sa 100% sa production density;
  nababasa ng Opus 4.8 ang 77–87% sa 10×16.

### Mga negatibong desisyon (sinukat, hindi opinyon)

- **Ang high-res tier ay isang billing trap**: ang 1928² na pahina ay
  sinisingil nang WYSIWYG ngunit hindi natatanggap ng encoder ang buong
  resolution — parehong tier ay nagre-render ng standard pages.
- **Tinanggihan ang GPT-5.5**: 0/60 na pagbasa sa siksik na strip at ~40× na
  pagpalaki ng completion kumpara sa text control.
- **Hindi kailanman na-image ang gpt-4o-mini** (ang 2833/5667 token floor ay
  ginagawa itong hindi kumikita).
- **Nagko-confabulate ang Gemini 2.5-flash** sa halip na umatras sa mga siksik
  na pahina (0/26) — hinihintay ang muling test na may paid-quota.
