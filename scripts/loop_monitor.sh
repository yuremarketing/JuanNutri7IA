#!/bin/bash
# Monitora a SALA_DE_GUERRA.md e acorda o Claude quando o Antigravity responde.
#
# Roda como arquivo de verdade (respeita o shebang acima) em vez de ser
# colado como texto dentro do shell interativo do usuário — isso evitava
# depender do shell padrão da máquina (zsh aqui) entender sintaxe bash,
# o que já quebrou uma vez ("zsh: = not found") e deixou essa janela
# morta sem avisar ninguém.

FILE="SALA_DE_GUERRA.md"
LAST_SIZE=$(stat -c%s "$FILE")
NUDGED_SIZE=$LAST_SIZE
STABLE_COUNT=0

echo "Monitor iniciado. Vigiando $FILE por respostas do Antigravity..."

while true; do
  sleep 1
  CURRENT_SIZE=$(stat -c%s "$FILE")

  if [ "$CURRENT_SIZE" == "$LAST_SIZE" ]; then
    STABLE_COUNT=$((STABLE_COUNT+1))
  else
    STABLE_COUNT=0
    LAST_SIZE=$CURRENT_SIZE
  fi

  # Só dispara depois de 3s sem o arquivo crescer (evita disparo duplicado
  # enquanto o Antigravity ainda está salvando a mensagem em varias partes)
  # e só se esse tamanho ainda não foi notificado (evita reenvio no mesmo
  # conteudo).
  if [ "$STABLE_COUNT" -ge 3 ] && [ "$CURRENT_SIZE" != "$NUDGED_SIZE" ]; then
    # Precisa casar só a linha de marcador de remetente ("**[Nome]:**"),
    # não qualquer linha com **negrito** dentro do corpo da mensagem —
    # isso já causou falso-negativo quando a última linha em negrito era
    # texto normal da mensagem, não a tag do remetente.
    LAST_SENDER=$(grep -E '\*\*\[.*\]:\*\*' "$FILE" | tail -n 1)
    if [[ "$LAST_SENDER" == *"[Antigravity"* ]]; then
      echo "Antigravity respondeu! Acordando o Claude no tmux..."
      # Banner efêmero na status bar do tmux — não escreve no .md, então
      # não dispara o watcher do outro lado nem suja o histórico.
      tmux display-message -t loop_guerra "⏳ Claude está processando..."
      # Painel do Claude é sempre o último criado no split (não usar
      # índice fixo — depende de pane-base-index).
      CLAUDE_PANE=$(tmux list-panes -t loop_guerra:chat -F '#{pane_id}' | tail -n 1)
      tmux send-keys -t "$CLAUDE_PANE" 'O Antigravity respondeu na SALA_DE_GUERRA.md. Leia a última mensagem dele, faça a sua parte e responda na SALA_DE_GUERRA.md abaixo da linha divisória (tag **[Claude]:**). Não faça git commit nem push desse arquivo.' C-m
    fi
    NUDGED_SIZE=$CURRENT_SIZE
  fi
done
