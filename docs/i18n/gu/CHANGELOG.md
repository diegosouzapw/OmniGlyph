# Changelog

ફોર્મેટ: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

પ્રથમ જાહેર રિલીઝ.

### પ્રોડક્ટ

- **Context-as-image compression proxy**: દરેક LLM request ના વિપુલ ભાગોને
  (system prompt, tool docs, જૂનો history, મોટા tool outputs) તમારા મશીનમાંથી
  નીકળતા પહેલા ઘટ્ટ 1-bit PNG પેજમાં ફરીથી લખે છે. લોકલ Node સર્વર અને
  Cloudflare Workers host.
- **દરેક પ્રોવાઇડર માટે ચોક્કસ બિલિંગ મેથ** (`src/core/`): Anthropic 28px patches +
  3–4 tokens/block overhead (પોતાનું sweep, શૂન્ય રેસિડ્યુઅલ), OpenAI અને Gemini
  formulas સત્તાવાર docs સામે audit કરેલા. Package root પર export થાય
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, tier caps).
- **માપેલું પ્રોડક્શન રેન્ડર કન્ફિગ**: ઘટ્ટ 1-bit glyph atlas (anti-aliasing
  વગર), standard-tier પેજ — ઉપરની દરેક પસંદગી પાછળ `benchmarks/*/results/`
  માં એક benchmark રસીદ છે.
- **Benchmark harnesses** (`benchmarks/`): billing-sweep (token accounting) અને
  density-frontier (મોડેલ્સ/densities પર read-accuracy frontier), API,
  OpenRouter, Claude Code CLI, અથવા OmniRoute દ્વારા (`--via-omniroute`)
  ફરીથી ચલાવી શકાય તેવા.
- **Refusal retry**: SSE/JSON sniffer મૂળ request ને ફરીથી ચલાવે છે જ્યારે કોઈ
  મોડેલ રેન્ડર કરેલા પેજને refuse કરે (kill switch `retryRefusalWithOriginal`).
- ડિટરમિનિસ્ટિક પેજ માટે **LRU render cache**.
- **OmniRoute engine**: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)
  માં `omniglyph` compression engine તરીકે મોકલાય છે (single mode અને
  stacked pipeline), fail-closed gates અને image-aware token accounting સાથે.

### આંકડા (બધા પુનઃઉત્પાદનક્ષમ)

- Sample UI render: 1015 chars → 438×120 PNG, 254 → 84 tokens (**66.9% બચત**).
- Standard page 1568×728 = 1456 image tokens, તેમાં કેટલું ટેક્સ્ટ છે તેને ધ્યાનમાં લીધા વગર.
- Claude પ્રોડક્શન density પર ઘટ્ટ 1-bit પેજ 100% પર વાંચે છે; Opus 4.8
  10×16 પર 77–87% વાંચે છે.

### નકારાત્મક નિર્ણયો (માપેલા, અભિપ્રાયો નહીં)

- **High-res tier એક બિલિંગ ટ્રેપ છે**: 1928² પેજ WYSIWYG બિલ થાય છે પણ
  encoder ને પૂરું resolution મળતું નથી — બંને tiers standard પેજ રેન્ડર કરે છે.
- **GPT-5.5 નકારેલું**: ઘટ્ટ strip ના 0/60 reads અને text control ની સામે
  ~40× completion inflation.
- **gpt-4o-mini ક્યારેય imaged નથી** (2833/5667 token floor તેને
  unprofitable બનાવે છે).
- **Gemini 2.5-flash** ઘટ્ટ પેજ પર abstain કરવાને બદલે confabulate કરે છે
  (0/26) — paid-quota retest બાકી.
