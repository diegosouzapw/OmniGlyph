# Arquitetura

Mapa de uma página do código-fonte.

## Pipeline de request

```
cliente (Claude Code / qualquer SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  handler fetch único, padrão Web:
  │                                roteamento, passthrough de auth, contrafactual
  │                                count_tokens, eventos de uso/telemetria
  ▼
src/core/transform.ts              O pipeline (caminho Anthropic):
  │   1. parseia o body, resolve o tier de visão a partir do modelo
  │   2. gate de rentabilidade — custo exato de imagem vs. custo de texto
  │   3. converte: slab estático · tool_results grandes · histórico colapsado
  │   4. reinsere preservando as âncoras cache_control do cliente
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## Cobrança (exata, medida)

| módulo | provedor | modelo |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patches de 28 px + 4/bloco, limites de redimensionamento por tier; geometria de página (ambos os tiers renderizam a página padrão 1568×728 — o tier de alta resolução é uma armadilha de cobrança, veja [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | regimes de patch/tile por modelo, `detail` por perfil, geometria de faixa |
| `src/core/gemini-model-profiles.ts` | Google | fórmula de tile (unidade de crop `floor(min/1.5)`) + custos fixos de `media_resolution` |

## Renderização

- `src/core/render.ts` — texto → PNG via um atlas de glifos pré-compilado
  (Spleen 5×8 + fallback Unifont), reflow com sentinelas de quebra de linha
  `↵`, atlas 1-bit em produção (medido melhor que AA no Fable).
- `src/core/render-cache.ts` — memoização LRU de renders determinísticos
  (slab estático + chunks de histórico congelados renderizariam de novo a
  cada request, caso contrário).
- `src/core/history.ts` — colapsa turnos antigos em chunks de imagem
  congelados apenas para anexação, que permanecem byte-idênticos para que o
  cache de prompt continue acertando.
- `src/core/png.ts` — encoder PNG determinístico mínimo (sem dependências
  nativas).

## Guard rails

- Allowlist de modelos (`src/core/applicability.ts`): apenas modelos que
  passaram no benchmark de leitura são transformados em imagem; todo o resto
  passa byte-idêntico.
- Valores byte-exatos (SHAs, ids) viajam como texto em uma factsheet ao lado
  da imagem (`src/core/factsheet.ts`); originais recuperáveis via
  `emitRecoverable`.
- Ferramentas nativas tipadas (`type !== 'custom'`) nunca são reescritas
  (guard 400).

## Benchmarks e comprovantes

`benchmarks/` guarda os dois harnesses que produziram cada número no README
— veja [benchmarks/README.md](../../benchmarks/README.md).
