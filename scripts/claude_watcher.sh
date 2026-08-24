#!/bin/bash
# Monitora a SALA_DE_GUERRA.md e acorda o Claude automaticamente

FILE="SALA_DE_GUERRA.md"
LAST_MOD=$(stat -c %Y "$FILE")

echo "Watcher iniciado. Vigiando $FILE..."

while true; do
  sleep 2
  CURRENT_MOD=$(stat -c %Y "$FILE")
  
  if [ "$CURRENT_MOD" != "$LAST_MOD" ]; then
    LAST_MOD=$CURRENT_MOD
    
    # Pega quem foi a última pessoa a falar no arquivo
    LAST_SPEAKER=$(grep -E '\*\*\[.*\]:\*\*' "$FILE" | tail -n 1)
    
    # Se não foi o Claude e não foi o Antigravity, significa que foi o Humano!
    if [[ "$LAST_SPEAKER" != *"Claude"* ]] && [[ "$LAST_SPEAKER" != *"Antigravity"* ]]; then
        echo "Humano falou! Acordando o Claude no tmux..."
        # Painel do Claude é sempre o último criado no split (não usar
        # índice fixo tipo "chat.1" — depende de pane-base-index e já
        # mandou nudge pro painel errado do tail antes).
        CLAUDE_PANE=$(tmux list-panes -t loop_guerra:chat -F '#{pane_id}' | tail -n 1)
        tmux send-keys -t "$CLAUDE_PANE" "Novo recado na Sala de Guerra! Leia a última mensagem e responda." C-m
    fi
  fi
done
