# Agent Loop — Claude + Gemini

Faz o Claude Code (`claude`) e o Gemini CLI (`gemini`) trabalharem juntos, em
turnos, na sua máquina, com tudo impresso ao vivo no seu terminal e
sincronizado com um Issue + quadro Kanban (GitHub Projects) deste repositório.

Como funciona:

1. Você roda `run.sh` localmente, apontando para uma tarefa (texto livre) ou
   um issue já existente.
2. A cada turno, um dos dois agentes recebe a transcrição da conversa até
   ali e o próximo passo: analisar, implementar, corrigir, responder ao
   outro. Ele pode editar arquivos e commitar de verdade neste repo.
3. Cada turno é impresso no seu terminal em tempo real e (opcionalmente)
   postado como comentário no Issue, para ficar registrado no GitHub.
4. O item do Issue se move automaticamente no Kanban: `Todo → In Progress`
   ao começar, `→ Done` quando um dos agentes sinalizar `STATUS: DONE`.
5. O loop para quando um agente sinaliza `STATUS: DONE` ou quando atinge
   `MAX_TURNS` (padrão 20).

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

## Variáveis de configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `REPO` | `yuremarketing/JuanNutri7IA` | Repositório `owner/name` |
| `TASK` | — | Descrição da tarefa (cria um Issue novo) |
| `ISSUE_NUMBER` | — | Reusa um Issue existente em vez de criar um |
| `FIRST_AGENT` | `gemini` | Quem começa: `gemini` ou `claude` |
| `MAX_TURNS` | `20` | Limite de turnos antes de parar |
| `PROJECT_NUMBER` | — | Número do GitHub Project (kanban); vazio desativa o sync |
| `POST_TO_ISSUE` | `1` | Comentar cada turno no Issue (`0` desativa) |
| `AUTO_PUSH` | `0` | `1` = dá `git push` depois de cada turno com commit |
| `CLAUDE_PERMISSION_MODE` | `acceptEdits` | Modo de permissão do `claude -p` (veja `claude --help`) |
| `CLAUDE_BIN` / `GEMINI_BIN` | `claude` / `gemini` | Caminho dos binários, se não estiverem no PATH padrão |

## Avisos

- `AUTO_PUSH=1` empurra commits para o remoto automaticamente a cada turno
  — só ative se você já confia no loop rodando sem revisão manual antes do push.
- `run.sh` roda os dois CLIs com permissão para editar arquivos e rodar
  comandos no seu ambiente local (via `-y` no Gemini e
  `--permission-mode acceptEdits` no Claude). Rode em um diretório/branch
  que você não se importa de ver alterado, e revise o `git diff` /
  `git log` sempre que quiser antes de dar push manual.
