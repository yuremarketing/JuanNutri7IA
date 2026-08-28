#!/bin/bash
# Colore o SALA_DE_GUERRA.md ao vivo no painel de leitura (tail -F).
#
# Roda como arquivo de verdade (respeita o shebang), em vez de ser colado
# como texto dentro do shell interativo do usuário — mesma razão do fix
# do loop_monitor.sh: colar comando com aspas/regex complexo depende do
# shell padrão da máquina entender a sintaxe (zsh já quebrou nisso antes).
#
# Não escreve nada de volta no arquivo — o .md em disco continua texto
# puro, a cor é só na saída do terminal. Estado (variável `c` do awk)
# persiste entre linhas pra colorir mensagens multi-linha inteiras, não
# só o cabeçalho.

FILE="SALA_DE_GUERRA.md"

tail -F "$FILE" | awk '
  /\*\*\[Antigravity/ { c = "\033[36m" }
  /\*\*\[Claude/       { c = "\033[35m" }
  /\*\*\[.*\]:\*\*/ && !/Antigravity/ && !/Claude/ { c = "\033[32m" }
  /<!--FIM_TURNO-->/ { print "\033[90m" $0 "\033[0m"; next }
  { print c $0 "\033[0m" }
'
