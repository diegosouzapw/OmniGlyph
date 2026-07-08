# Roadmap fork — "OmniGlyph-ul nostru" + integrare OmniRoute

Plan de lucru consolidat (2026-07-05) din: sweep de facturare măsurat,
audit OpenAI/Gemini față de documentația oficială, analiză a uneltelor
similare, și harness-ul density-frontier. Status pentru fiecare item: ☐ în așteptare · ◐ parțial · ☑ finalizat aici.

## Faza 0 — Fundația de măsurare (FINALIZATĂ în acest repo)

- ☑ Facturare Anthropic exactă (patch-uri de 28px, 2 niveluri, +4/bloc) — `src/core/anthropic-vision.ts`, sweep în `benchmarks/billing-sweep/`.
- ☑ Gate de profitabilitate cu cost exact (a înlocuit w·h/750 × 1.10).
- ☑ Geometrie per nivel: Fable/Opus 4.8/Sonnet 5 → pagini 1928×1928 (3.3× mai puține imagini); standard → 1568×728. 691 teste verzi.
- ☑ Harness `benchmarks/density-frontier/` (cost × precizie offline prin API, needle-uri cu distractori confuzabili, punctaj determinist).

## Faza 1 — Corecturi de facturare multi-furnizor (bug-uri confirmate în audit)

Prioritate stabilită de audit (documentație oficială capturată 2026-07-05):

1. ☐ **D2 (gate INVERSAT)**: `gpt-4o-mini` cade în tile-ul implicit 85/170, dar costă **2833 bază / 5667 per tile** (~33× subestimat, ~0.8 caracter/token) — transformarea în imagine pe el este întotdeauna o pierdere iar gate-ul o aprobă. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` este trimis necondiționat (`src/core/openai.ts:392,402`), dar există doar în gpt-5.4+; derivați-l din profil.
3. ☐ **D1**: multiplicatorul `o4-mini` 1.62 → **1.72** (subestimează cu 5.8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` sunt în bucket-ul de patch-uri **plafon 1536 fără `original`** (codul presupune 10000); `gpt-5-codex-mini` este în regimul greșit (tile → patch).
5. ☐ **Geometrie GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (se aliniază cu AMBELE regimuri: patch-uri 64×32 și tile-uri 4×512; +6.25% caractere gratuite). Profil dedicat `original` pentru 5.4/5.5: până la 1568×5984 (9,163 patch-uri ≤ 10k, ~233k caractere într-un singur bloc) — mai întâi A/B de lizibilitate.
6. ☐ **Suport Gemini** (nou): `src/core/gemini.ts` + `gemini-model-profiles.ts` + rutele `:generateContent`/`:streamGenerateContent` în proxy. Geometrie documentabilă: **1152×1536 (unitate de crop exactă 768, 4 tile-uri, 42.2 caractere/token — cel mai bun raport documentat dintre cei 3 furnizori)**; pariuri de calibrare: 768² cu `media_resolution:MEDIUM` (56.4) și Gemini 3 HIGH. Atenție: endpoint-ul compatibil OpenAI al Gemini ar trece prin transformer-ul OpenAI cu facturare greșită.

## Faza 2 — Calitatea citirii (harness-ul density-frontier ca arbitru)

- ◐ A/B decisiv standard vs high-res pe Fable (în curs; bară: gist == text ȘI zero silent-wrong ȘI economii > 0).
- ☐ Rezolvarea contradicției AA vs 1-bit în calea densă (codul spune "eval-only", producția folosește AA).
- ☐ (AMÂNAT cu justificare 2026-07-06) Chirurgie de glife: config-ul de producție citește 30/30 — nu există o ratare măsurabilă pentru ca chirurgia să o rezolve astăzi. De reconsiderat dacă o țintă sub-100% intră în scop (de ex. Opus) sau dacă noi măsurători arată o regresie.
- ☑ ~~A/B temă luminoasă~~ REZOLVAT prin inspecție (2026-07-06): render-ul DEJA ESTE negru-pe-alb (render.ts:635/822, inversare post-blit) — aliniat cu literatura; ipoteza s-a născut dintr-o premisă greșită (imagine de exemplu upstream).
- ☐ Wordlist cu checksum pentru ID-uri exacte pe bit (upstream #38, aprobat) + banner de abținere (#31/#32) + camelCase în factsheet (#33/#34).
- ☑ Port #45: $schema/$id păstrate, tuplu-uri eliminate per element (commit pe main).
- ☑ Reîncercare-la-refuz (#37/H11): sniffer de replay lossless + o singură reîncercare cu body-ul original; telemetrie refusalRetried (commit pe main).
- ☐ Unealtă de reîmprospătare (`RecoverableBlock` → unealtă apelabilă; LensVLM validează re-extinderea selectivă).

## Faza 3 — Performanță/robustețe

- ☐ Cache LRU de randare (determinist prin invariant; slab-ul + chunk-urile înghețate se re-randează la fiecare request astăzi).
- ☐ Codificare PNG într-un worker thread; nivel deflate configurabil.
- ☐ Port fix-uri upstream deschise: #44 (unelte native tipizate → 400), #45 (schema-strip draft-07 → buclă 400), #42 (proxy CONNECT pentru Claude Desktop), #19 (dublă facturare a descrierilor GPT).
- ☐ Implementarea ADAPTIVE_CPT_PLAN (cpt per rol de bloc; slab real = 1.50).

## Faza 4 — Fork-ul în sine

- ☐ Nume/repo propriu (decizia lui Diego) + `git remote` upstream pentru cherry-pick-uri.
- ☐ **TS peste tot**: core-ul este deja TS, convertiți `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (pattern: tsx + vitest; `benchmarks/density-frontier/` s-a născut deja așa).
- ☐ Standard de calitate OmniRoute: eslint 9 + prettier, CI cu typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR primul), CHANGELOG semantic.
- ☐ **GIF-uri în loc de video-uri** în README (înregistrate cu vhs/asciinema+agg; comparație simplu vs proxy).
- ☐ Dashboard v2 (reimplementat prin API HTTP — fără moștenire de cod terț): launcher "deschide terminal cu ANTHROPIC_BASE_URL", verificare "traficul trece prin mine?", inspector imagine-vs-text, sesiuni, panou de cost în monedă, i18n ușor, SSE în loc de polling, persistență SQLite cu retenție (schema sa cu 24 de coloane este un punct de plecare bun).
- ☐ Micro-idei din dense-image-gen: mod `lines` (layout păstrat pentru cod/tabele), `--keep-ws`, titlu de origine per pagină ("system prompt" / "docs de unelte" / "tură de istoric N"), CLI standalone `render fisier.md -o out.png`.

## Faza 5 — Port către OmniRoute

- ☐ Motor `CompressionEngine` (șablon `cavemanAdapter.ts`), înregistrat în `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: transmiterea `supportsVision` în `chatCore.ts:1297` (1 linie) sau rezolvarea prin `isVisionModelId`.
- ☐ Ordinea de stivuire: ultimul (randoare RTK/Caveman/semantice mai întâi; OmniGlyph transformă în imagine reziduul).
- ☐ Invarianți: nu rescrieți niciodată blocurile cu `cache_control` ale clientului (lecția #4560); gate-ul de fidelitate (#5127) are nevoie de o excepție declarată sau de un factsheet text care satisface invarianții; telemetrie de încercare cu `skip_reason` (lecția #4268).
- ☐ Rutare: fallback/reîncercare post-motor trebuie să respecte capacitatea de viziune și allowlist-ul (recomprimare sau bypass).
- ☐ Sinergie CCR: `emitRecoverable` → store CCR cu recuperare per felie (`head/tail/grep`, #5187) = re-extindere selectivă completă.
- ☐ Extinderea nivelului gratuit ca funcție de marketing: fiecare token de nivel gratuit produce ~2-3× mai multe caractere pe modele de viziune; nivelul gratuit Gemini + geometria 1152×1536 este cel mai puternic caz.

## Riscuri deschise

- Refuzuri Fable post-redeploy în context transformat în imagine (upstream #37) — atenuați înainte de default-on în OmniRoute.
- Arbitraj de preț: dacă Anthropic re-prețuiește viziunea, economiile se schimbă — contrafactualul per request (`count_tokens`) este apărarea.
- OpenAI: măsurătoare din comunitate (PageWatch) a văzut creșterea tokenilor de completion și latență 2× — măsurați per furnizor înainte de activare.

## Rezultate A/B 2026-07-05 (via OpenRouter — NECONCLUDENT pentru geometrie, valid pentru moduri de eșec)

| config | verbatim | abst. | filtrat | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA și 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 prezise) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 prezise) |
| opus hires 10×16 | **7/9 citite** | 0 | 21 din credite | 2 (cifră) |

Descoperiri valide: (1) clasificatorul (issue #37) este modul de eșec DOMINANT
pentru întrebările de transcriere pe pagina standard — 100% filtrat — și nu
se declanșează pe pagina mare; formularea contează. (2) Abținerea funcționează:
20× ILEGIVEL vs 5 confabulații pe pagina mare. (3) Opus la 10×16 citește 78%
exact (n=9) vs 0% istoric la 5×8 — prima dovadă directă a "genunchiului"
(knee). (4) Ilizibilitatea paginii mari via OpenRouter sugerează un
RESAMPLE de transport (Bedrock/Vertex nivel standard?) — ipoteză decisivă de
testat pe API-ul direct al Anthropic; A/B-ul de geometrie rămâne DESCHIS
până atunci. Creditele OpenRouter s-au epuizat la jumătatea brațului Opus.

## Matricea finală 2×2 (2026-07-05, via CLI/abonament, Fable 5, n=30/braț)

| pagină × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Zero confabulație pe cele 4 brațe (120 de întrebări — fiecare ratare a fost
ILEGIVEL). APLICAT: DENSE_RENDER_STYLE schimbat la 1-bit (aa:false) cu un
pin în tests/dense-style.test.ts. Opus 4.8: 26/30 la 10×16 pe pagina mare,
30/30 ILEGIVEL la 5×8 — modul sigur Opus este viabil. Pagina de rezoluție
înaltă rămâne degradată de transporturi (Read CLI/resample OpenRouter) —
verdictul geometriei WYSIWYG depinde încă de API-ul direct.
