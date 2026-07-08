🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="ஒரு உண்மையான render: system prompt + tool docs ஒரே அடர்த்தியான 1568×728 பக்கத்தில் அடக்கப்பட்டுள்ளது" width="820"/>

<br/>

# 🖼️ OmniGlyph — படமாக Context

### உங்கள் Claude பில்லை **59–70%** குறையுங்கள் — அடர்த்தியான context-ஐ PNG பக்கங்களாக render செய்வதன் மூலம், அதே உள்ளடக்கம், மிகக் குறைந்த tokens-இல்.

**மாடல்கள் உரையை token வாரியாக பில் செய்கின்றன, ஆனால் ஒரு படத்தை அதன் dimensions வாரியாக பில் செய்கின்றன — அதற்குள் எவ்வளவு உரை உள்ளது என்பதைக் கொண்டு அல்ல.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](../../../benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](../../../benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) குடும்பத்தின் ஒரு பகுதி · [🌐 அனைத்து மொழிகளும்](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| அளவீடு | முடிவு | ஆதாரம் |
|---|---|---|
| End-to-end பில் குறைப்பு | **59–70%** | production trace, 13,709 requests |
| ஒவ்வொரு மாற்றப்பட்ட block-க்கும் tokens | **10× குறைவு** (28,080 chars: 14,040 → 1,460 tokens) | [billing sweep](../../../benchmarks/billing-sweep/README.md) |
| பில்லிங் ஃபார்முலா துல்லியம் | **பூஜ்ஜிய** residual 22 `count_tokens` probes-இல், 2 மாடல்கள் × 2 tiers | `benchmarks/billing-sweep/results/` |
| Exact-read துல்லியம், production config | **30/30 (100%)** Claude Fable 5-இல் | [density frontier](../../../benchmarks/density-frontier/README.md) |
| ~300 read probes-இல் silent confabulations | **0** — ஒவ்வொரு தவறும் `ILEGIVEL` எனத் தவிர்க்கிறது | `benchmarks/density-frontier/results/` |

**மாடல் scorecard** (அடர்த்தியான renders-ஐ படிக்க முடியுமா? n=30 ஒரு arm-க்கு, deterministic scoring):

| மாடல் | படிப்பது | தீர்ப்பு |
|---|---|---|
| Claude **Fable 5** | **100%** exact | ✅ production இலக்கு |
| Claude Opus 4.8 | 77–87% 4× glyph அளவில் | ⚠️ opt-in safe mode (சேமிப்பு ~2×-ஆகக் குறையும்) |
| GPT-5.5 | 0/60 — மேலும் அதன் பதில்களை ~40× பெருக்குகிறது முயற்சியில் | ❌ gate-ஆல் தடுக்கப்பட்டது, ஆதாரத்துடன் |
| Gemini 2.5-flash | 0/26 — மேலும் தவிர்ப்பதற்குப் பதிலாக confabulate செய்கிறது | ❌ தடுக்கப்பட்டது (பகுதி சோதனை, quota-வால் வரம்பிடப்பட்டது) |

இந்த சாதகம் இன்று **Fable-க்கு மட்டுமே சிறப்பானது** — மற்ற vision encoders இன்னும் அடர்த்தியான glyphs-ஐ resolve செய்யவில்லை. [benchmark harness](../../../benchmarks/README.md) எந்த புதிய மாடலையும் ஒரே கட்டளையில் மீண்டும் சோதிக்கிறது.

# 🤔 ஏன் OmniGlyph?

நீண்ட நேரம் இயங்கும் ஒவ்வொரு agent session-உம் ஒவ்வொரு requestக்கும் அதே செத்த பாரத்தை இழுக்கிறது: system prompt, tool docs, மற்றும் பழைய history — ஒவ்வொரு turn-க்கும் மீண்டும் token வாரியாக பில் செய்யப்படுகிறது. OmniGlyph ஒரு **local proxy**, அது அந்த அடர்த்தியான பகுதிகளை உங்கள் மெஷினை விட்டு வெளியேறும் முன்பே அடர்த்தியான PNG பக்கங்களாக மீண்டும் எழுதுகிறது:

- **Exact billing math, heuristics அல்ல** — இது provider-இன் உண்மையான image-token ஃபார்முலாவைக் கணக்கிடுகிறது (பூஜ்ஜிய residual வரை அளவிடப்பட்டது) மற்றும் கணக்கு வெற்றி பெறும்போது மட்டுமே மாற்றுகிறது.
- **வடிவமைப்பால் Fail-closed** — அடர்த்தியான renders-ஐ படிக்க முடியாத மாடல்கள் ஒரு gate-ஆல் தடுக்கப்படுகின்றன, benchmark ஆதாரங்களுடன். எந்த silent quality loss-உம் இல்லை.
- **Private & local-first** — மறுஎழுதுதல் `127.0.0.1`-இல் நடக்கிறது; வேறு எதுவும் எங்கும் அனுப்பப்படுவதில்லை.
- **மறுஉருவாக்கம் செய்யக்கூடியது** — மேலே உள்ள ஒவ்வொரு எண்ணுக்கும் `benchmarks/*/results/`-இல் ஒரு ஆதாரம் உள்ளது, ஒரே கட்டளையில் மீண்டும் இயக்கக்கூடியது.

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: proxy-ஐ தொடங்குங்கள், dashboard-ஐ சரிபார்க்கவும், Claude Code-ஐ அதன் மேல் நோக்கவும்](../../../docs/assets/demo-quickstart.gif)

இரண்டு வழிகளிலும் வேலை செய்கிறது:
- **API key** (per token செலுத்துவது): உங்கள் பில் end-to-end 59–70% குறைகிறது.
- **Subscription session**: நீங்கள் குறைவாக செலுத்த மாட்டீர்கள், ஆனால் usage limits tokens-இல் எண்ணப்படுகின்றன — எனவே உங்கள் limits **~2–3×** நீட்டிக்கின்றன.

Dashboard <http://127.0.0.1:47821/>-இல்: சேமிக்கப்பட்ட tokens, ஒவ்வொரு text→image மாற்றமும் அருகருகே, kill switch, live model chips. பதில்கள் இயல்பாக stream ஆகின்றன — *request* மட்டுமே சுருக்கப்படுகிறது, மாடலின் output ஒருபோதும் இல்லை.

# ⚙️ இது எப்படி வேலை செய்கிறது

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **பில்லிங் மாற்றுவதற்கு முன்பே சரியாகக் கணக்கிடப்படுகிறது**: Anthropic ஒரு படத்திற்கு `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens பில் செய்கிறது (28 px patches — பூஜ்ஜிய residual வரை அளவிடப்பட்டது). ஒரு முழு பக்கம் 28,080 chars-ஐ 1,460 tokens-க்கு எடுத்துச் செல்கிறது ≈ **19 chars/token**, அடர்த்தியான உரைக்கு ~2 chars/token-க்கு எதிராக. கணக்கு வெற்றி பெறும்போது மட்டுமே gate மாற்றுகிறது.
- **எது மாற்றப்படுகிறது**: static system prompt + tool docs, பழைய collapsed history, பெரிய tool outputs.
- **எது ஒருபோதும் மாற்றப்படாது**: உங்கள் messages, சமீபத்திய turns, மாடலின் output, sparse prose, byte-exact values (hashes/IDs உரையாக படத்துடன் பயணிக்கின்றன), மற்றும் reading benchmark-இல் தோல்வியடைந்த எந்த மாடலும்.

# 📚 Library பயன்பாடு (proxy இல்லாமல்)

proxy ஒவ்வொரு requestக்கும் செய்யும் அனைத்தும் ஒரு documented, importable API ஆகவும் கிடைக்கிறது:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` blocks-ஐ உரையாகப் பின் செய்கிறது; `options.emitRecoverable` படமாக்கப்பட்ட blocks-இன் originals-ஐ திருப்பித் தருகிறது. சரியான பில்லிங் கணிதமும் package root-இல் shipped ஆகிறது (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — இதைத்தான் [OmniRoute](https://github.com/diegosouzapw/OmniRoute) உபயோகிக்கிறது. Pure-JS runtime (Node மற்றும் edge/Workers). முழு surface: `src/core/index.ts`.

# 🧭 The honest part

- **இது lossy.** படங்களிலிருந்து Byte-exact recall இயற்கையாகவே நம்பகமற்றது. அனுப்பப்பட்ட தணிப்புகள்: exact identifiers படத்தின் அருகில் உரையாகப் பயணிக்கின்றன, மற்றும் அளவிடப்பட்ட production config **பூஜ்ஜிய silent confabulations** ஐ உருவாக்கியது — தோல்வியுற்ற reads தவிர்க்கின்றன.
- **இன்று Fable 5 மட்டுமே அங்கீகரிக்கப்பட்டுள்ளது**, ஆதாரங்களுடன். GPT-5.5 மற்றும் Gemini 2.5-flash அளவிடத்தக்க வகையில் அடர்த்தியான renders-ஐ படிக்க முடியாது; Opus 4.8-க்கு 4× பெரிய glyphs தேவை. gate இதை அமல்படுத்துகிறது.
- **ஒரு பில்லிங் trap-ஐ கண்டுபிடித்து தவிர்த்தோம்**: high-resolution image tier ஒரு பக்கத்திற்கு 3.3× அதிகமாக பில் செய்கிறது, ஆனால் vision encoder கூடுதல் resolution-ஐப் பெறுவதில்லை — பெரிய பக்கங்கள் *மோசமாக* படிக்கப்படுகின்றன. அளவிடப்பட்டது, [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md)-இல் documented, இயக்கப்படவில்லை.
- விலைகள் மாறுகின்றன; நீடித்த metric token குறைப்பாகும், இதை proxy ஒவ்வொரு requestக்கும் ஒரு இலவச `count_tokens` counterfactual-க்கு எதிராக log செய்கிறது.

# 🧠 FAQ

**59–70% என்பது end-to-end ஆ, அல்லது அது தொட்ட requests-இல் மட்டும் ஆ?**
End-to-end — முழு பில். பெரும்பாலான compression tools தாங்கள் தொட்ட பகுதியில் மட்டும் சேமிப்பை report செய்கின்றன, இது எண்ணை மிகைப்படுத்திக் காட்டுகிறது. எங்கள் denominator *ஒவ்வொரு* requestமாகும்: gate சரியாக தொடாமல் விட்ட சிறிய requests, அனைத்து cache writes மற்றும் reads, மற்றும் அனைத்து output tokens (இவற்றை proxy ஒருபோதும் சுருக்காது). Compressed-only எண் அதிகமாக வரும், அது தனியாக மேற்கோள் காட்டப்படுகிறது, headline ஆக ஒருபோதும் இல்லை.

**சேமிப்பு எப்படி அளவிடப்படுகிறது?**
ஒரே requestன் இரு பக்கங்களும், ஒரே தருணத்தில். ஒவ்வொரு `/v1/messages` POST-க்கும் proxy மூல uncompressed body-இல் (counterfactual) ஒரு இலவச `count_tokens` probe-ஐ, உண்மையான forward-உடன் இணையாக இயக்குகிறது, மேலும் response-இலிருந்து provider உண்மையில் பில் செய்த usage block-ஐ படிக்கிறது — இரண்டும் ஒரே event row-இல் பதிவாகின்றன. Cache pricing இரு பக்கங்களுக்கும் ஒரே மாதிரியாக பயன்படுத்தப்படுகிறது, எனவே caching தள்ளுபடி ரத்தாகி "savings" ஆக இரட்டிப்பு கணக்கிடப்பட முடியாது. ஃபார்முலா `src/core/baseline.ts`-இல் உள்ளது; அதை உங்கள் சொந்த events log-இலிருந்து மீண்டும் derive செய்யுங்கள்.

**ஒரு தவறு ஏன் read error-க்குப் பதிலாக confabulation ஆக இருக்கும்?**
ஏனெனில் model vision OCR அல்ல: பக்கம் patch embeddings ஆக மாறுகிறது, ஒருபோதும் தனித்தனி எழுத்துகளாக அல்ல, எனவே சத்தமாக தோல்வியடைய per-glyph confidence எதுவும் இல்லை — pixels ஒரு glyph-ஐ underdetermine செய்யும்போது, language prior அந்த இடைவெளியை நம்பகமான ஏதோவொன்றால் நிரப்புகிறது. இந்த mechanism தான் OmniGlyph இதில் fail-closed ஆக இருப்பதற்குக் காரணம்: byte-exact மதிப்புகள் எப்போதும் படத்தின் அருகில் உரையாகப் பயணிக்கின்றன, தவறாகப் படிக்கும் மாடல்கள் gate-ஆல் தடுக்கப்படுகின்றன, மேலும் அளவிடப்பட்ட production config ~300 read probes-இல் **பூஜ்ஜிய** silent confabulations-ஐ உருவாக்கியது — தோல்வியுற்ற reads தவிர்க்கின்றன.

**byte-exact வேலை (hashes, IDs, secrets) பற்றி என்ன?**
சமீபத்திய turns மற்றும் exact identifiers வடிவமைப்பால் உரையாகவே இருக்கும். *முழுவதும்* byte-exact ஆன workloads-க்கு, அவற்றை ஒரு non-allowlisted மாடலுக்கு route செய்யுங்கள் (எ.கா., வேறொரு Claude மாடலில் ஒரு subagent) — allowlist-க்கு வெளியே உள்ள எதுவும் byte-identical ஆக, தொடப்படாமல் கடந்து செல்கிறது.

**DeepSeek-OCR இது வேலை செய்கிறதா என்பதை தீர்மானிக்கவில்லையா?**
அது *channel* வேலை செய்கிறது என்பதை நிரூபித்தது — இந்த வேலைக்காகப் பயிற்சி பெற்ற ஒரு encoder/decoder ஜோடியுடன். எந்த stock production மாடலும் அடர்த்தியான renders-ஐ படிக்க முடியாத காலத்திலிருந்து இந்த சந்தேகம் தொடர்கிறது; அது மாறிவிட்டது, மேலும் மேலே உள்ள [மாடல் scorecard](../../../README.md#-the-numbers--measured-not-estimated) இன்று அவற்றை யார் படிக்க முடியும் என்பதை ஆதாரங்களுடன் சரியாகக் காட்டுகிறது. [benchmark harness](../../../benchmarks/README.md) எந்த புதிய மாடலையும் ஒரே கட்டளையில் மீண்டும் சோதிக்கிறது — gate hype-ஐ அல்ல, தரவைப் பின்பற்றுகிறது.

# 🔬 ஒவ்வொரு எண்ணையும் மறுஉருவாக்குங்கள்

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![இரண்டு benchmark harnesses dry-run modeஇல் இயங்குகின்றன](../../../docs/assets/demo-benchmarks.gif)

முழு methodology மற்றும் ஒவ்வொரு result table-உம்: [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md). Raw per-answer ஆதாரங்கள்: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute குடும்பம்

OmniGlyph [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-க்குள் ஒரு **native compression engine** ஆகவும் அனுப்பப்படுகிறது — இலவச AI gateway. அங்கு இது `omniglyph` engine-ஆக இயங்குகிறது (standalone single mode அல்லது மற்ற engines-உடன் stacked), fail-closed gates மற்றும் image-aware token accounting-உடன்.

# 🛠️ Tech Stack

| அடுக்கு | tech |
|---|---|
| மொழி | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | சொந்த 1-bit glyph atlas (Spleen/Unifont-derived, licenses `assets/`-இல்) → PNG |
| Tests | Vitest — TDD, மேலும் docs-integrity மற்றும் rebrand guards |
| Benchmarks | `benchmarks/` harnesses (billing-sweep, density-frontier) JSONL ஆதாரங்களுடன் |

## திட்ட அமைப்பு

| path | என்ன |
|---|---|
| `src/` | proxy: transform pipeline, provider-க்கு exact billing, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | மேலே உள்ள ஒவ்வொரு எண்ணையும் உருவாக்கிய harnesses — மறுஇயக்கக்கூடியது |
| `docs/` | [BENCHMARKS](../../../docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](../../../docs/architecture/ARCHITECTURE.md) · [ROADMAP](../../../docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs மற்றும் feature கோரிக்கைகள்
- 🔒 [SECURITY.md](SECURITY.md) — vulnerability அறிக்கைகள்
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — strict TDD + measurement-before-claims
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 நன்றி

OmniGlyph குறிப்பாக ஒரு project-இன் தோள்களில் நிற்கிறது — இந்த பகுதி எங்கள் நிரந்தர நன்றியாகும்.

| Project | OmniGlyph-ஐ இது எப்படி வடிவமைத்தது |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **இந்த முழு project-உம் கட்டமைக்கப்பட்டுள்ள கண்டுபிடிப்பு.** ஒரு production LLM-இன் vision channel, token செலவின் ஒரு சிறு பங்கில் அடர்த்தியான textual context-ஐ சுமக்க முடியும் என்பதையும், அந்த மாற்றம் per-request சரியான பில்லிங் கணிதத்தால் தான் முடிவு செய்யப்பட வேண்டும், ஒருபோதும் ஊகத்தால் அல்ல என்பதையும் pxpipe ஆதாரங்களுடன் நிரூபித்தது. அடர்த்தியான 1-bit rendering, profitability gate, `count_tokens` counterfactual, fail-closed model allowlist, மற்றும் "claim செய்வதற்கு முன் measure செய்" என்ற documentation கலாச்சாரம் — இவை அனைத்தும் அங்கேயே முன்னோடியாகத் தொடங்கப்பட்டன. OmniGlyph நேரடியாக அந்த codebase-இலிருந்து வந்தது (MIT — மூல copyright வரி எங்கள் [LICENSE](../../../LICENSE)-இல் தொடர்கிறது). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | எங்கள் அடர்த்தியான 1-bit glyph atlas பெறப்பட்ட 5×8 bitmap font family (license `assets/`-இல்). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Spleen-இன் வரம்புக்கு அப்பாற்பட்ட glyphs-க்கான coverage, அதே atlas-இல் (license `assets/`-இல்). |

OmniGlyph பயனுள்ளதாக இருந்தால், upstream project-ஐயும் star செய்யுங்கள் — கண்டுபிடிப்பு அவர்களுடையது. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 License

MIT — காண்க [LICENSE](../../../LICENSE).
