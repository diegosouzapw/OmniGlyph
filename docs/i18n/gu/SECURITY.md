# Security Policy

## Vulnerabilities ની જાણ કરવી

GitHub પર ખાનગી security advisory ખોલો
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) અથવા
maintainer નો સીધો સંપર્ક કરો (diegosouza.pw@outlook.com). Exploitable
vulnerability માટે જાહેર issue ન ખોલો.

## Threat model (OmniGlyph શું છે)

OmniGlyph તમારા client (દા.ત. Claude Code) અને LLM APIs વચ્ચેનું એક
**લોકલ પ્રોક્સી** છે. ડિઝાઇન દ્વારા તે તમારું બધું session content અને
transit માં તમારા credentials જુએ છે. અનુરૂપ security નિર્ણયો:

- **ડિફોલ્ટ રીતે loopback ને bind કરે છે** (`127.0.0.1`): dashboard પાસે
  કોઈ authentication નથી અને captured session context (images નું source
  text, telemetry) સર્વ કરે છે. `HOST=0.0.0.0` એક સ્પષ્ટ opt-in છે અને તે
  બધું network પર expose કરે છે — ફક્ત trusted network પર જ વાપરો.
- **Credentials**: પ્રોક્સી client ના auth headers ને upstream તરફ forward
  કરે છે અને તેમને persist કરતું નથી. env દ્વારા આપેલી keys
  (`ANTHROPIC_API_KEY` વગેરે) memory માં જ રહે છે.
- **લોકલ telemetry**: `~/.omniglyph/events.jsonl` પ્રતિ-request metadata
  (token counts, body hashes) ધરાવે છે અને, 4xx errors પર, compressed body
  samples — આ ફાઇલને sensitive ગણો.
- **Imaged content lossy છે**: byte-exact values (secrets, hashes) ક્યારેય
  image reads પર આધાર રાખવા ન જોઈએ; pipeline તેમને text તરીકે રાખે છે,
  પણ golden rule છે: LLM context માં secrets ન મૂકો.
- **Supply chain**: `pnpm-workspace.yaml` કોઈપણ નવા package માટે 3 દિવસનું
  `minimumReleaseAge` લાગુ કરે છે; core પાસે એક જ runtime dependency છે.

## સપોર્ટેડ versions

ફક્ત latest release line (`main` / સૌથી તાજેતરનું `v1.x`) fixes મેળવે છે.
