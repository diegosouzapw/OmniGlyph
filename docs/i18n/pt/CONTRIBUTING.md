# Contribuir para o OmniGlyph

Obrigado pelo seu interesse! Este projeto tem duas regras de cultura não
negociáveis — são a razão pela qual cada número no README pode ser confiado.

## Regra 1 — TDD estrito

Todo o código de produção nasce de um teste que falhou primeiro:

1. Escreva o teste e **veja-o falhar pelo motivo certo**.
2. Escreva o mínimo necessário para o fazer passar.
3. Refatore mantendo-o verde.

A barra completa é: `pnpm run typecheck && pnpm test && pnpm run build` —
os três, sempre (a verificação de links da documentação e a guarda de
rebranding correm dentro de `pnpm test`, via
`tests/docs-integrity.test.ts`).

## Regra 2 — Medição antes de afirmações

Nenhuma alteração à geometria, ao atlas, à fórmula de faturação ou ao âmbito
de modelos é integrada sem um número medido. O repositório está construído
em torno desta disciplina:

- Custo de faturação → prove-o com `benchmarks/billing-sweep/` (`count_tokens`
  é gratuito; resíduo esperado: zero).
- Legibilidade → prove-a com `benchmarks/density-frontier/` (n≥30 por braço,
  pontuação determinística, recibos JSONL integrados em
  `benchmarks/*/results/`).
- A barra de aceitação para alterar um valor por omissão de produção: gist ==
  linha de base de texto **E** zero erros silenciosos de string exata **E**
  poupança positiva.

Hipóteses sem números vão para `docs/ROADMAP.md` como hipóteses — nunca para
o README como factos. Duas ideias "óbvias" já foram refutadas com dados (a
página de alta resolução, o atlas com anti-aliasing); o processo funciona.

## Configuração

```bash
pnpm install
pnpm test              # suíte completa, ~40–90s
pnpm run dev:node      # proxy local em modo de observação
```

Node ≥18 (CI testa 20/22/24), pnpm 10 (fixado por `packageManager` no
package.json).

## Estrutura

| pasta | regra |
|---|---|
| `src/core/` | agnóstico de runtime (apenas Web APIs — corre em Node e Workers) |
| `src/node.ts` / `src/worker.ts` | apenas ligação de host |
| `benchmarks/` | conjuntos reexecutáveis; resultados JSONL são recibos, integrados |
| `docs/` | benchmarks/ (números), architecture/ (mapa), ROADMAP (hipóteses), ops/ (OmniRoute) |

## Commits e PRs

- Commits convencionais (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), corpo a explicar o *porquê* com os números relevantes.
- PRs pequenos e focados; alterações de comportamento vêm com o teste que as
  fixa e, quando aplicável, o benchmark que as justifica.
- Não reescreva blocos `cache_control` do cliente, não adicione dependências
  de runtime sem discussão (o núcleo é propositadamente leve em
  dependências), não use `Math.random`/timestamps nos caminhos de render (o
  determinismo é um invariante rígido, testado por identidade de bytes).
