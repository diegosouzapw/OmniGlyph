# Roadmap do fork — "nosso OmniGlyph" + integração com OmniRoute

Plano de trabalho consolidado (2026-07-05) a partir de: sweep de cobrança
medido, auditoria OpenAI/Gemini contra a documentação oficial, análise de
ferramentas relacionadas, e o harness density-frontier. Status de cada item:
☐ pendente · ◐ parcial · ☑ concluído aqui.

## Fase 0 — Fundação de medição (CONCLUÍDA neste repositório)

- ☑ Cobrança exata da Anthropic (patches de 28px, 2 tiers, +4/bloco) — `src/core/anthropic-vision.ts`, sweep em `benchmarks/billing-sweep/`.
- ☑ Gate de rentabilidade com custo exato (substituiu w·h/750 × 1.10).
- ☑ Geometria por tier: Fable/Opus 4.8/Sonnet 5 → páginas 1928×1928 (3,3× menos imagens); padrão → 1568×728. 691 testes verdes.
- ☑ Harness `benchmarks/density-frontier/` (custo × precisão offline via API, needles com distratores confusíveis, pontuação determinística).

## Fase 1 — Correções de cobrança multi-provedor (bugs confirmados na auditoria)

Prioridade definida pela auditoria (documentação oficial capturada em 2026-07-05):

1. ☐ **D2 (gate INVERTIDO)**: `gpt-4o-mini` cai no tile padrão 85/170, mas custa **2833 base / 5667 por tile** (~33× subestimado, ~0,8 char/token) — transformar em imagem nele é sempre um prejuízo e o gate aprova. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` é enviado incondicionalmente (`src/core/openai.ts:392,402`), mas só existe em gpt-5.4+; derivar do perfil.
3. ☐ **D1**: multiplicador de `o4-mini` 1.62 → **1.72** (subestima em 5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` estão no bucket de patch **cap 1536 sem `original`** (o código assume 10000); `gpt-5-codex-mini` está no regime errado (tile → patch).
5. ☐ **Geometria GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (alinha com AMBOS os regimes: patches 64×32 e tiles 4×512; +6,25% de caracteres grátis). Perfil `original` dedicado 5.4/5.5: até 1568×5984 (9.163 patches ≤ 10k, ~233k caracteres em um bloco) — legibilidade A/B primeiro.
6. ☐ **Suporte ao Gemini** (novo): `src/core/gemini.ts` + `gemini-model-profiles.ts` + rotas `:generateContent`/`:streamGenerateContent` no proxy. Geometria documentável: **1152×1536 (unidade de crop exata 768, 4 tiles, 42,2 caracteres/token — melhor razão documentada dos 3 provedores)**; apostas a calibrar: 768² com `media_resolution:MEDIUM` (56,4) e Gemini 3 HIGH. Cuidado: o endpoint compatível com OpenAI do Gemini passaria pelo transformador da OpenAI com cobrança errada.

## Fase 2 — Qualidade de leitura (harness density-frontier como juiz)

- ◐ A/B decisivo std vs. alta resolução no Fable (em andamento; barra: gist == texto E zero erro silencioso E economia > 0).
- ☐ Resolver a contradição AA vs. 1-bit no caminho denso (o código diz "eval-only", a produção usa AA).
- ☐ (ADIADO com justificativa em 2026-07-06) Cirurgia de glifos: a config de produção lê 30/30 — não há erro mensurável para a cirurgia corrigir hoje. Revisitar se um alvo sub-100% entrar em escopo (por exemplo, Opus) ou se novas medições mostrarem regressão.
- ☑ ~~A/B de tema claro~~ RESOLVIDO por inspeção (2026-07-06): o render JÁ É preto-sobre-branco (render.ts:635/822, inversão pós-blit) — alinhado com a literatura; a hipótese nasceu de uma premissa errada (imagem de exemplo upstream).
- ☐ Wordlist com checksum para IDs byte-exatos (upstream #38, endossado) + banner de abstenção (#31/#32) + camelCase na factsheet (#33/#34).
- ☑ Port #45: $schema/$id preservados, tuplas removidas por elemento (commit em main).
- ☑ Retry-on-refusal (#37/H11): sniffer de replay sem perda + retry único com o corpo original; telemetria refusalRetried (commit em main).
- ☐ Ferramenta de rehidratação (`RecoverableBlock` → ferramenta invocável; LensVLM valida a reexpansão seletiva).

## Fase 3 — Performance/robustez

- ☐ Cache LRU de render (determinístico por invariante; slab + chunks congelados renderizam de novo a cada request hoje).
- ☐ Codificação de PNG em uma worker thread; nível de deflate configurável.
- ☐ Portar correções upstream em aberto: #44 (ferramentas nativas tipadas → 400), #45 (loop de schema-strip draft-07 → 400), #42 (proxy CONNECT para Claude Desktop), #19 (dupla cobrança de descrições GPT).
- ☐ Implementar ADAPTIVE_CPT_PLAN (cpt por papel de bloco; slab real = 1,50).

## Fase 4 — O fork em si

- ☐ Nome/repositório próprio (decisão do Diego) + `git remote` upstream para cherry-picks.
- ☐ **TS em todo lugar**: o core já é TS; converter `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (padrão: tsx + vitest; `benchmarks/density-frontier/` nasceu assim).
- ☐ Padrão de qualidade do OmniRoute: eslint 9 + prettier, CI com typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR primeiro), CHANGELOG semântico.
- ☐ **GIFs em vez de vídeos** no README (gravar com vhs/asciinema+agg; lado a lado simples vs. proxy).
- ☐ Dashboard v2 (reimplementar via API HTTP — não herdar código de terceiros): launcher "abrir terminal com ANTHROPIC_BASE_URL", verificação "o tráfego está passando por mim?", inspetor imagem-vs-texto, sessões, painel de custo em moeda, i18n leve, SSE em vez de polling, persistência em SQLite com retenção (o schema de 24 colunas é um bom ponto de partida).
- ☐ Micro-ideias do dense-image-gen: modo `lines` (layout preservado para código/tabelas), `--keep-ws`, título de origem por página ("system prompt" / "docs de ferramentas" / "turno de histórico N"), CLI standalone `render arquivo.md -o out.png`.

## Fase 5 — Port para o OmniRoute

- ☐ Motor `CompressionEngine` (template `cavemanAdapter.ts`), registrado em `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: passar `supportsVision` em `chatCore.ts:1297` (1 linha) ou resolver via `isVisionModelId`.
- ☐ Ordem no stack: por último (RTK/Caveman/renderizadores semânticos primeiro; o OmniGlyph transforma em imagem o residual).
- ☐ Invariantes: nunca reescrever blocos com o `cache_control` do cliente (lição #4560); o gate de fidelidade (#5127) precisa de uma isenção declarada ou uma factsheet de texto que satisfaça os invariantes; telemetria de tentativa com `skip_reason` (lição #4268).
- ☐ Roteamento: fallback/retry pós-motor deve respeitar a capacidade de visão e a allowlist (recomprimir ou pular).
- ☐ Sinergia com CCR: `emitRecoverable` → armazenamento CCR com recuperação por fatia (`head/tail/grep`, #5187) = reexpansão seletiva completa.
- ☐ Extensão do tier gratuito como recurso de marketing: cada token do tier gratuito rende ~2-3× mais caracteres em modelos de visão; o tier gratuito do Gemini + geometria 1152×1536 é o caso mais forte.

## Riscos em aberto

- Recusas do Fable pós-redeploy em contexto transformado em imagem (upstream #37) — mitigar antes de default-on no OmniRoute.
- Arbitragem de preço: se a Anthropic reprecificar visão, a economia muda — o contrafactual por request (`count_tokens`) é a defesa.
- OpenAI: medição da comunidade (PageWatch) viu tokens de completion subirem e latência 2× — medir por provedor antes de habilitar.

## Resultados A/B 2026-07-05 (via OpenRouter — INCONCLUSIVO para geometria, válido para modos de falha)

| config | verbatim | abst. | filtrado | erro-silencioso |
|---|---|---|---|---|
| fable std 5×8 (AA e 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 previstos) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 previstos) |
| opus hires 10×16 | **7/9 leu** | 0 | 21 sem créditos | 2 (dígito) |

Achados válidos: (1) o classificador (issue #37) é o modo de falha DOMINANTE
para perguntas de transcrição na página padrão — 100% filtrado — e não
dispara na página grande; a redação importa. (2) A abstenção funciona: 20×
ILEGIVEL vs. 5 confabulações na página grande. (3) Opus em 10×16 lê 78%
exato (n=9) vs. 0% histórico em 5×8 — primeira evidência direta do "knee".
(4) A ilegibilidade da página grande via OpenRouter sugere um RESAMPLE de
transporte (Bedrock/Vertex tier padrão?) — hipótese decisiva a testar na API
direta da Anthropic; o A/B de geometria continua EM ABERTO até então. Os
créditos do OpenRouter acabaram no meio do braço do Opus.

## Matriz 2×2 final (2026-07-05, via CLI/assinatura, Fable 5, n=30/braço)

| página × atlas | 1-bit | AA |
|---|---|---|
| padrão 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| alta resolução 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Zero confabulação nos 4 braços (120 perguntas — todo erro foi ILEGIVEL).
APLICADO: DENSE_RENDER_STYLE mudado para 1-bit (aa:false) com um pin em
tests/dense-style.test.ts. Opus 4.8: 26/30 em 10×16 na página grande, 30/30
ILEGIVEL em 5×8 — modo seguro do Opus viável. A página de alta resolução
permanece degradada pelos transportes (Read do CLI/resample do OpenRouter) —
o veredito de geometria WYSIWYG ainda depende da API direta.
