# Security கொள்கை

## பாதிப்புகளைப் புகாரளித்தல்

GitHubஇல் ஒரு தனிப்பட்ட security advisoryஐத் திறக்கவும்
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) அல்லது
maintainerஐ நேரடியாகத் தொடர்பு கொள்ளவும் (diegosouza.pw@outlook.com). Exploitable
ஆன ஒரு பாதிப்புக்கு பொது issue திறக்க வேண்டாம்.

## Threat model (OmniGlyph என்றால் என்ன)

OmniGlyph என்பது உங்கள் clientக்கும் (எ.கா. Claude Code) LLM APIகளுக்கும் இடையேயான
**local proxy**. வடிவமைப்பால் இது உங்கள் session உள்ளடக்கம் மற்றும் transitஇல்
உள்ள உங்கள் credentials அனைத்தையும் பார்க்கிறது. அதற்கேற்ற security முடிவுகள்:

- **இயல்பாக loopbackக்கு bind செய்கிறது** (`127.0.0.1`): dashboardக்கு
  authentication இல்லை மற்றும் captured session context (படங்களின் மூல உரை,
  telemetry) வழங்குகிறது. `HOST=0.0.0.0` ஒரு வெளிப்படையான opt-in ஆகும் மற்றும்
  அதை நெட்வொர்க்கிற்கு வெளிப்படுத்துகிறது — நம்பகமான நெட்வொர்க்கில் மட்டுமே
  பயன்படுத்தவும்.
- **Credentials**: proxy clientஇன் auth headersஐ upstreamக்கு forward செய்கிறது
  மேலும் அவற்றை persist செய்யாது. env மூலம் வழங்கப்பட்ட keys
  (`ANTHROPIC_API_KEY` போன்றவை) memoryஇல் மட்டுமே இருக்கும்.
- **Local telemetry**: `~/.omniglyph/events.jsonl`-இல் per-request metadata
  (token counts, body hashes) மற்றும், 4xx errorsஇல், compressed body samples
  உள்ளன — இந்த fileஐ sensitive ஆகக் கருதவும்.
- **Imaged உள்ளடக்கம் lossy**: Byte-exact values (secrets, hashes) ஒருபோதும்
  image readsஐ சார்ந்திருக்கக் கூடாது; pipeline அவற்றை உரையாகவே வைத்திருக்கிறது,
  ஆனால் தங்க விதி: LLM contextஇல் secrets வைக்க வேண்டாம்.
- **Supply chain**: `pnpm-workspace.yaml` எந்த புதிய packageக்கும் 3 நாள்
  `minimumReleaseAge`ஐ அமல்படுத்துகிறது; coreக்கு ஒரே ஒரு runtime dependency
  உள்ளது.

## ஆதரிக்கப்படும் versions

சமீபத்திய release lineஉம் (`main` / மிக சமீபத்திய `v1.x`) மட்டுமே fixesஐப்
பெறும்.
