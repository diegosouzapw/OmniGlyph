# OmniGlyph — Medições consolidadas (2026-07-05)

🌐 Traduzido: [todos os idiomas](../../../README.md)

Tudo o que foi MEDIDO nesta sessão, com fonte e n; hipóteses claramente
separadas no final. Recibos: `benchmarks/billing-sweep/results/` e
`benchmarks/density-frontier/results/` (JSONL por resposta).

## TL;DR — o resultado inteiro em duas barras

**Custo** — uma página standard 1568×728 transporta 28.080 caracteres por um
custo fixo de 1.460 tokens; o mesmo texto enviado em bruto custa ~10× mais:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Precisão** — mas só onde o modelo realmente lê a página. O gate é
fail-closed; só a linha ✅ segue para produção:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

O resto deste documento são os recibos por trás dessas duas barras.

## 1. Faturação da Anthropic (count_tokens direto, $0, 11 geometrias × 2 modelos)

Fórmula confirmada: `tokens = ceil(w/28) × ceil(h/28)` após redimensionamento
por nível, **+3/bloco (Fable 5) / +4/bloco (Sonnet 4.5)** — resíduo ZERO em
todas as linhas.

| sonda | dimensões | Fable 5 (alta resolução) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| âncora doc | 1092×1092 | 1524 | 1525 |
| âncora doc | 1000×1000 | 1299 | 1300 |
| página standard | 1568×728 | 1459 | 1460 |
| **página grande** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| teto alta res | 1960×1960 | 4764 (clamp) | 1525 |
| aresta longa alta res | 2576×1204 | 3959 | 1516 |
| faixa estreita | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imagens) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NÃO rejeitado em count_tokens) | 3585 |

Decisões derivadas (implementadas): gate exato por patch; nível por modelo
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = alta resolução); `cols` 313→312.

## 2. Precisão de leitura (density-frontier, agulhas hex/camelCase/dígito + distratores)

### Matriz 2×2 da Fable 5 — via CLI/subscrição, n=30/braço, mesmo corpus (~16,6k caracteres)

| página × atlas | exato | abstenções (ILEGIVEL) | erros silenciosos |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| alta resolução 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| alta resolução 1928×1928 · AA | 0/30 | 29 | 1 (previsto pela matriz) |

→ **1-bit > AA em ambas as páginas; zero confabulação em 120 perguntas.**
APLICADO: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ a página de alta resolução chega degradada pelo resample de transporte
(ver H1/H3) — os 67% são um piso, não um teto.

### Opus 4.8 — via CLI/subscrição, n=30/braço

| configuração | exato | abstenções | erros |
|---|---:|---:|---:|
| alta resolução · célula 10×16 | **26/30 (87%)** | 0 | 4 (dígitos) |
| standard · célula 5×8 | 0/30 | 30 | 0 |

→ Joelho da curva do Opus confirmado com o nosso próprio n (o upstream mediu
95% a 10×16 com n=20). O "modo seguro do Opus" é viável: 10×16 na página
grande ≈ 1,7 caracteres por token de imagem no corpus do conjunto de testes.

### Via OpenRouter (mesmo corpus/perguntas) — inconclusivo para legibilidade

| facto medido | número |
|---|---|
| content_filter em perguntas de transcrição (páginas standard) | 60/60 (100%) |
| content_filter em páginas de alta resolução | 5-6/30 (~20%) |
| Fable alta resolução: abstenções + erros | 20 ILEGIVEL + 5 erros (2 previstos) |
| Opus 10×16 (antes de os créditos acabarem) | 7/9 exato (78%) |
| erros de leitura previstos pela matriz de confundibilidade | 4→a, 0→8, S/s maiúscula |

### Comparação de transporte (mesma pergunta, mesmo conteúdo)

| transporte | filtro/recusa | página grande legível? |
|---|---|---|
| API direta (n=9, antes de os créditos acabarem) | 0 | não testado |
| OpenRouter | ~100% std / ~20% alta res | não (suspeita: resample) |
| Claude Code CLI (subscrição) | 0 content_filter; ~50% dos lotes grandes bloqueados (resolvido com lotes de 10 + repetição) | não (suspeita: o Read redimensiona) |

## 3. Custo por fornecedor (offline, exato — páginas COMPLETAS, teórico)

| fornecedor · página | tokens/página | caracteres/página | **caracteres/token** | estado |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (todos os modelos) | 1460 | 28.080 | **19,2** | medido |
| Anthropic alta res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× menos imagens) | faturação medida; legibilidade pendente (H1) |
| GPT-5 (tile) faixa 768×2048 | 1190 | ~38.760 | **32,6** | documentação auditada |
| GPT-5.4/5.5 (patch, original) até 1568×5984 | ~9.163 | ~233k | **25,4** | documentação; legibilidade não testada |
| gpt-4o-mini | 48.169/faixa | — | **0,8 — NUNCA imageificar** | documentação (bug D2 corrigido) |
| Gemini tile 1533×1152 (unidade de corte nativa 768) | 1032 | 43.615 | **42,3 ← melhor documentado** | documentação; legibilidade não testada |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (se legível)** | hipótese H6 |

## 4. Bugs encontrados e corrigidos (auditoria face à documentação oficial)

| id | bug | impacto | commit |
|---|---|---|---|
| D2 | gpt-4o-mini caía no tile por omissão 85/170 (real: 2833/5667) | custo subestimado ~33× — **gate invertido** | e6bc75f |
| D1 | multiplicador o4-mini 1,62 (real 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) com cap 10000 (real 1536, sem original) | quebraria com páginas maiores | e6bc75f |
| D4 | gpt-5-codex-mini no regime tile (real: patch 1536) | ≥+23% subestimado | e6bc75f |
| D5 | detail:'original' fixo para todos os modelos (só existe a partir do 5.4+) | fora do contrato | e6bc75f |
| #44 | stub de descrição injetado em ferramentas tipadas → 400 + fallback silencioso | poupança zerada sem sinal | 0f66e32 |
| AA | atlas AA em produção contra o comentário "apenas para avaliação" | −17pp de leitura na Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0,997× e coluna de patch extra | corrigido para 312 | base |

## 5. Hipóteses em aberto (o que custa fechar cada uma)

| id | hipótese | evidência atual | teste decisivo | custo |
|---|---|---|---|---|
| H1 | A página 1928² lê ≥ standard na API direta (WYSIWYG comprovado em faturação) | faturação 4764 sem resample; o 1-bit já lê 67% mesmo degradado | A/B direto std vs alta res (1-bit) | ~US$4 API |
| H2 | alta res + 1-bit na API direta ≈ 100% com 3,3× menos imagens | H1 + matriz 2×2 | igual a H1 | igual |
| H3 | O Read da CLI e o OpenRouter redimensionam imagens >1568/2000px | 5×8 falha e 10×16 sobrevive NA MESMA página | uma página 1928² com glifos 20×32 por transporte | ~US$0 (CLI) |
| H4 | A recusa depende da redação (agente-a-ler-um-ficheiro ≈ 0% vs API bruta ≈ 100%) | comparação de transporte acima | A/B de redação no caminho real do proxy | baixo |
| H5 | Tile Gemini 1533×1152 legível a 5×8 (42 caracteres/tok) | nenhuma | density-frontier com GEMINI_API_KEY | ~grátis (camada gratuita) |
| H6 | media_resolution:low legível (116 caracteres/tok) | improvável (codificador de baixa resolução), mas ninguém o mediu | 1 chamada | ~grátis |
| H7 | GPT: legibilidade da faixa + inflação de tokens de conclusão (risco PageWatch) | comunidade viu −40% de prompt mas +conclusão/2× latência | density-frontier com OPENAI_API_KEY | ~US$2-5 |
| H8 | A cirurgia de glifos (H~K, 0/8, 5/3…) converte abstenções em leituras | após o 1-bit, TODAS as falhas da Fable tornaram-se abstenções | editar ~10 bitmaps + repetir a matriz | $0 (CLI) |
| H9 | Tema claro (preto sobre branco) > invertido | literatura (paper Glyph, Tesseract); nunca medido num VLM comercial | flag de estilo + 2 braços | $0 (CLI) |
| H10 | Opus a 7×10 fica entre 0% (5×8) e 87% (10×16) → bom compromisso | curva do upstream 35% a 7×10 (n=20) | 1 braço extra | $0 (CLI) |
| H11 | A repetição em caso de recusa no proxy recupera ~50% dos lotes filtrados | a recusa é estocástica por chamada | implementar + medir em produção | código |

## 6. Pendências operacionais

1. `gh auth login` → criar `diegosouzapw/omniglyph` privado + push (10 commits locais).
2. Créditos Anthropic (H1/H2, o veredito de geometria) e OpenRouter (esgotados).
3. **Rodar as** chaves Anthropic e OpenRouter **expostas** no chat.
4. Fila de código: #45 (remoção de esquema draft-07), repetição em caso de
   recusa (H11), cirurgia de glifos (H8), Fase 4 (TS nos scripts, GIFs,
   documentação, dashboard v2), Fase 5 (motor OmniRoute).

## ADENDA 2026-07-06 — A/B via API direta (165 chamadas): H1/H2 REFUTADAS

| configuração | exato | abst. | recusa | erros |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA e 1-bit) | 0/60 | 0 | **60/60 recusa** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 previstos) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 previstos) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VEREDITO: o nível de alta resolução da página 1928² é COBRADO WYSIWYG
(4764 tok, sweep), mas o CODIFICADOR não recebe a resolução completa —
1-2/30 lidos, com erros de troca de glifo único (6→8, a→4), a assinatura de
um resample interno. **Faturação ≠ entrada do codificador → armadilha: 3,3×
o custo, legibilidade pior.** APLICADO: pageGeometryForTier() revertido —
ambos os níveis renderizam 1568×728; a infraestrutura de nível é mantida (a
faturação exata permanece válida e o reajuste futuro é 1 linha). H3
atualizada: o "resample de transporte" era (também) o próprio codificador
da API. Recusa em transcrição via API bruta: 100% na página standard (H4
reforçada — só a redação de agente escapa). Opus 10×16 confirmado em ambos
os transportes (77-87%).

## ADENDA 2026-07-06 (2) — bateria GPT-5.5 via API direta: H7 fechada (FALHOU)

| braço | verbatim | gist | saída/resposta |
|---|---:|---:|---:|
| faixa 768×2048 5×8 AA | 0/30 (18 abst, 5 filtrados, 7 erros) | 0/3 | 2.639 tok |
| faixa 5×8 1-bit | 0/30 (15 abst, 5 filtrados, 10 erros) | 1/3 | 2.383 tok |
| TEXTO (controlo) | **30/30** | **3/3** | **62 tok** |

O GPT-5.5 não consegue ler glifos 5×8 (0/60; nem sequer o gist sobrevive) e
infla a conclusão ~40× a tentar decifrá-los (2,4-2,7k tokens de raciocínio
por pergunta) — a poupança do prompt é devorada pela saída. O controlo de
texto perfeito prova que o corpus/perguntas são sãos. Confirma e quantifica
o caráter opcional do 5.5; o gpt-5.6 (por omissão) permanece não testado
(a conta não tem acesso). Futuro (H12): o gate do GPT deve modelar a
inflação de saída, não apenas os tokens do prompt.

## ADENDA 2026-07-06 (3) — Gemini 2.5-flash (PARCIAL: quota da camada gratuita esgotou-se a meio)

Das ~26 respostas de imagem que passaram antes de a quota morrer: **0
corretas, 1 abstenção, ~25 CONFABULAÇÕES** — e não são confusões de glifo:
são dígitos aleatórios (`indexLedgerInd → 0040375615`), ou seja, o
codificador não vê quase nada nas densidades testadas (tile nativo 42
caracteres/tok e MEDIUM fixo) e o 2.5-flash INVENTA em vez de se abster
(ignora a instrução ILEGIVEL). Controlo de texto: 3/3 nas que passaram. Sem
inflação de saída (6-28 tok/resposta).

Sinal preliminar: H5/H6 pendem para NÃO no 2.5-flash, com um modo de falha
PIOR do que o do GPT (confabulação silenciosa em vez de abstenção) — o
Gemini exigiria salvaguardas extra no proxy. Pendente para fechar:
repetir com quota paga ou noutro dia, e testar o gemini-2.5-pro (o flash é
o leitor mais fraco da família). A página de tile nativo continua a ter o
melhor rácio DOCUMENTADO (42,3 caracteres/token); é a legibilidade que está
em dúvida.

Nota de custo: páginas parciais (a última do corpus) são faturadas mal no
regime de tile (altura curta → unidade de corte pequena → mais tiles) —
preencher a última página até 1152px de altura é uma otimização obrigatória
caso o Gemini entre.
