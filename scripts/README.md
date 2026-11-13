# Coordenação entre agentes — qual mecanismo usar

Este repositório tem **dois** mecanismos distintos para Claude e Gemini
trabalharem juntos. Eles não se comunicam entre si e servem a momentos
diferentes — leia esta página antes de ativar qualquer um dos dois.

## 1. `scripts/agent-loop/run.sh` — loop formal via Issue

Loop assíncrono e auditável: cada turno é registrado como comentário público
numa Issue do GitHub (`STATUS: CONTINUE`/`STATUS: DONE`), com o item movendo
automaticamente no Kanban. Os agentes editam e commitam de verdade neste
repo. Use para trabalho real de implementação que precisa ficar rastreável
no histórico do projeto. Detalhes completos em
[`scripts/agent-loop/README.md`](agent-loop/README.md).

## 2. `start_loop.sh` + tmux (`loop_guerra`) + `SALA_DE_GUERRA.md` — chat local

Chat síncrono em tempo real entre Claude e Antigravity (Gemini), pensado
para alinhamento rápido, debate de arquitetura e decisões que não precisam
(ainda) virar comentário de Issue. Roda numa sessão tmux (`start_loop.sh`)
com painéis de chat/monitor/watcher; o watcher (`claude_watcher.sh`) acorda
o Claude via `tmux send-keys` quando alguém escreve em `SALA_DE_GUERRA.md`.
Espera é "zero-token" — baseada em `mtime`/sentinel de fim de turno
(`scripts/war_room_lib.sh`), não em polling de prompt.

**`SALA_DE_GUERRA.md` nunca é commitado** (está no `.gitignore`). Já esteve
no git antes e cada commit disparava um deploy de produção inteiro no
Netlify à toa — foi removido do rastreio de propósito. Edite-o só por
Edit/Write direto em disco, nunca via `git add`/commit/push.

## O que NÃO existe neste repo: o plugin genérico `agloop`

O plugin global `agloop` (comandos `/agloop:vigia`, `/agloop:status`,
`/agloop:debate`) assume um **terceiro** mecanismo — `war_room.md` +
`scripts/vigia.py` + GitLock — que pertence ao projeto `AgLoop` em si
(`~/Dev/AgLoop`), não a este repositório. Rodar o comando sugerido pela
skill (`python3 scripts/vigia.py --agent ... --once`) aqui falha, porque
esses caminhos só existem no projeto AgLoop.

Isso já causou confusão na prática: ao tentar "ativar a vigília" nesta
sessão via `/agloop:vigia`, o comando sugerido apontava para
`scripts/vigia.py`/`war_room.md` inexistentes neste repo. O equivalente
funcional aqui é chamar `wr_wait_for_turn` de `scripts/war_room_lib.sh`
diretamente (como faz `claude_watcher.sh`), ou simplesmente rodar
`./scripts/start_loop.sh`.

> Se você é um agente novo lendo isto: **não** use `/agloop:vigia` neste
> repo. Use o mecanismo 2 acima (`SALA_DE_GUERRA.md`) para chat síncrono, ou
> o mecanismo 1 (`agent-loop/run.sh`) para trabalho assíncrono via Issue.

## Os dois ao mesmo tempo

`run.sh` e `start_loop.sh` não têm hoje nenhuma trava entre si — rodar os
dois ao mesmo tempo não é formalmente bloqueado. A decisão (Issue #17) foi
mantê-los deliberadamente isolados (acoplar um chat efêmero a um loop de
Issue assíncrono traria atrito sem ganho real), mas com um aviso mútuo não
bloqueante: `run.sh` passa a checar se existe uma sessão tmux `loop_guerra`
ativa, e `start_loop.sh` passa a checar um lockfile (`.agent-loop.lock`) do
outro loop — se achar, avisa no terminal, mas não impede a execução.
