#!/bin/bash
touch SALA_DE_GUERRA.md

# Tenta fechar a sessão se já existir
tmux kill-session -t loop_guerra 2>/dev/null

# Inicia nova sessão do tmux desanexada e renomeia a primeira janela.
# Captura o pane_id real (não o índice numérico) pra não depender de
# base-index/pane-base-index, que é o que quebrava antes.
TAIL_PANE=$(tmux new-session -d -s loop_guerra -n chat -P -F '#{pane_id}')

# Painel da Esquerda: Sala de Guerra (tail -F colorido — cyan Antigravity,
# roxo Claude, verde Humano; script real em scripts/colorize_chat.sh pra
# não depender do shell interativo entender o awk colado)
tmux send-keys -t "$TAIL_PANE" "clear; ./scripts/colorize_chat.sh" C-m

# Divide a tela horizontalmente e captura o pane_id do painel novo
CLAUDE_PANE=$(tmux split-window -h -t loop_guerra:chat -P -F '#{pane_id}')

# Painel da Direita: Claude Code (binário direto, sem depender de npx/registry)
tmux send-keys -t "$CLAUDE_PANE" "claude --permission-mode acceptEdits" C-m

# Espera o Claude carregar
sleep 5

# Janela de monitoramento: roda como ARQUIVO de verdade (respeita o
# shebang #!/bin/bash), em vez de colar o script como texto dentro do
# shell interativo do usuário. Colar texto multi-linha num shell
# interativo depende do shell padrão da máquina entender a sintaxe —
# em zsh isso já quebrou silenciosamente ("zsh: = not found") e deixou
# essa janela morta sem avisar ninguém.
tmux new-window -d -n monitor -t loop_guerra "./scripts/loop_monitor.sh"

# Painel Oculto: Monitor Automático (acorda o Claude quando o arquivo muda)
tmux new-window -t loop_guerra -d -n watcher "./scripts/claude_watcher.sh"

echo "Sistema Loop de Guerra iniciado com sucesso!"
echo "Painel do Claude Code: $CLAUDE_PANE (era o bug: antes ia pro painel do tail)"
echo "Para assistir ao vivo, rode: tmux attach-session -t loop_guerra"
echo "(Ctrl+B depois D pra sair sem matar a sessão)"
