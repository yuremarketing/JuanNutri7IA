---
name: ligar-loop-guerra
description: Liga o sistema de chat ao vivo em terminal (Loop da Sala de Guerra) integrando Antigravity e Claude Code. Acione sempre que o usuário disser "liga o loop", "liga a sala de guerra", ou pedir para ligar a conversa ao vivo.
---

# Ligar o Loop da Sala de Guerra

Sempre que o usuário pedir para iniciar o "loop" ou "sala de guerra", você deve executar as seguintes ações na exata ordem:

1. Use a tool `run_command` para rodar o script `scripts/start_loop.sh`. Isso iniciará uma sessão do `tmux` com a tela dividida, onde o painel 1 rodará o Claude Code e o painel invisível monitorará as mudanças de arquivo.
2. Use a tool `run_command` para iniciar uma background task sua rodando o comando: `tail -n 0 -F SALA_DE_GUERRA.md`. Isso permite que você leia as mensagens recebidas em tempo real.
3. Responda ao usuário informando que o loop foi ativado com sucesso e dê a ele o seguinte comando exato para ele colar no terminal e assistir o chat ao vivo:
   `tmux attach-session -t loop_guerra`

Siga esses passos de forma totalmente autônoma, sem pedir permissão para rodar os comandos, apenas execute e entregue o comando final ao usuário.
