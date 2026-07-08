# Sera ya Usalama

## Kuripoti udhaifu

Fungua ushauri wa faragha wa usalama kwenye GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) au
wasiliana moja kwa moja na msimamizi (diegosouza.pw@outlook.com). Usifungue
suala la hadharani kwa udhaifu unaoweza kutumiwa vibaya.

## Muundo wa tishio (OmniGlyph ni nini)

OmniGlyph ni **proxy ya ndani** kati ya mteja wako (kwa mfano Claude Code) na
API za LLM. Kwa muundo huu, huona maudhui yote ya kipindi chako na taarifa
zako za uthibitishaji zikiwa njiani. Maamuzi husika ya usalama:

- **Hujifunga kwa loopback kwa chaguo-msingi** (`127.0.0.1`): dashibodi
  haina uthibitishaji na hutoa muktadha wa kipindi kilichonaswa (maandishi
  chanzi ya picha, telemetria). `HOST=0.0.0.0` ni chaguo la wazi la hiari na
  hufichua yote hayo kwa mtandao — itumike tu kwenye mtandao unaoaminika.
- **Taarifa za uthibitishaji**: proxy husafirisha vichwa vya uthibitishaji
  vya mteja kwenda kwa mtoa huduma na haviwekwi kwa kudumu. Funguo
  zinazotolewa kupitia mazingira (`ANTHROPIC_API_KEY` n.k.) hubaki kumbukumbu
  ya muda.
- **Telemetria ya ndani**: `~/.omniglyph/events.jsonl` huhifadhi metadata ya
  kila ombi (idadi za token, hashi za mwili) na, kwenye hitilafu za 4xx,
  sampuli za mwili zilizobanwa — chukulia faili hiyo kuwa nyeti.
- **Maudhui yaliyochorwa kama picha ni ya kuhasiri (lossy)**: thamani sahihi
  kabisa (siri, hashi) kamwe hazipaswi kutegemea usomaji wa picha; mfumo
  huzihifadhi kama maandishi, lakini kanuni kuu ni: usiweke siri katika
  muktadha wa LLM.
- **Msururu wa ugavi**: `pnpm-workspace.yaml` hutekeleza `minimumReleaseAge`
  ya siku 3 kwa pakiti yoyote mpya; msingi una utegemezi mmoja tu wa muda wa
  uendeshaji.

## Matoleo yanayotegemewa

Mstari wa toleo la hivi karibuni pekee (`main` / `v1.x` ya hivi karibuni)
hupokea marekebisho.
