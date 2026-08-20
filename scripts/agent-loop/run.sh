#!/usr/bin/env bash
#
# Loop de turnos entre Claude Code (claude) e Gemini CLI (gemini).
# Roda 100% local, na sua máquina — este terminal É a "sala de reunião"
# onde você acompanha a conversa dos dois agentes em tempo real, e (no modo
# interativo, padrão) também pode digitar algo entre um turno e outro.
#
# Cada agente trabalha isolado no seu próprio git worktree
# (.worktrees/gemini e .worktrees/claude), numa branch própria. Depois de
# cada turno, o commit do agente é mergeado (--no-ff) na branch de
# integração da tarefa. Isso evita que os dois mexam nos mesmos arquivos
# ao mesmo tempo e deixa um histórico claro de quem fez o quê em cada turno.
#
# Pré-requisitos (na máquina onde você roda este script, não no sandbox remoto):
#   - `claude` CLI instalado e autenticado (Claude Code)
#   - `gemini` CLI instalado e autenticado (Gemini CLI)
#   - `gh` CLI instalado e autenticado (`gh auth login`) com acesso ao repo
#   - `jq` instalado (para falar com a API de GitHub Projects)
#
# Uso básico:
#   TASK="Implementar tela de triagem por IA" ./scripts/agent-loop/run.sh
#
# Retomando um issue já criado:
#   ISSUE_NUMBER=42 ./scripts/agent-loop/run.sh
#
# Ver todas as variáveis de configuração na seção "Config" abaixo, ou
# leia scripts/agent-loop/README.md.

set -uo pipefail

# ---------- Config (sobrescreva via variáveis de ambiente) ----------
REPO="${REPO:-yuremarketing/JuanNutri7IA}"
OWNER="${REPO%%/*}"
TASK="${TASK:-}"
ISSUE_NUMBER="${ISSUE_NUMBER:-}"
MAX_TURNS="${MAX_TURNS:-20}"
FIRST_AGENT="${FIRST_AGENT:-gemini}"          # gemini | claude
PROJECT_NUMBER="${PROJECT_NUMBER:-}"           # número do GitHub Project (kanban); vazio = sem sync de kanban
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
GEMINI_BIN="${GEMINI_BIN:-gemini}"
CLAUDE_PERMISSION_MODE="${CLAUDE_PERMISSION_MODE:-acceptEdits}"
POST_TO_ISSUE="${POST_TO_ISSUE:-1}"            # 1 = comenta cada turno no issue
AUTO_PUSH="${AUTO_PUSH:-0}"                    # 1 = dá git push da branch de integração após cada merge
INTERACTIVE="${INTERACTIVE:-1}"                # 1 = pausa entre turnos pra você digitar algo pros agentes
LOG_DIR="${LOG_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)/logs/agent-loop}"
# ----------------------------------------------------------------------

[ -t 0 ] || INTERACTIVE=0   # sem terminal interativo (ex: CI), desliga automaticamente

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 1

command -v "$GEMINI_BIN" >/dev/null 2>&1 || { echo "Erro: '$GEMINI_BIN' não encontrado no PATH. Instale o Gemini CLI." >&2; exit 1; }
command -v "$CLAUDE_BIN" >/dev/null 2>&1 || { echo "Erro: '$CLAUDE_BIN' não encontrado no PATH. Instale o Claude Code CLI." >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "Erro: 'gh' (GitHub CLI) não encontrado no PATH." >&2; exit 1; }

if [ -n "$(git status --porcelain)" ]; then
  echo "Erro: há alterações não commitadas em $REPO_ROOT. Commit ou stash antes de rodar o loop." >&2
  exit 1
fi

mkdir -p "$LOG_DIR"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TRANSCRIPT="$LOG_DIR/loop-${TIMESTAMP}.md"

log() { printf '%s\n' "$*" | tee -a "$TRANSCRIPT"; }

# ---------- Garante que existe um Issue para trabalhar ----------
if [ -z "$ISSUE_NUMBER" ]; then
  if [ -z "$TASK" ]; then
    echo "Erro: defina TASK=\"descrição da tarefa\" (para criar um issue novo) ou ISSUE_NUMBER=<n> (para reusar um existente)." >&2
    exit 1
  fi
  echo "Criando issue no repo $REPO..."
  ISSUE_URL="$(gh issue create -R "$REPO" \
    --title "$TASK" \
    --body "Tarefa aberta automaticamente pelo agent-loop (Claude + Gemini) em ${TIMESTAMP}.

## Objetivo
$TASK

## Como este issue vai evoluir
Claude e Gemini vão trabalhar em turnos, alternando propostas e implementação,
e vão comentar aqui a cada turno até a tarefa ser concluída." 2>&1)" || { echo "Falha ao criar issue: $ISSUE_URL" >&2; exit 1; }
  ISSUE_NUMBER="$(basename "$ISSUE_URL")"
  echo "Issue criado: $ISSUE_URL (#$ISSUE_NUMBER)"
  gh issue edit "$ISSUE_NUMBER" -R "$REPO" --add-label "agent-loop" >/dev/null 2>&1 || true
else
  TASK="$(gh issue view "$ISSUE_NUMBER" -R "$REPO" --json title -q .title 2>/dev/null || echo "Issue #$ISSUE_NUMBER")"
fi

# ---------- Branch de integração da tarefa + worktree por agente ----------
INTEGRATION_BRANCH="${INTEGRATION_BRANCH:-agent-loop/issue-$ISSUE_NUMBER}"
WORKTREES_DIR="$REPO_ROOT/.worktrees"
GEMINI_DIR="$WORKTREES_DIR/gemini"
CLAUDE_DIR="$WORKTREES_DIR/claude"

if git show-ref --verify --quiet "refs/heads/$INTEGRATION_BRANCH"; then
  git checkout "$INTEGRATION_BRANCH" >/dev/null
else
  git checkout -b "$INTEGRATION_BRANCH" >/dev/null
fi

ensure_worktree() {
  local dir="$1" branch="$2"
  if git worktree list --porcelain | grep -qx "worktree $dir"; then
    git -C "$dir" reset --hard "$INTEGRATION_BRANCH" >/dev/null
  else
    rm -rf "$dir"
    git worktree add -B "$branch" "$dir" "$INTEGRATION_BRANCH" >/dev/null
  fi
}

mkdir -p "$WORKTREES_DIR"
ensure_worktree "$GEMINI_DIR" "agent/gemini"
ensure_worktree "$CLAUDE_DIR" "agent/claude"

agent_dir() { [ "$1" = "gemini" ] && echo "$GEMINI_DIR" || echo "$CLAUDE_DIR"; }
agent_branch() { [ "$1" = "gemini" ] && echo "agent/gemini" || echo "agent/claude"; }

sync_agent_to_integration() {
  local speaker="$1"
  git -C "$(agent_dir "$speaker")" reset --hard "$INTEGRATION_BRANCH" >/dev/null
}

merge_agent_into_integration() {
  local speaker="$1" turn="$2" branch dir ahead
  branch="$(agent_branch "$speaker")"
  dir="$(agent_dir "$speaker")"
  ahead="$(git rev-list --count "$INTEGRATION_BRANCH..$branch" 2>/dev/null || echo 0)"
  if [ "${ahead:-0}" -gt 0 ]; then
    git merge --no-ff "$branch" -m "Merge turno $turn ($speaker) em $INTEGRATION_BRANCH" >>"$TRANSCRIPT" 2>&1
    log "(${ahead} commit(s) de ${speaker} mergeado(s) em $INTEGRATION_BRANCH)"
  else
    log "(${speaker} não commitou neste turno — nada para mergear)"
  fi
}

# ---------- Kanban (GitHub Projects v2) ----------
PROJECT_ITEM_ID=""
STATUS_FIELD_ID=""
STATUS_OPT_TODO=""
STATUS_OPT_PROGRESS=""
STATUS_OPT_DONE=""

kanban_enabled() { [ -n "$PROJECT_NUMBER" ]; }

kanban_setup() {
  kanban_enabled || return 0
  local fields item_id
  fields="$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json 2>/dev/null)" || {
    echo "Aviso: não consegui ler os campos do Project #$PROJECT_NUMBER — kanban desativado nesta execução." >&2
    PROJECT_NUMBER=""
    return 0
  }
  STATUS_FIELD_ID="$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .id')"
  STATUS_OPT_TODO="$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name|test("Todo|To Do";"i")) | .id' | head -1)"
  STATUS_OPT_PROGRESS="$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name|test("In Progress";"i")) | .id' | head -1)"
  STATUS_OPT_DONE="$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name|test("Done";"i")) | .id' | head -1)"

  item_id="$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" \
    --url "https://github.com/$REPO/issues/$ISSUE_NUMBER" --format json 2>/dev/null | jq -r '.id')"
  PROJECT_ITEM_ID="$item_id"
}

kanban_set_status() {
  kanban_enabled || return 0
  local option_id="$1"
  [ -n "$PROJECT_ITEM_ID" ] && [ -n "$STATUS_FIELD_ID" ] && [ -n "$option_id" ] || return 0
  gh project item-edit --id "$PROJECT_ITEM_ID" --project-id "$PROJECT_NUMBER" \
    --field-id "$STATUS_FIELD_ID" --single-select-option-id "$option_id" >/dev/null 2>&1 || true
}

kanban_setup
kanban_set_status "$STATUS_OPT_PROGRESS"

# ---------- Monta o prompt de cada turno ----------
build_prompt() {
  local speaker="$1" other="$2" turn="$3"
  local tail
  tail="$(tail -c 12000 "$TRANSCRIPT" 2>/dev/null || true)"
  cat <<PROMPT
Você é ${speaker^^}, trabalhando em par com ${other^^} para resolver o issue
#${ISSUE_NUMBER} do repositório ${REPO}: "${TASK}".

Você está rodando no seu próprio workspace isolado (git worktree), na branch
$(agent_branch "$speaker"), criada a partir da branch de integração
${INTEGRATION_BRANCH}. Ela já contém tudo que foi mergeado dos turnos
anteriores — inclusive o que ${other^^} fez por último. Edite arquivos, rode
comandos e crie commits normalmente aqui; ao final do seu turno, o
orquestrador faz merge do seu commit na branch de integração antes do
próximo turno.

Trabalhem em turnos: leia o que ${other^^} disse/fez no turno anterior
(transcrição abaixo) e dê o próximo passo real — analise, implemente,
corrija, ou responda a uma pergunta que ${other^^} tenha feito. Não repita
o que já foi dito.

Regras:
- Se você alterar arquivos, rode \`git add\` e \`git commit -m "..."\` com uma
  mensagem clara antes de terminar sua resposta.
- Seja direto e objetivo — isto é um diálogo entre dois agentes, não um relatório.
- Quando achar que a tarefa do issue #${ISSUE_NUMBER} está completamente
  resolvida (código funcionando e commitado), termine sua resposta com a
  linha exata: STATUS: DONE
  Caso contrário, termine com: STATUS: CONTINUE

--- Transcrição até agora (turno ${turn}) ---
${tail:-"(este é o primeiro turno — não há histórico ainda)"}
--- Fim da transcrição ---
$(if [ -n "${HUMAN_NOTE:-}" ]; then printf '\n--- Observação do humano acompanhando esta conversa ---\n%s\n--- Fim da observação ---\n' "$HUMAN_NOTE"; fi)

Sua vez, ${speaker^^}:
PROMPT
}

run_agent() {
  local speaker="$1" prompt="$2" dir
  dir="$(agent_dir "$speaker")"
  case "$speaker" in
    gemini) (cd "$dir" && "$GEMINI_BIN" -y -p "$prompt") 2>&1 ;;
    claude) (cd "$dir" && "$CLAUDE_BIN" -p "$prompt" --permission-mode "$CLAUDE_PERMISSION_MODE") 2>&1 ;;
  esac
}

post_turn_to_issue() {
  local turn="$1" speaker="$2" body="$3"
  [ "$POST_TO_ISSUE" = "1" ] || return 0
  gh issue comment "$ISSUE_NUMBER" -R "$REPO" -b "**Turno ${turn} — ${speaker^}**

${body}" >/dev/null 2>&1 || true
}

# ---------- Loop principal ----------
log "# Agent Loop — Claude + Gemini"
log ""
log "Repo: $REPO · Issue: #$ISSUE_NUMBER · Branch de integração: $INTEGRATION_BRANCH"
log "Tarefa: $TASK"
log "Início: $(date -Iseconds)"
log ""

speaker="$FIRST_AGENT"
done_flag=0
turn=1
HUMAN_NOTE=""

if [ "$INTERACTIVE" = "1" ]; then
  log "(Modo interativo ligado: entre cada turno você pode digitar algo pros agentes, ou só apertar Enter pra deixar o loop seguir.)"
fi

while [ "$turn" -le "$MAX_TURNS" ]; do
  other="claude"; [ "$speaker" = "claude" ] && other="gemini"

  log "----------------------------------------------------------------"
  log "### Turno $turn — ${speaker^}"
  log "----------------------------------------------------------------"

  sync_agent_to_integration "$speaker"

  prompt="$(build_prompt "$speaker" "$other" "$turn")"
  output="$(run_agent "$speaker" "$prompt")"

  log "$output"
  log ""

  merge_agent_into_integration "$speaker" "$turn"

  post_turn_to_issue "$turn" "$speaker" "$output"

  if [ "$AUTO_PUSH" = "1" ]; then
    git push origin "$INTEGRATION_BRANCH" 2>&1 | tee -a "$TRANSCRIPT" >/dev/null || true
  fi

  if echo "$output" | grep -q "STATUS: DONE"; then
    done_flag=1
    break
  fi

  HUMAN_NOTE=""
  if [ "$INTERACTIVE" = "1" ]; then
    printf '\n💬 Sua vez — Enter pra deixar %s continuar, ou escreva algo pro próximo turno:\n> ' "${other^}"
    IFS= read -r HUMAN_NOTE || HUMAN_NOTE=""
    if [ -n "$HUMAN_NOTE" ]; then
      log "> 👤 Você: $HUMAN_NOTE"
    fi
  fi

  speaker="$other"
  turn=$((turn + 1))
done

log "----------------------------------------------------------------"
if [ "$done_flag" = "1" ]; then
  log "Loop concluído: ${speaker^} sinalizou STATUS: DONE no turno $turn."
  log "Resultado final está na branch $INTEGRATION_BRANCH."
  kanban_set_status "$STATUS_OPT_DONE"
  if [ "$POST_TO_ISSUE" = "1" ]; then
    gh issue close "$ISSUE_NUMBER" -R "$REPO" -c "Loop Claude + Gemini concluiu a tarefa na branch \`$INTEGRATION_BRANCH\` (ver transcrição completa em $TRANSCRIPT)." >/dev/null 2>&1 || true
  fi
else
  log "Loop encerrado sem STATUS: DONE após $MAX_TURNS turnos. Revise a transcrição e rode de novo com ISSUE_NUMBER=$ISSUE_NUMBER se precisar continuar."
fi
log ""
log "Transcrição completa salva em: $TRANSCRIPT"
