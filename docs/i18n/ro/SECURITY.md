# Politica de securitate

## Raportarea vulnerabilităților

Deschideți un security advisory privat pe GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) sau
contactați direct întreținătorul (diegosouza.pw@outlook.com). Nu deschideți
un issue public pentru o vulnerabilitate exploatabilă.

## Modelul de amenințare (ce este OmniGlyph)

OmniGlyph este un **proxy local** între clientul dumneavoastră (de ex. Claude
Code) și API-urile LLM. Prin design vede tot conținutul sesiunii dumneavoastră
și credențialele dumneavoastră în tranzit. Deciziile de securitate
corespunzătoare:

- **Se leagă de loopback implicit** (`127.0.0.1`): dashboard-ul nu are
  autentificare și servește contextul de sesiune capturat (textul sursă al
  imaginilor, telemetrie). `HOST=0.0.0.0` este un opt-in explicit și expune
  toate acestea la rețea — folosiți-l doar pe o rețea de încredere.
- **Credențiale**: proxy-ul transmite header-ele de autentificare ale
  clientului către upstream și nu le persistă. Cheile furnizate prin
  variabile de mediu (`ANTHROPIC_API_KEY` etc.) rămân în memorie.
- **Telemetrie locală**: `~/.omniglyph/events.jsonl` conține metadate per
  request (numărare de tokeni, hash-uri de body) și, la erori 4xx, eșantioane
  de body comprimate — tratați fișierul ca fiind sensibil.
- **Conținutul transformat în imagine este lossy**: valorile exacte pe bit
  (secrete, hash-uri) nu trebuie niciodată să depindă de citiri de imagine;
  pipeline-ul le păstrează ca text, dar regula de aur este: nu puneți secrete
  în contextul LLM.
- **Lanț de aprovizionare**: `pnpm-workspace.yaml` impune un
  `minimumReleaseAge` de 3 zile pentru orice pachet nou; core-ul are o
  singură dependență runtime.

## Versiuni suportate

Doar cea mai recentă linie de lansare (`main` / cel mai recent `v1.x`)
primește corecții.
