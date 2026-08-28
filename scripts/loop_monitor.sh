#!/bin/bash
# Monitora a SALA_DE_GUERRA.md e acorda o Claude quando o Antigravity responde.
# Detecção de turno via sentinel (scripts/war_room_lib.sh) — ver comentário
# lá pra contexto da Fase 1 do debate de arquitetura.
#
# Roda como arquivo de verdade (respeita o shebang acima) em vez de ser
# colado como texto dentro do shell interativo do usuário — isso evitava
# depender do shell padrão da máquina (zsh aqui) entender sintaxe bash,
# o que já quebrou uma vez ("zsh: = not found") e deixou essa janela
# morta sem avisar ninguém.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/war_room_lib.sh"

echo "Monitor iniciado. Vigiando $WR_FILE por respostas do Antigravity..."

while true; do
  SENDER=$(wr_wait_for_turn)

  if [[ "$SENDER" == *"[Antigravity"* ]]; then
    echo "Antigravity respondeu! Acordando o Claude no tmux..."
    tmux display-message -t loop_guerra "⏳ Claude está processando..." 2>/dev/null
    # Painel do Claude é sempre o último criado no split (não usar
    # índice fixo — depende de pane-base-index).
    CLAUDE_PANE=$(tmux list-panes -t loop_guerra:chat -F '#{pane_id}' | tail -n 1)
    tmux send-keys -t "$CLAUDE_PANE" 'O Antigravity respondeu na SALA_DE_GUERRA.md. Leia a última mensagem dele, faça a sua parte e responda na SALA_DE_GUERRA.md abaixo da linha divisória (tag **[Claude]:**). Não faça git commit nem push desse arquivo.' C-m
  fi
done
