# Arkkitehtuuri

Yhden sivun kartta koodikannasta.

## Pyyntöputki

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Laskutus (tarkka, mitattu)

| moduuli | palveluntarjoaja | malli |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px paloja + 4/lohko, tasokohtaiset uudelleenkoon katot; sivugeometria (molemmat tasot renderöivät standardisivun 1568×728 — high-res-taso on laskutusansa, katso [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | mallikohtaiset pala-/laattaregiimit, `detail` profiilin mukaan, geometrian rajaus |
| `src/core/gemini-model-profiles.ts` | Google | laattakaava (`floor(min/1.5)`-rajausyksikkö) + `media_resolution`-kiinteät kustannukset |

## Renderöinti

- `src/core/render.ts` — teksti → PNG paistetun glyfiatlaksen kautta
  (Spleen 5×8 + Unifont-varamalli), uudelleenrivitys `↵`-rivinvaihto-
  merkeillä, 1-bittinen atlas tuotannossa (mitattu paremmaksi kuin AA
  Fablella).
- `src/core/render-cache.ts` — determinististen renderöintien LRU-
  muistaminen (staattinen slab + jäädytetyt historialohkot renderöityisivät
  muuten uudelleen joka pyynnöllä).
- `src/core/history.ts` — kokoaa vanhat vuorot append-only-tyyppisiksi
  jäädytetyiksi kuvalohkoiksi, jotka pysyvät tavutason identtisinä, jotta
  prompt-välimuisti jatkaa osumista.
- `src/core/png.ts` — minimaalinen deterministinen PNG-koodain (ei natiiveja
  riippuvuuksia).

## Suojakaiteet

- Mallien sallittu lista (`src/core/applicability.ts`): vain mallit, jotka
  läpäisivät lukubenchmarkin, saavat kuvia; kaikki muu kulkee läpi
  tavutason identtisenä.
- Tavan tarkat arvot (SHA:t, id:t) kulkevat tekstinä faktalehdellä kuvan
  vieressä (`src/core/factsheet.ts`); palautettavat alkuperäiset
  `emitRecoverable`-mekanismin kautta.
- Natiiveja typattuja työkaluja (`type !== 'custom'`) ei koskaan kirjoiteta
  uudelleen (400-suoja).

## Benchmarkit ja kuitit

`benchmarks/` sisältää kaksi työkalua, jotka tuottivat jokaisen README:n
luvun — katso [benchmarks/README.md](../../benchmarks/README.md).
