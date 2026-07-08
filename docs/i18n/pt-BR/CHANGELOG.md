# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versionamento semântico.

## [1.0.0] — 2026-07-07

Primeiro lançamento público.

### O produto

- **Proxy de compressão contexto-como-imagem**: reescreve as partes volumosas
  de cada request de LLM (system prompt, docs de ferramentas, histórico antigo,
  saídas grandes de ferramenta) em páginas PNG densas de 1 bit antes de saírem
  da sua máquina. Servidor Node local e host para Cloudflare Workers.
- **Matemática de cobrança exata por provedor** (`src/core/`): patches de 28px
  da Anthropic + overhead de 3–4 tokens/bloco (sweep próprio, resíduo zero),
  fórmulas da OpenAI e do Gemini auditadas contra a documentação oficial.
  Exportado na raiz do pacote (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, limites de tier).
- **Config de render de produção medida**: atlas de glifos denso 1-bit (sem
  anti-aliasing), páginas de tier padrão — cada escolha respaldada por um
  comprovante de benchmark em `benchmarks/*/results/`.
- **Harnesses de benchmark** (`benchmarks/`): billing-sweep (contabilidade de
  tokens) e density-frontier (fronteira de precisão de leitura entre
  modelos/densidades), re-executáveis via API, OpenRouter, Claude Code CLI, ou
  via OmniRoute (`--via-omniroute`).
- **Retry de recusa**: sniffer SSE/JSON reproduz o request original quando um
  modelo recusa a página renderizada (kill switch `retryRefusalWithOriginal`).
- **Cache LRU de render** para páginas determinísticas.
- **Motor OmniRoute**: distribuído como o motor de compressão `omniglyph` no
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (modo único e
  pipeline empilhado), com gates fail-closed e contabilidade de tokens ciente
  de imagem.

### Os números (todos reprodutíveis)

- Render de UI de amostra: 1015 caracteres → PNG 438×120, 254 → 84 tokens
  (**66,9% economizados**).
- Página padrão 1568×728 = 1456 tokens de imagem independentemente de quanto
  texto ela carrega.
- O Claude lê páginas densas de 1 bit com 100% de acerto na densidade de
  produção; Opus 4.8 lê 77–87% em 10×16.

### Decisões negativas (medidas, não opiniões)

- **O tier de alta resolução é uma armadilha de cobrança**: a página 1928² é
  cobrada WYSIWYG, mas o encoder não recebe a resolução completa — ambos os
  tiers renderizam páginas padrão.
- **GPT-5.5 rejeitado**: 0/60 leituras da faixa densa e ~40× de inflação na
  completion vs. controle de texto.
- **gpt-4o-mini nunca é transformado em imagem** (piso de 2833/5667 tokens
  torna a operação não lucrativa).
- **Gemini 2.5-flash confabula** em vez de se abster em páginas densas
  (0/26) — reteste pendente com quota paga.
