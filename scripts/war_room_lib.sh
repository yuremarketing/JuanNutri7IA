#!/bin/bash
# Biblioteca compartilhada dos watchers da Sala de Guerra.
#
# Fase 1 do debate de arquitetura (SALA_DE_GUERRA.md): troca a adivinhação
# por debounce de tempo ("3s sem o arquivo crescer" = mensagem terminou)
# por um sentinel determinístico no fim de cada turno. Quem escreve encerra
# a própria mensagem com WR_SENTINEL; quem escuta reage no instante em que
# ele aparece, sem esperar nem arriscar disparar no meio de uma escrita.
#
# Mantém o debounce antigo como rede de segurança: se alguém editar o
# arquivo sem o sentinel (edição manual, por exemplo), o watcher ainda
# reage depois de 3s de silêncio — igual ao comportamento anterior.

WR_FILE="${WR_FILE:-SALA_DE_GUERRA.md}"
WR_SENTINEL='<!--FIM_TURNO-->'

wr_sentinel_count() {
  # Match exato da linha inteira, não substring — senão qualquer menção ao
  # sentinel em prosa (tipo nas instruções do cabeçalho do arquivo) conta
  # como um turno encerrado. `grep -c` sem match ainda imprime "0" só que
  # com status de saída 1 — não usar `|| echo 0` aqui, senão duplica a
  # saída ("0\n0") e quebra a comparação aritmética no chamador.
  local n
  n=$(grep -c -x -F "$WR_SENTINEL" "$WR_FILE" 2>/dev/null)
  echo "${n:-0}"
}

# Remetente (linha de tag completa, ex: "**[Antigravity]:**") do último
# turno que terminou com sentinel.
wr_last_sender() {
  awk -v pat="$WR_SENTINEL" '
    /\*\*\[.*\]:\*\*/ { last_tag = $0 }
    $0 == pat { sender = last_tag }
    END { print sender }
  ' "$WR_FILE"
}

wr_last_tag_line() {
  grep -E '\*\*\[.*\]:\*\*' "$WR_FILE" | tail -n 1
}

# Bloqueia até detectar um turno novo e imprime no stdout a linha de tag
# de quem falou nesse turno. Cada chamada é independente (recalcula o
# estado a partir do arquivo), então é seguro chamar repetidamente num
# `while true; do SENDER=$(wr_wait_for_turn); ...; done` no script chamador.
wr_wait_for_turn() {
  local seen_count seen_size stable current_count current_size

  seen_count=$(wr_sentinel_count)
  seen_size=$(stat -c%s "$WR_FILE")
  stable=0

  while true; do
    sleep 1
    current_count=$(wr_sentinel_count)
    current_size=$(stat -c%s "$WR_FILE")

    if [ "$current_count" -gt "$seen_count" ]; then
      wr_last_sender
      return 0
    fi

    if [ "$current_size" == "$seen_size" ]; then
      stable=$((stable+1))
    else
      stable=0
      seen_size=$current_size
    fi

    if [ "$stable" -eq 3 ]; then
      wr_last_tag_line
      return 0
    fi
  done
}

# Devolve só as linhas novas do arquivo a partir do número de linha dado
# (exclusive). Usado pra não reprocessar o arquivo inteiro a cada turno
# headless (item 2 do debate: custo O(N) crescente por invocação).
wr_delta_since_line() {
  local since_line="$1"
  tail -n "+$((since_line + 1))" "$WR_FILE"
}

wr_total_lines() {
  wc -l < "$WR_FILE"
}
