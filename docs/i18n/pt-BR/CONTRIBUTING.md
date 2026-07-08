# Contribuindo com o OmniGlyph

Obrigado pelo interesse! Este projeto tem duas regras de cultura inegociáveis
— são o motivo pelo qual todo número no README pode ser confiado.

## Regra 1 — TDD estrito

Todo código de produção nasce de um teste que falhou primeiro:

1. Escreva o teste e **veja-o falhar pelo motivo certo**.
2. Escreva o mínimo necessário para passar.
3. Refatore mantendo tudo verde.

A barra completa é: `pnpm run typecheck && pnpm test && pnpm run build` —
sempre os três (o link-lint de docs e o guard de rebrand rodam dentro de
`pnpm test`, via `tests/docs-integrity.test.ts`).

## Regra 2 — Medição antes de afirmações

Nenhuma mudança em geometria, atlas, fórmula de cobrança ou escopo de modelo
entra sem um número medido. O repositório é construído em torno dessa
disciplina:

- Custo de cobrança → prove com `benchmarks/billing-sweep/` (`count_tokens` é
  gratuito; resíduo esperado: zero).
- Legibilidade → prove com `benchmarks/density-frontier/` (n≥30 por braço,
  pontuação determinística, comprovantes JSONL versionados em
  `benchmarks/*/results/`).
- A barra de aceitação para mudar um padrão de produção: gist == baseline de
  texto **E** zero erros silenciosos de string exata **E** economia positiva.

Hipóteses sem números vão para `docs/ROADMAP.md` como hipóteses — nunca para
o README como fatos. Duas ideias "óbvias" já foram refutadas com dados (a
página de alta resolução, o atlas com anti-aliasing); o processo funciona.

## Configuração

```bash
pnpm install
pnpm test              # suíte completa, ~40–90s
pnpm run dev:node      # proxy local em modo watch
```

Node ≥18 (CI testa 20/22/24), pnpm 10 (fixado por `packageManager` no
package.json).

## Estrutura

| pasta | regra |
|---|---|
| `src/core/` | agnóstico de runtime (só Web APIs — roda em Node e Workers) |
| `src/node.ts` / `src/worker.ts` | apenas plumbing de host |
| `benchmarks/` | harnesses re-executáveis; resultados JSONL são comprovantes, versionados |
| `docs/` | benchmarks/ (números), architecture/ (mapa), ROADMAP (hipóteses), ops/ (OmniRoute) |

## Commits e PRs

- Commits convencionais (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), corpo explicando o *porquê* com os números relevantes.
- PRs pequenos e focados; mudanças de comportamento vêm com o teste que as
  fixa e, quando aplicável, o benchmark que as justifica.
- Não reescreva blocos `cache_control` do cliente, não adicione dependências
  de runtime sem discussão (o core é propositalmente leve em dependências),
  não use `Math.random`/timestamps em caminhos de render (determinismo é um
  invariante rígido, testado por identidade de bytes).
