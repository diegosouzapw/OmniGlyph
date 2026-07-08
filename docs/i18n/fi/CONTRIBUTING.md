# Osallistuminen OmniGlyphiin

Kiitos kiinnostuksestasi! Tässä projektissa on kaksi ehdotonta
kulttuurisääntöä — ne ovat syy siihen, että jokaiseen README:n lukuun voi
luottaa.

## Sääntö 1 — Tiukka TDD

Kaikki tuotantokoodi syntyy testistä, joka epäonnistui ensin:

1. Kirjoita testi ja **katso sen epäonnistuvan oikeasta syystä**.
2. Kirjoita minimimäärä koodia, joka saa sen läpäisemään.
3. Refaktoroi pysyen vihreänä.

Täysi vaatimus on: `pnpm run typecheck && pnpm test && pnpm run build` —
kaikki kolme, aina (dokumentaatiolinkkien tarkistus ja rebrand-vartija
ajetaan `pnpm test`-komennon sisällä tiedoston
`tests/docs-integrity.test.ts` kautta).

## Sääntö 2 — Mittaus ennen väitteitä

Mikään muutos geometriaan, atlakseen, laskutuskaavaan tai mallien
kattavuuteen ei mene läpi ilman mitattua lukua. Repositorio on rakennettu
tämän kurin varaan:

- Laskutuskustannus → todista se kansiolla `benchmarks/billing-sweep/`
  (`count_tokens` on ilmainen; odotettu residuaali: nolla).
- Luettavuus → todista se kansiolla `benchmarks/density-frontier/` (n≥30
  per haara, deterministinen pisteytys, JSONL-kuitit kommitoitu kansioon
  `benchmarks/*/results/`).
- Hyväksymisraja tuotanto-oletusarvon muuttamiselle: gist == tekstivertailu
  **JA** nolla hiljaista tarkan merkkijonon virhettä **JA** positiivinen
  säästö.

Hypoteesit ilman lukuja menevät tiedostoon `docs/ROADMAP.md` hypoteeseina —
ei koskaan README:hen faktoina. Kaksi "ilmeistä" ideaa on jo kumottu
datalla (korkearesoluutiosivu, antialiasoitu atlas); prosessi toimii.

## Käyttöönotto

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI testaa 20/22/24), pnpm 10 (kiinnitetty `packageManager`-kentällä
tiedostossa package.json).

## Rakenne

| kansio | sääntö |
|---|---|
| `src/core/` | ajoympäristöriippumaton (vain Web-rajapinnat — toimii Nodessa ja Workersissa) |
| `src/node.ts` / `src/worker.ts` | vain host-liitäntäkoodi |
| `benchmarks/` | uudelleenajettavat työkalut; JSONL-tulokset ovat kuitteja, kommitoitu |
| `docs/` | benchmarks/ (luvut), architecture/ (kartta), ROADMAP (hypoteesit), ops/ (OmniRoute) |

## Commitit ja PR:t

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), runko selittää *miksi* relevanteilla luvuilla.
- Pienet, kohdennetut PR:t; käyttäytymismuutokset tulevat testin kanssa,
  joka lukitsee ne, ja tarvittaessa benchmarkin kanssa, joka perustelee ne.
- Älä kirjoita asiakkaan `cache_control`-lohkoja uudelleen, älä lisää
  ajonaikaisia riippuvuuksia ilman keskustelua (ydin on tarkoituksella
  riippuvuuskevyt), älä käytä `Math.random`- tai aikaleimoja
  renderöintipoluissa (determinismi on kova invariantti, testattu
  tavutason identtisyydellä).
