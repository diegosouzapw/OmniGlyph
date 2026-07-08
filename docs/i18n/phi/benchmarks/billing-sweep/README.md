# Sweep ng vision-billing ng Anthropic

Libreng `count_tokens` sweep na nagpapasya sa dalawang bukas na tanong sa
geometry:

1. **Formula** — sinisingil ba ng API ang `ceil(w/28) × ceil(h/28)` na patches
   (kasalukuyang dokumentasyon) o ang retiradong `w·h/750`? Pinaghihiwalay ng
   probe set ang dalawa nang 25–180 tokens kada row.
2. **Tier** — natatanggap ba ng `claude-fable-5` ang high-resolution caps
   (long edge ≤ 2576 px, ≤ 4784 visual tokens)? Ang row na
   `page-old-1928x1928` ang tagapagpasya: ≈ **4761** na sinukat ay
   nangangahulugang high-res WYSIWYG (ang lumang malaking pahina ay may
   dalang ~3.3× pang chars kada imahe kumpara sa kasalukuyang 1568×728, sa
   parehong chars/token); ≈ **1521** ay nangangahulugang standard-tier
   resample, at nananatiling tama ang 1568×728.

Konteksto: ang sweep noong 2026-07-01 sa likod ng kasalukuyang pahinang
1568×728 (legibility audit, 2026-07-01) ay sinukat sa `claude-sonnet-4-5` —
isang standard-tier na modelo — habang ang production ay tumutugon sa
Fable 5, na inilalagay ng vision docs sa high-resolution tier. Sinukat din
ng audit na iyon ang kasalukuyang pahina sa 1460 tokens: mas malapit sa
1456 ng patch formula kaysa sa 1522 ng /750, na nagmumungkahing lumipat na
ang API sa patch billing.

## Pagpapatakbo

```bash
pnpm run build                              # kailangan ang dist/ (tulad ng lahat ng eval)
node benchmarks/billing-sweep/run.mjs --dry-run   # mga prediksyon lamang, walang key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Dapat direktang tamaan ang API — hindi kailanman sa pamamagitan ng proxy ng
OmniGlyph, na magbabago sa body. Libre ang `count_tokens`; gumagawa ang
buong sweep ng ~25 na request.

## Pagbasa sa output

Kada modelo, ipinapakita ng bawat row ng probe ang sinukat na image tokens
(may-imahe binawasan ang text-only baseline) laban sa lahat ng apat na
prediksyon (`patch`/`legacy750` × `standard`/`highres`); inaayos ng buod ang
mga hypothesis ayon sa mean absolute residual. Sinusuri ng `--probe-multi`
ang cap kada imahe (2×1092² ≈ 2×1521); sinusuri ng `--probe-20plus` ang
tuntunin ng >20 na imahe (dapat tanggihan, hindi i-resample, ang isang gilid
na >2000 px). Napupunta ang mga row sa `results/*.jsonl`; naninirahan ang
matematika ng prediksyon sa `formulas.mjs`, na naka-pin ng
`tests/billing-sweep-formulas.test.ts`.

## Matapos ang hatol

- Nakumpirma ang patch formula → i-port ang PR #27 ng OmniGlyph (eksaktong
  translation ng resize) at ihanay ang matematika ng gate na
  `ANTHROPIC_PIXELS_PER_TOKEN` sa `src/core/transform.ts`.
- Nakumpirma ang high-res tier sa Fable → muling ipakilala ang isang
  page geometry kada tier (mga pahinang klase 1928×1928 para sa Fable/Opus
  4.8/Sonnet 5, 1568×728 para sa standard), na sinasalamin kung paano
  pinapanatili na ng GPT path ang sarili nitong `GPT_MAX_HEIGHT_PX`.
