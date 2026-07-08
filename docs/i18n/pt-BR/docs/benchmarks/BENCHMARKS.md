# OmniGlyph — Medições consolidadas (2026-07-05)

Tudo MEDIDO nesta sessão, com fonte e n; hipóteses claramente separadas no
final. Comprovantes: `benchmarks/billing-sweep/results/` e
`benchmarks/density-frontier/results/` (JSONL por resposta).

## 1. Cobrança da Anthropic (count_tokens direto, $0, 11 geometrias × 2 modelos)

Fórmula confirmada: `tokens = ceil(w/28) × ceil(h/28)` após redimensionamento
por tier, **+3/bloco (Fable 5) / +4/bloco (Sonnet 4.5)** — resíduo ZERO em
todas as linhas.

| sonda | dimensões | Fable 5 (alta resolução) | Sonnet 4.5 (padrão) |
|---|---|---:|---:|
| âncora de doc | 1092×1092 | 1524 | 1525 |
| âncora de doc | 1000×1000 | 1299 | 1300 |
| página padrão | 1568×728 | 1459 | 1460 |
| **página grande** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| teto de alta resolução | 1960×1960 | 4764 (clamp) | 1525 |
| borda longa de alta resolução | 2576×1204 | 3959 | 1516 |
| faixa alta | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imgs) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NÃO rejeitado em count_tokens) | 3585 |

Decisões derivadas (implementadas): gate exato por patch; tier por modelo
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = alta resolução); `cols` 313→312.

## 2. Precisão de leitura (density-frontier, needles hex/camelCase/dígito + distratores)

### Matriz 2×2 do Fable 5 — via CLI/assinatura, n=30/braço, mesmo corpus (~16,6k caracteres)

| página × atlas | exato | abstenções (ILEGIVEL) | erros silenciosos |
|---|---:|---:|---:|
| padrão 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| padrão 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| alta resolução 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| alta resolução 1928×1928 · AA | 0/30 | 29 | 1 (previsto pela matriz) |

→ **1-bit > AA em ambas as páginas; zero confabulação em 120 perguntas.**
APLICADO: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ a alta resolução chega degradada por resample de transporte (veja H1/H3) —
os 67% são um piso, não um teto.

### Opus 4.8 — via CLI/assinatura, n=30/braço

| config | exato | abstenções | erros |
|---|---:|---:|---:|
| alta resolução · célula 10×16 | **26/30 (87%)** | 0 | 4 (dígitos) |
| padrão · célula 5×8 | 0/30 | 30 | 0 |

→ Knee do Opus confirmado com nosso próprio n (upstream mediu 95% em 10×16
com n=20). "Modo seguro do Opus" é viável: 10×16 na página grande ≈ 1,7
caracteres por token de imagem no corpus do harness.

### Via OpenRouter (mesmo corpus/perguntas) — inconclusivo para legibilidade

| fato medido | número |
|---|---|
| content_filter em perguntas de transcrição (páginas padrão) | 60/60 (100%) |
| content_filter em páginas de alta resolução | 5-6/30 (~20%) |
| Fable alta resolução: abstenções + erros | 20 ILEGIVEL + 5 erros (2 previstos) |
| Opus 10×16 (antes de os créditos acabarem) | 7/9 exato (78%) |
| erros de leitura previstos pela matriz de confusibilidade | 4→a, 0→8, S/s maiúscula |

### Comparação de transporte (mesma pergunta, mesmo conteúdo)

| transporte | filtro/recusa | página grande legível? |
|---|---|---|
| API direta (n=9, antes de os créditos acabarem) | 0 | não testado |
| OpenRouter | ~100% padrão / ~20% alta resolução | não (suspeita: resample) |
| Claude Code CLI (assinatura) | 0 content_filter; ~50% dos lotes grandes travados (resolvido com chunks de 10 + retry) | não (suspeita: Read redimensiona) |

## 3. Custo por provedor (offline, exato — páginas COMPLETAS, teórico)

| provedor · página | tokens/página | caracteres/página | **caracteres/token** | status |
|---|---:|---:|---:|---|
| Anthropic padrão 1568×728 (todos os modelos) | 1460 | 28.080 | **19,2** | medido |
| Anthropic alta resolução 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× menos imagens) | cobrança medida; legibilidade pendente (H1) |
| GPT-5 (tile) faixa 768×2048 | 1190 | ~38.760 | **32,6** | docs auditados |
| GPT-5.4/5.5 (patch, original) até 1568×5984 | ~9.163 | ~233k | **25,4** | docs; legibilidade não testada |
| gpt-4o-mini | 48.169/faixa | — | **0,8 — NUNCA transformar em imagem** | docs (bug D2 corrigido) |
| Gemini tile 1533×1152 (unidade de crop nativa 768) | 1032 | 43.615 | **42,3 ← melhor documentado** | docs; legibilidade não testada |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (se legível)** | hipótese H6 |

## 4. Bugs encontrados e corrigidos (auditoria contra docs oficiais)

| id | bug | impacto | commit |
|---|---|---|---|
| D2 | gpt-4o-mini caía no tile padrão 85/170 (real: 2833/5667) | custo subestimado ~33× — **gate invertido** | e6bc75f |
| D1 | multiplicador de o4-mini 1.62 (real 1.72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) com cap 10000 (real 1536, sem original) | quebraria com páginas maiores | e6bc75f |
| D4 | gpt-5-codex-mini no regime de tile (real: patch 1536) | ≥+23% subestimado | e6bc75f |
| D5 | detail:'original' fixo para todo modelo (só existe em 5.4+) | fora do contrato | e6bc75f |
| #44 | stub de descrição injetado em ferramentas tipadas → 400 + fallback silencioso | economia zerada sem sinal | 0f66e32 |
| AA | atlas AA em produção contra o comentário "eval-only" | −17pp de leitura no Fable | 9a25585 |
| — | cols do slab 313 (1573px) → resample de 0,997× + coluna de patch extra | corrigido para 312 | baseline |

## 5. Hipóteses em aberto (quanto custa fechar cada uma)

| id | hipótese | evidência atual | teste decisivo | custo |
|---|---|---|---|---|
| H1 | A página 1928² lê ≥ padrão na API direta (WYSIWYG comprovado na cobrança) | cobrança 4764 sem resample; 1-bit já lê 67% mesmo degradado | A/B direto std vs. alta resolução (1-bit) | ~US$4 API |
| H2 | alta resolução + 1-bit na API direta ≈ 100% com 3,3× menos imagens | H1 + matriz 2×2 | mesmo que H1 | mesmo |
| H3 | o Read do CLI e o OpenRouter redimensionam imagens >1568/2000px | 5×8 morre e 10×16 sobrevive NA MESMA página | uma página 1928² com glifos 20×32 por transporte | ~US$0 (CLI) |
| H4 | Recusa depende do enquadramento (agente-lendo-um-arquivo ≈ 0% vs. API bruta ≈ 100%) | comparação de transporte acima | A/B de redação no caminho real do proxy | baixo |
| H5 | Tile do Gemini 1533×1152 legível em 5×8 (42 chars/tok) | nenhuma | density-frontier com GEMINI_API_KEY | ~grátis (tier gratuito) |
| H6 | media_resolution:low legível (116 chars/tok) | improvável (encoder de baixa resolução), mas ninguém mediu | 1 chamada | ~grátis |
| H7 | GPT: legibilidade da faixa + inflação de completion (risco PageWatch) | comunidade viu −40% no prompt mas +completion/2× latência | density-frontier com OPENAI_API_KEY | ~US$2-5 |
| H8 | Cirurgia de glifos (H~K, 0/8, 5/3…) converte abstenções em leituras | após 1-bit, TODOS os erros do Fable viraram abstenções | editar ~10 bitmaps + reexecutar a matriz | $0 (CLI) |
| H9 | Tema claro (preto sobre branco) > invertido | literatura (Glyph paper, Tesseract); nunca medido em um VLM comercial | flag de estilo + 2 braços | $0 (CLI) |
| H10 | Opus em 7×10 fica entre 0% (5×8) e 87% (10×16) → bom trade-off | curva upstream 35% em 7×10 (n=20) | 1 braço extra | $0 (CLI) |
| H11 | Retry-on-refusal no proxy recupera os ~50% dos lotes filtrados | recusa é estocástica por chamada | implementar + medir em produção | código |

## 6. Pendências operacionais

1. `gh auth login` → criar `diegosouzapw/omniglyph` privado + push (10 commits locais).
2. Créditos da Anthropic (H1/H2, o veredito de geometria) e do OpenRouter (esgotados).
3. **Rotacionar as chaves** da Anthropic e do OpenRouter expostas no chat.
4. Fila de código: #45 (schema-strip draft-07), retry-on-refusal (H11), cirurgia
   de glifos (H8), Fase 4 (TS nos scripts, GIFs, docs, dashboard v2), Fase 5
   (motor OmniRoute).

## ADENDO 2026-07-06 — A/B via API direta (165 chamadas): H1/H2 REFUTADAS

| config | exato | abst. | recusa | erros |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA e 1-bit) | 0/60 | 0 | **60/60 recusa** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 previstos) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 previstos) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VEREDITO: a página 1928² do tier de alta resolução é COBRADA WYSIWYG (4764
tok, sweep), mas o ENCODER não recebe a resolução completa — 1-2/30 leituras,
com erros de troca de glifo único (6→8, a→4), a assinatura de um resample
interno. **Cobrança ≠ entrada do encoder → armadilha: 3,3× o custo, pior
legibilidade.** APLICADO: pageGeometryForTier() revertido — ambos os tiers
renderizam 1568×728; a infra de tier foi mantida (a cobrança exata continua
válida e o retune futuro é 1 linha). H3 atualizado: o "resample de
transporte" era (também) o próprio encoder da API. Recusa em transcrição via
API bruta: 100% na página padrão (H4 reforçado — só o enquadramento de
agente escapa). Opus 10×16 confirmado em ambos os transportes (77-87%).

## ADENDO 2026-07-06 (2) — bateria GPT-5.5 via API direta: H7 fechado (FALHOU)

| braço | verbatim | gist | output/resposta |
|---|---:|---:|---:|
| faixa 768×2048 5×8 AA | 0/30 (18 abst, 5 filtrados, 7 erros) | 0/3 | 2.639 tok |
| faixa 5×8 1-bit | 0/30 (15 abst, 5 filtrados, 10 erros) | 1/3 | 2.383 tok |
| TEXTO (controle) | **30/30** | **3/3** | **62 tok** |

O GPT-5.5 não consegue ler glifos 5×8 (0/60; nem o gist sobrevive) e infla a
completion ~40× tentando decifrá-los (2,4-2,7 mil tokens de reasoning por
pergunta) — a economia do prompt é devorada pelo output. O controle de texto
perfeito prova que o corpus/perguntas são sãos. Confirma e quantifica o
opt-in do 5.5; o gpt-5.6 (padrão) permanece não testável (conta sem acesso).
Futuro (H12): o gate do GPT precisa modelar a inflação de output, não só os
tokens de prompt.

## ADENDO 2026-07-06 (3) — Gemini 2.5-flash (PARCIAL: quota do tier gratuito estourou no meio)

Das ~26 respostas de imagem que passaram antes de a quota morrer: **0
corretas, 1 abstenção, ~25 CONFABULAÇÕES** — e não são confusões de glifo:
são dígitos aleatórios (`indexLedgerInd → 0040375615`), ou seja, o encoder
não vê quase nada nas densidades testadas (tile nativo 42 chars/tok e MEDIUM
fixo) e o 2.5-flash INVENTA em vez de se abster (ignora a instrução
ILEGIVEL). Controle de texto: 3/3 nas que passaram. Sem inflação de output
(6-28 tok/resposta).

Sinal preliminar: H5/H6 pendem para NÃO no 2.5-flash, com um modo de falha
PIOR que o do GPT (confabulação silenciosa em vez de abstenção) — o Gemini
exigiria salvaguardas extras no proxy. Pendente para fechar: reexecutar com
quota paga ou em outro dia, e testar o gemini-2.5-pro (o flash é o leitor
mais fraco da família). A página de tile nativo ainda tem a melhor razão
DOCUMENTADA (42,3 caracteres/token); é a legibilidade que está em dúvida.

Nota de custo: páginas parciais (a última do corpus) são cobradas mal sob o
regime de tile (altura curta → unidade de crop pequena → mais tiles) —
adicionar padding na última página até 1152px de altura é uma otimização
obrigatória se o Gemini entrar.
