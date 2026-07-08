# Benchmarks

Cada número que o OmniGlyph reivindica vem de um dos dois conjuntos abaixo —
reexecutáveis, determinísticos sempre que possível, com recibos brutos por
resposta em `*/results/*.jsonl`. Análise consolidada:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — quanto custa realmente uma imagem?

Sondas gratuitas de `count_tokens` contra a API real da Anthropic, comparando
a fórmula retirada `w·h/750` com o modelo atual de patches de 28 px em 11
geometrias de sonda em 2 modelos × 2 níveis de resolução.

**Resultado (2026-07-05): o modelo de patch ajusta-se com resíduo ZERO em
todas as sondas** — faturado = `⌈w/28⌉ × ⌈h/28⌉` após redimensionamento por
nível, mais um número fixo de +3/+4 tokens por bloco de imagem. A página de
produção (1568×728) custa exatamente 1.460 tokens e transporta 28.080
caracteres ≈ **19,2 caracteres/token** contra ~2 caracteres/token como texto
denso.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # apenas previsões, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # sweep ao vivo, ainda $0 (count_tokens é grátis)
```

## 2. `density-frontier/` — o modelo consegue realmente LÊ-LA?

Custo (offline, exato) × precisão de leitura (ao vivo) em configurações de
render, geometrias de página, atlas de glifos e fornecedores. O corpus
planta agulhas de string exata (ids hexadecimais, camelCase, sequências de
dígitos) mais **distratores quase-idênticos construídos a partir dos pares
de confundibilidade de glifos medidos** — de modo a que a confabulação
silenciosa seja detetada, não apenas contada como erro. A pontuação é
determinística (sem juiz LLM): `correct` / `abstained` (`ILEGIVEL` honesto) /
`silent_wrong` / `no_answer`.

**Resultados principais** (n=30 por braço):

| braço | leituras exatas | notas |
|---|---:|---|
| Fable 5 · página standard · atlas 1-bit (produção) | **30/30** | zero erros, zero confabulação |
| Fable 5 · página standard · atlas AA (antigo padrão) | 25/30 | 5 abstenções honestas — por que a produção mudou para 1-bit |
| Fable 5 · página alta resolução 1928² | 1–2/30 | faturada 3,3× mas o codificador faz resample — a armadilha de faturação, não ativada |
| Opus 4.8 · glifos 10×16 | 23–26/30 | o modo seguro opcional |
| GPT-5.5 · faixa 768px (ambos os atlas) | 0/60 | + ~40× de inflação de tokens de saída face ao seu próprio controlo de texto (30/30, 62 tok) |
| Gemini 2.5-flash (parcial, quota) | 0/26 | confabula em vez de se abster |

Três transportes: API direta (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
`GEMINI_API_KEY`), OpenRouter (`OPENROUTER_API_KEY`), e `--via-cli` (uma
subscrição do Claude Code — $0). Ressalva aprendida da forma difícil:
intermediários (OpenRouter, a ferramenta Read da CLI) fazem resample de
imagens grandes; apenas os resultados via API direta são autoritativos para
legibilidade.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # tabela de custos, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscrição, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Testes unitários que fixam as partes puras (corpus, pontuação, fórmulas de
custo): `tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
