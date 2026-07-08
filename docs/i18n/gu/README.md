🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="એક વાસ્તવિક રેન્ડર: system prompt + tool docs એક ઘટ્ટ 1568×728 પેજમાં પેક કરેલા" width="820"/>

<br/>

# 🖼️ OmniGlyph — ઇમેજ તરીકે કૉન્ટેક્સ્ટ

### વિપુલ કૉન્ટેક્સ્ટને ઘટ્ટ PNG પેજ તરીકે રેન્ડર કરીને તમારું Claude બિલ **59–70%** ઘટાડો — એ જ કન્ટેન્ટ, ટોકનના એક નાના અંશમાં.

**મોડેલ્સ ટેક્સ્ટને ટોકન દીઠ બિલ કરે છે, પણ ઇમેજને તેના પરિમાણો પ્રમાણે બિલ કરે છે — તેમાં કેટલું ટેક્સ્ટ છે તેના આધારે નહીં.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-----)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#--)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) પરિવારનો ભાગ · [🌐 All languages](../../../docs/i18n/README.md)

</div>

---

# 📊 આંકડા — માપેલા, અંદાજેલા નહીં

| મેટ્રિક | પરિણામ | રસીદ |
|---|---|---|
| એન્ડ-ટુ-એન્ડ બિલ ઘટાડો | **59–70%** | પ્રોડક્શન ટ્રેસ, 13,709 requests |
| કન્વર્ટ થયેલા બ્લોક દીઠ ટોકન્સ | **10× ઓછા** (28,080 chars: 14,040 → 1,460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| બિલિંગ-ફોર્મ્યુલા ચોકસાઈ | 22 `count_tokens` પ્રોબ્સ, 2 મોડેલ × 2 ટિયર પર **શૂન્ય** રેસિડ્યુઅલ | `benchmarks/billing-sweep/results/` |
| પ્રોડક્શન કન્ફિગ પર ચોક્કસ-રીડ ચોકસાઈ | Claude Fable 5 પર **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| ~300 રીડ પ્રોબ્સમાં silent confabulations | **0** — દરેક ચૂક `ILEGIVEL` તરીકે abstain થાય છે | `benchmarks/density-frontier/results/` |

**મોડેલ સ્કોરકાર્ડ** (શું તે ઘટ્ટ રેન્ડર વાંચી શકે છે? n=30 પ્રતિ આર્મ, ડિટરમિનિસ્ટિક સ્કોરિંગ):

| મોડેલ | વાંચન | ચુકાદો |
|---|---|---|
| Claude **Fable 5** | **100%** exact | ✅ પ્રોડક્શન ટાર્ગેટ |
| Claude Opus 4.8 | 4× ગ્લિફ સાઇઝ પર 77–87% | ⚠️ opt-in safe mode (savings ઘટીને ~2× થાય છે) |
| GPT-5.5 | 0/60 — અને પ્રયત્નમાં તેના જવાબોને ~40× ફુલાવે છે | ❌ ગેટ દ્વારા બ્લોક, પુરાવા સાથે |
| Gemini 2.5-flash | 0/26 — અને abstain કરવાને બદલે confabulate કરે છે | ❌ બ્લોક (આંશિક ટેસ્ટ, quota-limited) |

ફાયદો આજે **Fable-વિશિષ્ટ** છે — બીજા vision encoders હજુ ઘટ્ટ ગ્લિફ્સને resolve નથી કરી શકતા. [benchmark harness](benchmarks/README.md) એક જ કમાન્ડમાં કોઈપણ નવા મોડેલને ફરીથી ટેસ્ટ કરે છે.

# 🤔 OmniGlyph શા માટે?

દરેક લાંબા સમય સુધી ચાલતું agent session દરેક request પર એ જ મૃત વજન ખેંચે છે: system prompt, tool docs, અને જૂનો history — દરેક turn પર ટોકન દીઠ ફરીથી બિલ થાય છે. OmniGlyph એક **લોકલ પ્રોક્સી** છે જે એ વિપુલ ભાગોને *તમારા મશીનમાંથી નીકળતા પહેલા જ* ઘટ્ટ PNG પેજમાં ફરીથી લખે છે:

- **ચોક્કસ બિલિંગ મેથ, હ્યુરિસ્ટિક્સ નહીં** — તે પ્રોવાઇડરના વાસ્તવિક image-token formula ની ગણતરી કરે છે (શૂન્ય રેસિડ્યુઅલ સુધી માપેલું) અને ત્યારે જ કન્વર્ટ કરે છે જ્યારે ગણિત ફાયદાકારક હોય.
- **ડિઝાઇન દ્વારા fail-closed** — જે મોડેલ્સ ઘટ્ટ રેન્ડર વાંચી શકતા નથી તેમને gate દ્વારા બ્લોક કરાય છે, benchmark રસીદ સાથે. કોઈ ચૂપચાપ ગુણવત્તા ગુમાવવાનું નહીં.
- **ખાનગી અને લોકલ-ફર્સ્ટ** — rewrite `127.0.0.1` પર થાય છે; ક્યાંય કંઈ વધારાનું મોકલાતું નથી.
- **પુનઃઉત્પાદનક્ષમ** — ઉપરની દરેક સંખ્યાની `benchmarks/*/results/` માં એક રસીદ છે, જે એક કમાન્ડમાં ફરીથી ચલાવી શકાય છે.

# ⚡ ઝડપી શરૂઆત

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

બંને રીતે કામ કરે છે:
- **API key** (ટોકન દીઠ ચૂકવણી): તમારું બિલ એન્ડ-ટુ-એન્ડ 59–70% ઘટે છે.
- **Subscription session**: તમે ઓછું ચૂકવતા નથી, પણ usage limits ટોકનમાં ગણાય છે — તેથી તમારી limits **~2–3×** સુધી ખેંચાય છે.

<http://127.0.0.1:47821/> પર ડેશબોર્ડ: બચેલા ટોકન્સ, દરેક text→image કન્વર્ઝન side by side, kill switch, live model chips. Responses સામાન્ય રીતે stream થાય છે — ફક્ત *request* કમ્પ્રેસ થાય છે, મોડેલનું output ક્યારેય નહીં.

# ⚙️ તે કેવી રીતે કામ કરે છે

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **બિલિંગની ગણતરી કન્વર્ટ કરતા પહેલા જ ચોક્કસ રીતે થાય છે**: Anthropic ઇમેજ દીઠ `⌈w/28⌉ × ⌈h/28⌉ + 4` ટોકન્સ બિલ કરે છે (28 px patches — શૂન્ય રેસિડ્યુઅલ સુધી માપેલું). એક પૂરું પેજ 1,460 ટોકન્સ માટે 28,080 chars લઈ જાય છે ≈ **19 chars/token**, ઘટ્ટ ટેક્સ્ટ માટે ~2 chars/token ની સામે. Gate ત્યારે જ કન્વર્ટ કરે છે જ્યારે ગણિત ફાયદાકારક હોય.
- **શું કન્વર્ટ થાય છે**: સ્ટેટિક system prompt + tool docs, જૂનો collapsed history, મોટા tool outputs.
- **શું ક્યારેય કન્વર્ટ થતું નથી**: તમારા messages, તાજેતરના turns, મોડેલનું output, sparse prose, byte-exact values (hashes/IDs ટેક્સ્ટ તરીકે સાથે ચાલે છે), અને કોઈપણ મોડેલ જે reading benchmark માં નિષ્ફળ ગયું હોય.

# 🧭 પ્રામાણિક ભાગ

- **તે lossy છે.** ઇમેજમાંથી byte-exact recall સ્વભાવે અવિશ્વસનીય છે. મોકલેલા ઉકેલો: ચોક્કસ identifiers ઇમેજની બાજુમાં ટેક્સ્ટ તરીકે જાય છે, અને માપેલા પ્રોડક્શન કન્ફિગે **શૂન્ય silent confabulations** આપ્યા — નિષ્ફળ reads abstain કરે છે.
- **આજે ફક્ત Fable 5 મંજૂર છે**, રસીદ સાથે. GPT-5.5 અને Gemini 2.5-flash માપી શકાય તેવી રીતે ઘટ્ટ રેન્ડર વાંચી શકતા નથી; Opus 4.8 ને 4× મોટા ગ્લિફ્સ જોઈએ. Gate આ લાગુ કરે છે.
- **અમને એક બિલિંગ ટ્રેપ મળ્યો અને ટાળ્યો**: high-resolution image tier પેજ દીઠ 3.3× વધુ બિલ કરે છે, પણ vision encoder ને વધારાનું resolution મળતું નથી — મોટા પેજ *ખરાબ* વંચાય છે. માપેલું, [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md) માં દસ્તાવેજીકૃત, સક્ષમ કરેલું નથી.
- ભાવ બદલાય છે; ટકાઉ મેટ્રિક ટોકન ઘટાડો છે, જેને પ્રોક્સી દરેક request માટે free `count_tokens` કાઉન્ટરફેક્ચ્યુઅલ સામે લોગ કરે છે.

# 🔬 દરેક સંખ્યાનું પુનઃઉત્પાદન કરો

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

પૂરી પદ્ધતિ અને દરેક પરિણામ ટેબલ: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). કાચી પ્રતિ-જવાબ રસીદ: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute પરિવાર

OmniGlyph [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) — ફ્રી AI gateway — ની અંદર એક **native compression engine** તરીકે પણ મોકલાય છે. ત્યાં તે `omniglyph` engine તરીકે ચાલે છે (standalone single mode અથવા બીજા engines સાથે stacked), fail-closed gates અને image-aware token accounting સાથે.

# 🛠️ ટેક સ્ટેક

| લેયર | ટેક |
|---|---|
| ભાષા | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | પોતાનું 1-bit glyph atlas (Spleen/Unifont-derived, licenses `assets/` માં) → PNG |
| Tests | Vitest — TDD, ઉપરાંત docs-integrity અને rebrand guards |
| Benchmarks | `benchmarks/` harnesses (billing-sweep, density-frontier) JSONL રસીદો સાથે |

## પ્રોજેક્ટ લેઆઉટ

| પાથ | શું |
|---|---|
| `src/` | પ્રોક્સી: transform pipeline, દરેક provider માટે ચોક્કસ બિલિંગ, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | harnesses જેણે ઉપરની દરેક સંખ્યા બનાવી — ફરીથી ચલાવી શકાય તેવા |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 સપોર્ટ અને કમ્યુનિટી

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs અને feature requests
- 🔒 [SECURITY.md](SECURITY.md) — vulnerability reports
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — strict TDD + measurement-before-claims
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 લાયસન્સ

MIT — જુઓ [LICENSE](../../../LICENSE).
