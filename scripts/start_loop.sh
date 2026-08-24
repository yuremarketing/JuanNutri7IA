#!/bin/bash
touch SALA_DE_GUERRA.md

# Tenta fechar a sessão se já existir
tmux kill-session -t loop_guerra 2>/dev/null

# Inicia nova sessão do tmux desanexada e renomeia a primeira janela.
# Captura o pane_id real (não o índice numérico) pra não depender de
# base-index/pane-base-index, que é o que quebrava antes.
TAIL_PANE=$(tmux new-session -d -s loop_guerra -n chat -P -F '#{pane_id}')

# Painel da Esquerda: Sala de Guerra (tail -F)
tmux send-keys -t "$TAIL_PANE" "clear; tail -F SALA_DE_GUERRA.md" C-m

# Divide a tela horizontalmente e captura o pane_id do painel novo
CLAUDE_PANE=$(tmux split-window -h -t loop_guerra:chat -P -F '#{pane_id}')

# Painel da Direita: Claude Code (binário direto, sem depender de npx/registry)
tmux send-keys -t "$CLAUDE_PANE" "claude --permission-mode acceptEdits" C-m

# Espera o Claude carregar
sleep 5

# Cria janela de monitoramento invisível
tmux new-window -d -n monitor -t loop_guerra
tmux send-keys -t loop_guerra:monitor "
LAST_SIZE=\$(stat -c%s SALA_DE_GUERRA.md)
while true; do
  CURRENT_SIZE=\$(stat -c%s SALA_DE_GUERRA.md)
  if [ \"\$CURRENT_SIZE\" != \"\$LAST_SIZE\" ]; then
    LAST_SIZE=\$CURRENT_SIZE
    sleep 2
    LAST_SENDER=\$(tail -n 10 SALA_DE_GUERRA.md | grep '\*\*' | tail -n 1)
    if [[ \"\$LAST_SENDER\" == *\"[Antigravity\"* ]]; then
      tmux send-keys -t $CLAUDE_PANE 'O Antigravity respondeu na SALA_DE_GUERRA.md. Leia a última mensagem dele, faça a sua parte e responda na SALA_DE_GUERRA.md abaixo da linha divisória (tag **[Claude]:**). Não faça git commit nem push desse arquivo.' C-m
    fi
  fi
  sleep 1
done
" C-m

# Painel Oculto: Monitor Automático (acorda o Claude quando o arquivo muda)
tmux new-window -t loop_guerra -d -n watcher "./scripts/claude_watcher.sh"

echo "Sistema Loop de Guerra iniciado com sucesso!"
echo "Painel do Claude Code: $CLAUDE_PANE (era o bug: antes ia pro painel do tail)"
echo "Para assistir ao vivo, rode: tmux attach-session -t loop_guerra"
echo "(Ctrl+B depois D pra sair sem matar a sessão)"
