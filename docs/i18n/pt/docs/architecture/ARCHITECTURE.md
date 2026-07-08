# Arquitetura

Mapa de uma página da base de código.

## Pipeline de pedido

```
cliente (Claude Code / qualquer SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  handler fetch único e padrão Web:
  │                                roteamento, passagem de autenticação, count_tokens
  │                                contrafactual, eventos de uso/telemetria
  ▼
src/core/transform.ts              O pipeline (caminho Anthropic):
  │   1. analisa o corpo, resolve o nível de visão a partir do modelo
  │   2. gate de rentabilidade — custo exato de imagem vs custo de texto
  │   3. converte: slab estático · tool_results grandes · histórico recolhido
  │   4. reinsere preservando as âncoras cache_control do cliente
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## Faturação (exata, medida)

| módulo | fornecedor | modelo |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patches de 28 px + 4/bloco, limites de redimensionamento por nível; geometria de página (ambos os níveis renderizam a página standard 1568×728 — o nível de alta resolução é uma armadilha de faturação, ver [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | regimes de patch/tile por modelo, `detail` por perfil, geometria de faixa |
| `src/core/gemini-model-profiles.ts` | Google | fórmula de tile (`floor(min/1.5)` unidade de corte) + custos fixos de `media_resolution` |

## Renderização

- `src/core/render.ts` — texto → PNG via um atlas de glifos pré-cozido
  (Spleen 5×8 + fallback Unifont), reflow com sentinelas de nova linha `↵`,
  atlas de 1 bit em produção (medido melhor do que AA na Fable).
- `src/core/render-cache.ts` — memoização LRU de renders determinísticos
  (slab estático + blocos de histórico congelados voltariam a renderizar em
  cada pedido, caso contrário).
- `src/core/history.ts` — recolhe turnos antigos em blocos de imagem
  apenas-anexo congelados que permanecem idênticos ao byte para que o cache
  de prompt continue a acertar.
- `src/core/png.ts` — codificador PNG determinístico mínimo (sem
  dependências nativas).

## Barreiras de proteção

- Lista de permissões de modelos (`src/core/applicability.ts`): apenas
  modelos que passaram o benchmark de leitura são imageificados; todo o
  resto passa idêntico ao byte.
- Valores exatos ao byte (SHAs, ids) viajam como texto numa factsheet ao
  lado da imagem (`src/core/factsheet.ts`); originais recuperáveis via
  `emitRecoverable`.
- Ferramentas nativas tipadas (`type !== 'custom'`) nunca são reescritas
  (guarda 400).

## Benchmarks e recibos

`benchmarks/` contém os dois conjuntos que produziram cada número no
README — ver [benchmarks/README.md](../../benchmarks/README.md).
