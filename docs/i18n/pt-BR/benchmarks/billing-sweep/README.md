# Sweep de cobrança de visão da Anthropic

Sweep gratuito de `count_tokens` que decide duas questões de geometria em
aberto:

1. **Fórmula** — a API cobra `ceil(w/28) × ceil(h/28)` patches (docs atuais)
   ou a fórmula aposentada `w·h/750`? O conjunto de sondas separa as duas por
   25–180 tokens por linha.
2. **Tier** — o `claude-fable-5` recebe os limites de alta resolução (borda
   longa ≤ 2576 px, ≤ 4784 tokens visuais)? A linha `page-old-1928x1928` é a
   decisora: ≈ **4761** medido significa alta resolução WYSIWYG (a página
   grande antiga carrega ~3,3× mais caracteres por imagem que a atual
   1568×728, na mesma razão caracteres/token); ≈ **1521** significa resample
   de tier padrão, e 1568×728 continua correta.

Contexto: o sweep de 2026-07-01 por trás da página atual 1568×728
(auditoria de legibilidade, 2026-07-01) foi medido em `claude-sonnet-4-5` —
um modelo de tier padrão — enquanto a produção mira o Fable 5, que a
documentação de visão coloca no tier de alta resolução. Essa auditoria
também mediu a página atual em 1460 tokens: mais perto da fórmula de patch
(1456) do que da /750 (1522), sugerindo que a API já havia migrado para
cobrança por patch.

## Executando

```bash
pnpm run build                              # pré-requisito dist/ (como todos os evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # apenas previsões, sem chave, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Deve atingir a API **diretamente** — nunca através do proxy OmniGlyph, que
transformaria o corpo. `count_tokens` é gratuito; o sweep completo faz ~25
requests.

## Lendo o output

Por modelo, cada linha de sonda mostra os tokens de imagem medidos (com
imagem menos a baseline só de texto) contra as quatro previsões
(`patch`/`legacy750` × `standard`/`highres`); o resumo classifica as
hipóteses pelo resíduo absoluto médio. `--probe-multi` verifica o limite por
imagem (2×1092² ≈ 2×1521); `--probe-20plus` verifica a regra de >20 imagens
(um lado >2000 px deve ser rejeitado, não redimensionado). As linhas caem em
`results/*.jsonl`; a matemática de previsão vive em `formulas.mjs`, fixada
por `tests/billing-sweep-formulas.test.ts`.

## Depois do veredito

- Fórmula de patch confirmada → portar o PR #27 do OmniGlyph (tradução exata
  de redimensionamento) e alinhar a matemática do gate
  `ANTHROPIC_PIXELS_PER_TOKEN` em `src/core/transform.ts`.
- Tier de alta resolução confirmado no Fable → reintroduzir uma geometria de
  página por tier (páginas classe 1928×1928 para Fable/Opus 4.8/Sonnet 5,
  1568×728 para padrão), espelhando como o caminho GPT já mantém seu próprio
  `GPT_MAX_HEIGHT_PX`.
