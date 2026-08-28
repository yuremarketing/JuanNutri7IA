#!/bin/bash
# Monitora a SALA_DE_GUERRA.md e acorda o Claude quando o Humano fala.
# Detecção de turno via sentinel (scripts/war_room_lib.sh) — ver comentário
# lá pra contexto da Fase 1 do debate de arquitetura.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/war_room_lib.sh"

WR_STATE_FILE="${WR_STATE_FILE:-.war_room_cursor_wait_claude_watcher}"

echo "Watcher iniciado. Vigiando $WR_FILE..."

while true; do
  SENDER=$(wr_wait_for_turn)
  wr_record_turn "$SENDER"

  # Só reage a mensagem de Humano (nem Claude nem Antigravity). O caso
  # "Antigravity respondeu" já é tratado por scripts/loop_monitor.sh —
  # se este script também disparasse nesse caso, os dois mandavam
  # send-keys pro mesmo painel ao mesmo tempo e o texto ficava
  # acumulado sem enviar na caixa de input (foi o que travou o painel).
  if [[ "$SENDER" != *"Claude"* ]] && [[ "$SENDER" != *"Antigravity"* ]]; then
    echo "Humano falou! Acordando o Claude no tmux..."
    # Banner efêmero na status bar do tmux — não escreve no .md, então
    # não dispara o watcher do outro lado nem suja o histórico.
    tmux display-message -t loop_guerra "⏳ Claude está processando..." 2>/dev/null
    # Painel do Claude é sempre o último criado no split (não usar
    # índice fixo tipo "chat.1" — depende de pane-base-index e já
    # mandou nudge pro painel errado do tail antes).
    CLAUDE_PANE=$(tmux list-panes -t loop_guerra:chat -F '#{pane_id}' | tail -n 1)
    tmux send-keys -t "$CLAUDE_PANE" "Novo recado na Sala de Guerra! Leia a última mensagem e responda." C-m
  fi
done
