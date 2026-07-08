# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versionamento semântico.

## [1.0.0] — 2026-07-07

Primeiro lançamento público.

### O produto

- **Proxy de compressão de contexto como imagem**: reescreve as partes volumosas
  de cada pedido LLM (prompt de sistema, documentação de ferramentas, histórico
  antigo, saídas de ferramentas grandes) em páginas PNG densas de 1 bit antes de
  saírem da sua máquina. Servidor Node local e host Cloudflare Workers.
- **Matemática de faturação exata por fornecedor** (`src/core/`): patches de
  28px da Anthropic + 3–4 tokens/bloco de overhead (sweep próprio, resíduo
  zero), fórmulas da OpenAI e da Gemini auditadas face à documentação oficial.
  Exportado na raiz do pacote (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, limites de nível).
- **Configuração de render de produção medida**: atlas de glifos densos de 1
  bit (sem anti-aliasing), páginas de nível standard — cada escolha respaldada
  por um recibo de benchmark em `benchmarks/*/results/`.
- **Conjuntos de benchmarks** (`benchmarks/`): billing-sweep (contabilização de
  tokens) e density-frontier (fronteira de precisão de leitura entre modelos/
  densidades), reexecutáveis via API, OpenRouter, Claude Code CLI, ou através
  do OmniRoute (`--via-omniroute`).
- **Repetição em caso de recusa**: um detetor de SSE/JSON repete o pedido
  original quando um modelo recusa a página renderizada (interruptor de
  emergência `retryRefusalWithOriginal`).
- **Cache de render LRU** para páginas determinísticas.
- **Motor OmniRoute**: distribuído como o motor de compressão `omniglyph` no
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (modo isolado e
  pipeline empilhado), com gates fail-closed e contabilização de tokens
  sensível a imagens.

### Os números (todos reprodutíveis)

- Render de amostra de UI: 1015 caracteres → PNG 438×120, 254 → 84 tokens
  (**66,9% poupados**).
- Página standard 1568×728 = 1456 tokens de imagem independentemente da
  quantidade de texto que contém.
- A Claude lê páginas densas de 1 bit a 100% na densidade de produção; o Opus
  4.8 lê 77–87% a 10×16.

### Decisões negativas (medidas, não opiniões)

- **O nível de alta resolução é uma armadilha de faturação**: a página 1928²
  é cobrada WYSIWYG mas o codificador não recebe a resolução completa — ambos
  os níveis renderizam páginas standard.
- **GPT-5.5 rejeitado**: 0/60 leituras da faixa densa e inflação de conclusão
  de ~40× face ao controlo de texto.
- **gpt-4o-mini nunca imageificado** (o piso de 2833/5667 tokens torna-o
  economicamente inviável).
- **Gemini 2.5-flash confabula** em vez de se abster em páginas densas
  (0/26) — reteste pendente com quota paga.
