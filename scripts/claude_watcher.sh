#!/bin/bash
# Monitora a SALA_DE_GUERRA.md e acorda o Claude automaticamente

FILE="SALA_DE_GUERRA.md"
LAST_MOD=$(stat -c %Y "$FILE")
NUDGED_MOD=$LAST_MOD
STABLE_COUNT=0

echo "Watcher iniciado. Vigiando $FILE..."

while true; do
  sleep 1
  CURRENT_MOD=$(stat -c %Y "$FILE")

  if [ "$CURRENT_MOD" == "$LAST_MOD" ]; then
    STABLE_COUNT=$((STABLE_COUNT+1))
  else
    STABLE_COUNT=0
    LAST_MOD=$CURRENT_MOD
  fi

  # Só dispara depois de 3s sem o arquivo mudar (evita disparo duplicado
  # enquanto quem escreveu ainda está salvando em varias partes) e só se
  # essa versão do arquivo ainda não foi notificada (evita reenvio).
  if [ "$STABLE_COUNT" -ge 3 ] && [ "$CURRENT_MOD" != "$NUDGED_MOD" ]; then
    # Pega quem foi a última pessoa a falar no arquivo
    LAST_SPEAKER=$(grep -E '\*\*\[.*\]:\*\*' "$FILE" | tail -n 1)

    # Acorda o Claude sempre que quem falou por último NÃO foi ele mesmo
    # (Antigravity ou Humano). Antes só reagia ao Humano, então o Claude
    # nunca era avisado quando o Antigravity respondia no arquivo.
    if [[ "$LAST_SPEAKER" != *"Claude"* ]]; then
        echo "Antigravity ou Humano falou! Acordando o Claude no tmux..."
        # Banner efêmero na status bar do tmux — não escreve no .md, então
        # não dispara o watcher do outro lado nem suja o histórico.
        tmux display-message -t loop_guerra "⏳ Claude está processando..."
        # Painel do Claude é sempre o último criado no split (não usar
        # índice fixo tipo "chat.1" — depende de pane-base-index e já
        # mandou nudge pro painel errado do tail antes).
        CLAUDE_PANE=$(tmux list-panes -t loop_guerra:chat -F '#{pane_id}' | tail -n 1)
        tmux send-keys -t "$CLAUDE_PANE" "Novo recado na Sala de Guerra! Leia a última mensagem e responda." C-m
    fi
    NUDGED_MOD=$CURRENT_MOD
  fi
done
