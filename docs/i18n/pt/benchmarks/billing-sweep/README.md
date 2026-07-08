# Sweep de faturação de visão da Anthropic

🌐 Traduzido: [todos os idiomas](../../../README.md)

**Porque existe:** o gate de rentabilidade só é seguro se a estimativa de
custo for *exata*. Uma fórmula que erre por pouco converteria blocos que na
realidade custam mais. Por isso este sweep fixa a fórmula aos números reais
da API antes de ir para produção — até um **resíduo zero**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Sweep gratuito de `count_tokens` que decide duas questões de geometria em
aberto:

1. **Fórmula** — a API fatura patches `ceil(w/28) × ceil(h/28)` (documentação
   atual) ou a fórmula retirada `w·h/750`? O conjunto de sondas separa as
   duas por 25–180 tokens por linha.
2. **Nível** — o `claude-fable-5` recebe os limites de alta resolução (aresta
   longa ≤ 2576 px, ≤ 4784 tokens visuais)? A linha `page-old-1928x1928` é a
   decisora: ≈ **4761** medidos significa alta resolução WYSIWYG (a antiga
   página grande transporta ~3,3× mais caracteres por imagem do que a
   1568×728 de hoje, ao mesmo rácio de caracteres/token); ≈ **1521** significa
   resample de nível standard, e a 1568×728 permanece correta.

Contexto: o sweep de 2026-07-01 por trás da atual página 1568×728 (auditoria
de legibilidade, 2026-07-01) foi medido em `claude-sonnet-4-5` — um modelo de
nível standard — enquanto a produção tem como alvo a Fable 5, que a
documentação de visão coloca no nível de alta resolução. Essa auditoria
também mediu a página atual em 1460 tokens: mais perto da fórmula de patch
(1456) do que de /750 (1522), sugerindo que a API já tinha migrado para a
faturação por patch.

## Executar

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Tem de atingir a API **diretamente** — nunca através do proxy OmniGlyph, que
transformaria o corpo. `count_tokens` é gratuito; o sweep completo faz ~25
pedidos.

## Ler o resultado

Por modelo, cada linha de sonda mostra os tokens de imagem medidos (com
imagem menos a linha de base apenas de texto) face às quatro previsões
(`patch`/`legacy750` × `standard`/`highres`); o resumo classifica as
hipóteses pelo resíduo absoluto médio. `--probe-multi` verifica o limite por
imagem (2×1092² ≈ 2×1521); `--probe-20plus` verifica a regra de mais de 20
imagens (um lado com mais de 2000 px deve ser rejeitado, não redimensionado).
As linhas ficam em `results/*.jsonl`; a matemática de previsão vive em
`formulas.mjs`, fixada por `tests/billing-sweep-formulas.test.ts`.

## Depois do veredito

- Fórmula de patch confirmada → portar a PR #27 do OmniGlyph (tradução exata
  de redimensionamento) e alinhar a matemática do gate
  `ANTHROPIC_PIXELS_PER_TOKEN` em `src/core/transform.ts`.
- Nível de alta resolução confirmado na Fable → reintroduzir uma geometria de
  página por nível (páginas da classe 1928×1928 para Fable/Opus 4.8/Sonnet 5,
  1568×728 para standard), espelhando como o caminho do GPT já mantém o seu
  próprio `GPT_MAX_HEIGHT_PX`.
