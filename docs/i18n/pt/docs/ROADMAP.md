# Roadmap do fork — "o nosso OmniGlyph" + integração com o OmniRoute

Plano de trabalho consolidado (2026-07-05) a partir de: sweep de faturação
medido, auditoria OpenAI/Gemini face à documentação oficial, análise de
ferramentas relacionadas, e o conjunto density-frontier. Estado de cada
item: ☐ pendente · ◐ parcial · ☑ concluído aqui.

## Fase 0 — Fundação de medição (CONCLUÍDA neste repositório)

- ☑ Faturação exata da Anthropic (patches de 28px, 2 níveis, +4/bloco) — `src/core/anthropic-vision.ts`, sweep em `benchmarks/billing-sweep/`.
- ☑ Gate de rentabilidade com custo exato (substituiu w·h/750 × 1,10).
- ☑ Geometria por nível: Fable/Opus 4.8/Sonnet 5 → páginas 1928×1928 (3,3× menos imagens); standard → 1568×728. 691 testes verdes.
- ☑ Conjunto `benchmarks/density-frontier/` (custo × precisão offline via API, agulhas com distratores confundíveis, pontuação determinística).

## Fase 1 — Correções de faturação multi-fornecedor (bugs confirmados na auditoria)

Prioridade definida pela auditoria (documentação oficial capturada em 2026-07-05):

1. ☐ **D2 (gate INVERTIDO)**: `gpt-4o-mini` cai no tile por omissão 85/170, mas custa **2833 base / 5667 por tile** (~33× subestimado, ~0,8 char/token) — imageificá-lo é sempre uma perda e o gate aprova-o. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` é enviado incondicionalmente (`src/core/openai.ts:392,402`), mas só existe a partir do gpt-5.4+; derivar do perfil.
3. ☐ **D1**: multiplicador do `o4-mini` 1,62 → **1,72** (subestima em 5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` estão no balde de patches com **cap 1536 sem `original`** (o código assume 10000); `gpt-5-codex-mini` está no regime errado (tile → patch).
5. ☐ **Geometria GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (alinha com AMBOS os regimes: 64×32 patches e 4×512 tiles; +6,25% de caracteres grátis). Perfil `original` dedicado 5.4/5.5: até 1568×5984 (9.163 patches ≤ 10k, ~233k caracteres num único bloco) — primeiro um A/B de legibilidade.
6. ☐ **Suporte a Gemini** (novo): `src/core/gemini.ts` + `gemini-model-profiles.ts` + rotas `:generateContent`/`:streamGenerateContent` no proxy. Geometria documentável: **1152×1536 (unidade de corte exata 768, 4 tiles, 42,2 caracteres/token — melhor rácio documentado dos 3 fornecedores)**; apostas a calibrar: 768² com `media_resolution:MEDIUM` (56,4) e Gemini 3 HIGH. Cuidado: o endpoint compatível com OpenAI do Gemini passaria pelo transformador OpenAI com faturação errada.

## Fase 2 — Qualidade de leitura (conjunto density-frontier como juiz)

- ◐ A/B decisivo std vs high-res na Fable (em curso; barra: gist == texto E zero erros silenciosos E poupança > 0).
- ☐ Resolver a contradição AA vs 1-bit no caminho denso (o código diz "apenas para avaliação", a produção usa AA).
- ☐ (ADIADO com justificação em 2026-07-06) Cirurgia de glifos: a configuração de produção lê 30/30 — não há falha mensurável para a cirurgia corrigir hoje. Revisitar se um alvo abaixo de 100% entrar no âmbito (ex.: Opus) ou se novas medições mostrarem uma regressão.
- ☑ ~~A/B de tema claro~~ RESOLVIDO por inspeção (2026-07-06): o render JÁ É preto-sobre-branco (render.ts:635/822, inversão pós-blit) — alinhado com a literatura; a hipótese nasceu de uma premissa errada (imagem de exemplo do upstream).
- ☐ Lista de palavras com checksum para IDs exatos ao byte (upstream #38, aprovado) + faixa de abstenção (#31/#32) + camelCase na factsheet (#33/#34).
- ☑ Port #45: $schema/$id preservados, tuplas removidas por elemento (commit no main).
- ☑ Repetição em caso de recusa (#37/H11): detetor de repetição sem perdas + repetição única com o corpo original; telemetria refusalRetried (commit no main).
- ☐ Ferramenta de rehidratação (`RecoverableBlock` → ferramenta invocável; LensVLM valida a reexpansão seletiva).

## Fase 3 — Desempenho/robustez

- ☐ Cache de render LRU (determinístico por invariante; hoje slab + blocos congelados voltam a renderizar em cada pedido).
- ☐ Codificação PNG numa worker thread; nível de deflate configurável.
- ☐ Portar correções abertas do upstream: #44 (ferramentas nativas tipadas → 400), #45 (loop de remoção de esquema draft-07 → 400), #42 (proxy CONNECT para o Claude Desktop), #19 (dupla faturação de descrições GPT).
- ☐ Implementar ADAPTIVE_CPT_PLAN (cpt por papel de bloco; slab real = 1,50).

## Fase 4 — O próprio fork

- ☐ Nome/repositório próprio (decisão do Diego) + `git remote` do upstream para cherry-picks.
- ☐ **TS em todo o lado**: o núcleo já é TS; converter `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (padrão: tsx + vitest; `benchmarks/density-frontier/` nasceu assim).
- ☐ Padrão de qualidade OmniRoute: eslint 9 + prettier, CI com typecheck/test/build/verificação de links, CONTRIBUTING, SECURITY, README i18n (pt-BR primeiro), CHANGELOG semântico.
- ☐ **GIFs em vez de vídeos** no README (gravar com vhs/asciinema+agg; lado a lado simples vs proxy).
- ☐ Dashboard v2 (reimplementar via API HTTP — não herdar código de terceiros): lançador "abrir terminal com ANTHROPIC_BASE_URL", verificação "o tráfego está a passar por mim?", inspetor imagem-vs-texto, sessões, painel de custo em moeda, i18n leve, SSE em vez de polling, persistência SQLite com retenção (o seu esquema de 24 colunas é um bom ponto de partida).
- ☐ Micro-ideias de dense-image-gen: modo `lines` (layout preservado para código/tabelas), `--keep-ws`, título de origem por página ("prompt de sistema" / "documentação de ferramentas" / "turno de histórico N"), CLI autónomo `render arquivo.md -o out.png`.

## Fase 5 — Portar para o OmniRoute

- ☐ Motor `CompressionEngine` (template `cavemanAdapter.ts`), registado em `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Ligação: passar `supportsVision` em `chatCore.ts:1297` (1 linha) ou resolver via `isVisionModelId`.
- ☐ Ordem de empilhamento: por último (renderizadores RTK/Caveman/semânticos primeiro; o OmniGlyph imageifica o residual).
- ☐ Invariantes: nunca reescrever blocos com o `cache_control` do cliente (lição #4560); o gate de fidelidade (#5127) precisa de uma isenção declarada ou uma factsheet de texto que satisfaça os invariantes; telemetria de tentativa com `skip_reason` (lição #4268).
- ☐ Roteamento: a repetição/fallback pós-motor deve respeitar a capacidade de visão e a allowlist (recomprimir ou contornar).
- ☐ Sinergia com CCR: `emitRecoverable` → armazenamento CCR com recuperação por fatia (`head/tail/grep`, #5187) = reexpansão seletiva completa.
- ☐ Alargamento de camada gratuita como funcionalidade de marketing: cada token de camada gratuita rende ~2-3× mais caracteres em modelos de visão; a camada gratuita do Gemini + geometria 1152×1536 é o caso mais forte.

## Riscos em aberto

- Recusas da Fable após reimplementação em contexto imageificado (upstream #37) — mitigar antes de ativar por omissão no OmniRoute.
- Arbitragem de preços: se a Anthropic reprecificar a visão, a poupança muda — o contrafactual por pedido (`count_tokens`) é a defesa.
- OpenAI: medição da comunidade (PageWatch) viu os tokens de conclusão aumentarem e latência 2× — medir por fornecedor antes de ativar.

## Resultados A/B 2026-07-05 (via OpenRouter — INCONCLUSIVO para geometria, válido para modos de falha)

| configuração | verbatim | abst. | filtrado | erro-silencioso |
|---|---|---|---|---|
| fable std 5×8 (AA e 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 previstos) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 previstos) |
| opus hires 10×16 | **7/9 lidos** | 0 | 21 sem créditos | 2 (dígito) |

Conclusões válidas: (1) o classificador (issue #37) é o modo de falha
DOMINANTE para perguntas de transcrição na página standard — 100%
filtrado — e não dispara na página grande; a redação importa. (2) A
abstenção funciona: 20× ILEGIVEL vs 5 confabulações na página grande. (3) O
Opus a 10×16 lê 78% exato (n=9) vs 0% histórico a 5×8 — primeira evidência
direta do joelho da curva. (4) A ilegibilidade da página grande via
OpenRouter sugere um RESAMPLE de transporte (Bedrock/Vertex nível
standard?) — hipótese decisiva a testar na API direta da Anthropic; o A/B
de geometria permanece EM ABERTO até lá. Os créditos do OpenRouter
esgotaram-se a meio do braço do Opus.

## Matriz final 2×2 (2026-07-05, via CLI/subscrição, Fable 5, n=30/braço)

| página × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Zero confabulação nos 4 braços (120 perguntas — toda falha foi ILEGIVEL).
APLICADO: DENSE_RENDER_STYLE alterado para 1-bit (aa:false) com uma fixação
em tests/dense-style.test.ts. Opus 4.8: 26/30 a 10×16 na página grande,
30/30 ILEGIVEL a 5×8 — modo seguro do Opus viável. A página de alta
resolução permanece degradada pelos transportes (CLI Read/resample do
OpenRouter) — o veredito de geometria WYSIWYG ainda depende da API direta.
