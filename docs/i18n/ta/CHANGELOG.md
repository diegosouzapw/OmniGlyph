# Changelog

வடிவம்: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

முதல் பொது வெளியீடு.

### தயாரிப்பு

- **Context-as-image compression proxy**: ஒவ்வொரு LLM requestன் அடர்த்தியான பகுதிகளையும் (system prompt, tool docs, பழைய history, பெரிய tool outputs) அவை உங்கள் மெஷினை விட்டு வெளியேறும் முன்பே அடர்த்தியான 1-bit PNG பக்கங்களாக மீண்டும் எழுதுகிறது. Local Node server மற்றும் Cloudflare Workers host.
- **ஒவ்வொரு provider-க்கும் Exact billing math** (`src/core/`): Anthropic 28px patches +
  3–4 tokens/block overhead (சொந்த sweep, பூஜ்ஜிய residual), OpenAI மற்றும் Gemini
  formulas official docs-க்கு எதிராக audit செய்யப்பட்டன. Package root-இல் export செய்யப்பட்டது
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, tier caps).
- **அளவிடப்பட்ட production render config**: அடர்த்தியான 1-bit glyph atlas (anti-aliasing
  இல்லாமல்), standard-tier பக்கங்கள் — ஒவ்வொரு தேர்வும் `benchmarks/*/results/`-இல் ஒரு benchmark
  ஆதாரத்தால் ஆதரிக்கப்படுகிறது.
- **Benchmark harnesses** (`benchmarks/`): billing-sweep (token accounting) மற்றும்
  density-frontier (மாடல்கள்/densities முழுவதும் read-accuracy frontier), API, OpenRouter,
  Claude Code CLI, அல்லது OmniRoute மூலமாக (`--via-omniroute`) மறுஇயக்கக்கூடியது.
- **Refusal retry**: ஒரு மாடல் rendered பக்கத்தை refuse செய்தால் SSE/JSON sniffer
  அசல் requestஐ replay செய்கிறது (kill switch `retryRefusalWithOriginal`).
- Deterministic பக்கங்களுக்கான **LRU render cache**.
- **OmniRoute engine**: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-இல்
  `omniglyph` compression engine ஆக அனுப்பப்படுகிறது (single mode மற்றும்
  stacked pipeline), fail-closed gates மற்றும் image-aware token accounting-உடன்.

### எண்கள் (அனைத்தும் மறுஉருவாக்கக்கூடியவை)

- Sample UI render: 1015 chars → 438×120 PNG, 254 → 84 tokens (**66.9% சேமிப்பு**).
- Standard பக்கம் 1568×728 = 1456 image tokens அதில் எவ்வளவு உரை உள்ளது என்பதைப் பொருட்படுத்தாமல்.
- Claude production density-இல் அடர்த்தியான 1-bit பக்கங்களை 100%-இல் படிக்கிறது; Opus 4.8
  10×16-இல் 77–87% படிக்கிறது.

### எதிர்மறை முடிவுகள் (அளவிடப்பட்டவை, கருத்துக்கள் அல்ல)

- **High-res tier ஒரு billing trap**: 1928² பக்கம் WYSIWYG பில் செய்யப்படுகிறது ஆனால்
  encoder முழு resolution-ஐப் பெறுவதில்லை — இரண்டு tiers-உம் standard பக்கங்களை render செய்கின்றன.
- **GPT-5.5 நிராகரிக்கப்பட்டது**: அடர்த்தியான strip-இன் 0/60 reads மற்றும் text control-க்கு எதிராக
  ~40× completion inflation.
- **gpt-4o-mini ஒருபோதும் imaged செய்யப்படவில்லை** (2833/5667 token floor அதை unprofitable ஆக்குகிறது).
- **Gemini 2.5-flash** அடர்த்தியான பக்கங்களில் தவிர்ப்பதற்குப் பதிலாக confabulate செய்கிறது
  (0/26) — paid-quota retest நிலுவையில் உள்ளது.
