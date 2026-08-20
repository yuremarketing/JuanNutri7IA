---
name: gemini-loop
description: Inicia o loop de turnos entre Claude Code e o Gemini CLI trabalhando juntos num Issue do JuanNutri7IA, com transcrição ao vivo no terminal, kanban (GitHub Projects) e worktrees isolados por agente. Use quando o usuário pedir para "rodar o loop com o Gemini", "chamar o Gemini pra trabalhar junto", "colocar Claude e Gemini pra conversar", ou invocar "/gemini-loop".
---

# Gemini Loop — Claude e Gemini trabalhando em par

Este skill roda `scripts/agent-loop/run.sh`, que faz você (Claude, rodando
localmente na máquina do usuário) e o Gemini CLI conversarem em turnos,
alternando quem propõe e quem revisa, sobre um Issue real do GitHub deste
repositório. O terminal onde o script roda é a "sala" onde o usuário
acompanha a conversa dos dois em tempo real — e no modo interativo (padrão)
ele pode digitar algo entre um turno e outro, que entra direto no prompt do
próximo agente.

Cada agente trabalha isolado no próprio `git worktree`
(`.worktrees/gemini`, `.worktrees/claude`); o commit de cada turno é
mergeado numa branch de integração (`agent-loop/issue-<n>`) antes do
próximo turno começar. Detalhes completos em `scripts/agent-loop/README.md`
— leia esse arquivo se precisar entender a engenharia por trás disso.

## Antes de rodar

1. Confira os pré-requisitos (uma vez só por máquina):
   - `claude`, `gemini`, `gh`, `jq` instalados e autenticados
   - `gh auth status` deve ter escopo `project` se o usuário quiser Kanban
2. Pergunte ao usuário (não assuma):
   - Qual é a tarefa? (`TASK="..."`) — ou ele já tem um Issue existente
     (`ISSUE_NUMBER=n`) que quer retomar?
   - Ele já tem um `PROJECT_NUMBER` do Kanban criado? Se não e ele quiser
     Kanban, ofereça rodar `scripts/agent-loop/setup-project.sh` primeiro
     (é um passo único, não precisa repetir a cada tarefa).
   - Quer manter `INTERACTIVE=1` (padrão — pausa entre turnos pra ele
     digitar algo) ou prefere deixar rodar sem interrupção
     (`INTERACTIVE=0`)?

## Como rodar

Execute o script em **primeiro plano**, nunca em background e nunca
capturando a saída silenciosamente — o valor deste skill é o usuário ver,
ao vivo, você e o Gemini conversando, revisando e implementando juntos:

```bash
TASK="<descrição da tarefa>" ./scripts/agent-loop/run.sh
# ou, retomando uma tarefa já em andamento:
ISSUE_NUMBER=<n> ./scripts/agent-loop/run.sh
```

Se o repositório tiver alterações não commitadas, o script recusa rodar —
avise o usuário e ajude a commitar/stashar antes.

## Depois que o loop terminar

1. Resuma o que foi feito, citando a branch de integração
   (`agent-loop/issue-<n>`).
2. Mostre `git log --oneline` e `git diff main...agent-loop/issue-<n>`
   pro usuário revisar antes de qualquer coisa ir pro `main`.
3. Pergunte se ele quer abrir um PR (`gh pr create --base main --head
   agent-loop/issue-<n>`) — não abra sozinho sem ele pedir.
