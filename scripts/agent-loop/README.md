# Agent Loop — Claude + Gemini

Faz o Claude Code (`claude`) e o Gemini CLI (`gemini`) trabalharem juntos, em
turnos, na sua máquina, com tudo impresso ao vivo no seu terminal e
sincronizado com um Issue + quadro Kanban (GitHub Projects) deste repositório.

Como funciona:

1. Você roda `run.sh` localmente, apontando para uma tarefa (texto livre) ou
   um issue já existente. Isso cria (ou reusa) uma branch de integração
   `agent-loop/issue-<n>` e dois **git worktrees isolados**, um para cada
   agente:

   ```
   repo/                          (checkout: agent-loop/issue-<n>)
   ├── .worktrees/
   │   ├── gemini/   → branch agent/gemini  (só o Gemini escreve aqui)
   │   └── claude/   → branch agent/claude  (só o Claude escreve aqui)
   ```

2. A cada turno: o worktree do agente da vez é sincronizado com a branch de
   integração (`git reset --hard`), ele roda **dentro do próprio worktree**
   com a transcrição da conversa até ali, edita arquivos e comita de
   verdade. No fim do turno, o orquestrador faz `git merge --no-ff` do
   commit dele para dentro da branch de integração — só então o próximo
   agente enxerga essa mudança.
3. Cada turno é impresso no seu terminal em tempo real e (opcionalmente)
   postado como comentário no Issue, para ficar registrado no GitHub.
4. O item do Issue se move automaticamente no Kanban: `Todo → In Progress`
   ao começar, `→ Done` quando um dos agentes sinalizar `STATUS: DONE`.
5. O loop para quando um agente sinaliza `STATUS: DONE` ou quando atinge
   `MAX_TURNS` (padrão 20). O resultado fica na branch de integração
   `agent-loop/issue-<n>`, pronta pra você revisar e abrir PR.

Por que worktrees separados em vez de um diretório só: cada agente edita
arquivos de forma isolada (sem risco de um pisar em cima do outro), e o
merge por turno deixa um histórico de git limpo mostrando exatamente o que
cada um contribuiu — em vez de um commit misturado dos dois.

## Pré-requisitos (na sua máquina, não no sandbox remoto)

- [`claude`](https://claude.com/claude-code) instalado e autenticado.
- [`gemini`](https://github.com/google-gemini/gemini-cli) instalado e autenticado.
- [`gh`](https://cli.github.com) instalado e autenticado (`gh auth login`),
  com escopo `project` se for usar o Kanban (`gh auth refresh -s project`).
- `jq` instalado.
- Este repositório clonado localmente (o loop edita e commita arquivos
  de verdade no diretório atual).

## Setup do Kanban (uma vez só)

```bash
export REPO=yuremarketing/JuanNutri7IA
./scripts/agent-loop/setup-project.sh
```

Isso cria um GitHub Project novo com as colunas padrão `Todo / In Progress /
Done` e imprime o `PROJECT_NUMBER` a exportar. Se você preferir usar um
Project já existente, pule este passo e apenas descubra o número dele em
`https://github.com/orgs/<owner>/projects` (ou `/users/<owner>/projects`).

## Rodando o loop

Criando uma tarefa nova (cria o Issue automaticamente):

```bash
export REPO=yuremarketing/JuanNutri7IA
export PROJECT_NUMBER=1        # opcional — omita para rodar sem kanban
TASK="Implementar a tela de Triagem por IA descrita no menu lateral" \
  ./scripts/agent-loop/run.sh
```

Retomando um Issue já existente:

```bash
export REPO=yuremarketing/JuanNutri7IA
export PROJECT_NUMBER=1
ISSUE_NUMBER=42 ./scripts/agent-loop/run.sh
```

Você verá, no próprio terminal, algo como:

```
### Turno 1 — Gemini
...(análise e/ou implementação do Gemini)...
STATUS: CONTINUE

### Turno 2 — Claude
...(resposta, revisão ou continuação da implementação)...
STATUS: CONTINUE
...
### Turno 7 — Gemini
...
STATUS: DONE
```

A transcrição completa também fica salva em
`logs/agent-loop/loop-<timestamp>.md` (pasta ignorada pelo git).

Ao final, revise o resultado e abra o PR você mesmo (ou peça pra um dos
agentes abrir no último turno):

```bash
git log --oneline agent-loop/issue-42
git diff main...agent-loop/issue-42
gh pr create -R yuremarketing/JuanNutri7IA --base main --head agent-loop/issue-42
```

## Variáveis de configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `REPO` | `yuremarketing/JuanNutri7IA` | Repositório `owner/name` |
| `TASK` | — | Descrição da tarefa (cria um Issue novo) |
| `ISSUE_NUMBER` | — | Reusa um Issue existente em vez de criar um |
| `INTEGRATION_BRANCH` | `agent-loop/issue-<n>` | Branch onde os turnos são mergeados |
| `FIRST_AGENT` | `gemini` | Quem começa: `gemini` ou `claude` |
| `MAX_TURNS` | `20` | Limite de turnos antes de parar |
| `PROJECT_NUMBER` | — | Número do GitHub Project (kanban); vazio desativa o sync |
| `POST_TO_ISSUE` | `1` | Comentar cada turno no Issue (`0` desativa) |
| `AUTO_PUSH` | `0` | `1` = dá `git push` depois de cada turno com commit |
| `CLAUDE_PERMISSION_MODE` | `acceptEdits` | Modo de permissão do `claude -p` (veja `claude --help`) |
| `CLAUDE_BIN` / `GEMINI_BIN` | `claude` / `gemini` | Caminho dos binários, se não estiverem no PATH padrão |

## Avisos

- `AUTO_PUSH=1` empurra a branch de integração para o remoto automaticamente
  após cada merge — só ative se você já confia no loop rodando sem revisão
  manual antes do push.
- `run.sh` roda os dois CLIs com permissão para editar arquivos e rodar
  comandos no seu ambiente local (via `-y` no Gemini e
  `--permission-mode acceptEdits` no Claude), mas cada um só dentro do
  próprio worktree (`.worktrees/gemini` ou `.worktrees/claude`) — nenhum
  dos dois toca no diretório principal do repo diretamente. Ainda assim,
  revise o `git diff` / `git log` da branch de integração antes de dar
  push manual pro `main`.
- O script exige que `$REPO_ROOT` esteja limpo (`git status` sem pendências)
  antes de começar, já que ele faz `git checkout` da branch de integração
  ali. Se você tiver trabalho em andamento, commit ou stash antes de rodar.
- Pra limpar os worktrees depois que a tarefa terminar:
  `git worktree remove .worktrees/gemini --force && git worktree remove .worktrees/claude --force`.
