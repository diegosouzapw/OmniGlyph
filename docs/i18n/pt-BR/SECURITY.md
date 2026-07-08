# Política de Segurança

## Reportando vulnerabilidades

Abra um aviso de segurança privado no GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) ou
contate o mantenedor diretamente (diegosouza.pw@outlook.com). Não abra uma
issue pública para uma vulnerabilidade explorável.

## Modelo de ameaça (o que o OmniGlyph é)

O OmniGlyph é um **proxy local** entre seu cliente (por exemplo, Claude Code)
e as APIs de LLM. Por design, ele vê todo o conteúdo da sua sessão e suas
credenciais em trânsito. As decisões de segurança correspondentes:

- **Vincula-se ao loopback por padrão** (`127.0.0.1`): o dashboard não tem
  autenticação e serve contexto de sessão capturado (texto-fonte das
  imagens, telemetria). `HOST=0.0.0.0` é um opt-in explícito e expõe tudo
  isso para a rede — use apenas em uma rede confiável.
- **Credenciais**: o proxy encaminha os headers de autenticação do cliente
  para o upstream e não os persiste. Chaves fornecidas via env
  (`ANTHROPIC_API_KEY` etc.) permanecem em memória.
- **Telemetria local**: `~/.omniglyph/events.jsonl` guarda metadados por
  request (contagens de tokens, hashes de body) e, em erros 4xx, amostras de
  body comprimidas — trate o arquivo como sensível.
- **Conteúdo transformado em imagem é lossy**: valores byte-exatos (segredos,
  hashes) nunca devem depender de leituras de imagem; o pipeline os mantém
  como texto, mas a regra de ouro é: não coloque segredos no contexto do LLM.
- **Cadeia de suprimentos**: `pnpm-workspace.yaml` impõe um
  `minimumReleaseAge` de 3 dias para qualquer pacote novo; o core tem uma
  única dependência de runtime.

## Versões suportadas

Somente a linha de release mais recente (`main` / `v1.x` mais recente)
recebe correções.
