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
# de quem falou nesse turno. Cada chamada roda em subshell (por causa do
# `$(...)` no chamador), então NENHUMA variável local sobrevive entre
# chamadas — por isso o "já notifiquei esse estado" precisa ficar num
# arquivo (WR_STATE_FILE), não numa variável. Sem isso, o fallback de
# debounce (arquivo parado por 3s) reagia de novo a cada nova iteração
# do `while true` do chamador, mesmo sem nada de novo ter acontecido —
# foi o que causou o spam de nudge duplicado ao reiniciar o loop.
#
# WR_STATE_FILE precisa ser único por script chamador (cada um tem seu
# próprio "já vi isso"); scripts diferentes NUNCA devem compartilhar o
# mesmo arquivo de estado, senão um consome a notificação do outro.
wr_wait_for_turn() {
  local state_file="${WR_STATE_FILE:?wr_wait_for_turn precisa de WR_STATE_FILE (arquivo de estado exclusivo do chamador)}"
  local last_acted_size seen_count seen_size stable current_count current_size

  last_acted_size=$(cat "$state_file" 2>/dev/null || echo -1)
  seen_count=$(wr_sentinel_count)
  seen_size=$(stat -c%s "$WR_FILE")
  stable=0

  while true; do
    sleep 1
    current_count=$(wr_sentinel_count)
    current_size=$(stat -c%s "$WR_FILE")

    if [ "$current_count" -gt "$seen_count" ] && [ "$current_size" != "$last_acted_size" ]; then
      echo "$current_size" > "$state_file"
      wr_last_sender
      return 0
    fi

    if [ "$current_size" == "$seen_size" ]; then
      stable=$((stable+1))
    else
      stable=0
      seen_size=$current_size
    fi

    if [ "$stable" -eq 3 ] && [ "$current_size" != "$last_acted_size" ]; then
      echo "$current_size" > "$state_file"
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

# Fase 2 do debate de arquitetura (item 3): distingue turno "produtivo"
# (resultou em commit novo ou mudança no working tree) de turno "social"
# (alinhamento, teste de canal, concordância mútua) — o teste de poema e o
# de matemática rodados na Sala não geraram nenhum diff, mas contavam igual
# a um turno de código de verdade no contador antigo (MAX_AUTO_TURNS).
WR_SHARED_STATE_FILE="${WR_SHARED_STATE_FILE:-.war_room_state.json}"
WR_SOCIAL_TURN_LIMIT="${WR_SOCIAL_TURN_LIMIT:-3}"

# Fingerprint barato do estado do repo: HEAD + quantidade de linhas de
# `git status --porcelain`. Muda quando alguém commita OU só edita/cria
# arquivo sem commitar ainda — não precisa ser exato, só precisa mudar
# quando "algo de real aconteceu" no repo.
wr_git_fingerprint() {
  local head dirty
  head=$(git rev-parse HEAD 2>/dev/null)
  dirty=$(git status --porcelain 2>/dev/null | wc -l)
  echo "${head}:${dirty}"
}

# Registra um turno no arquivo de estado compartilhado. Idempotente entre
# os 3 watchers: todos chamam wr_wait_for_turn pro MESMO evento (mesma
# linha de sentinel), então sem essa trava cada um contava o turno 3x. A
# trava é o número de sentinels já visto no arquivo — quem chegar primeiro
# registra, os outros dois viram no-op nesse turno.
wr_record_turn() {
  local sender="$1"
  [ -f "$WR_SHARED_STATE_FILE" ] || echo '{}' > "$WR_SHARED_STATE_FILE"

  local current_sentinel last_recorded
  current_sentinel=$(wr_sentinel_count)
  last_recorded=$(jq -r '.last_recorded_sentinel // -1' "$WR_SHARED_STATE_FILE" 2>/dev/null)
  if [ "$current_sentinel" -le "${last_recorded:--1}" ]; then
    return 0
  fi

  local fp last_fp social productive counter tmp
  fp=$(wr_git_fingerprint)
  last_fp=$(jq -r '.last_git_fingerprint // ""' "$WR_SHARED_STATE_FILE")
  social=$(jq -r '.social_streak // 0' "$WR_SHARED_STATE_FILE")
  productive=$(jq -r '.productive_turns // 0' "$WR_SHARED_STATE_FILE")
  counter=$(jq -r '.turn_counter // 0' "$WR_SHARED_STATE_FILE")
  counter=$((counter + 1))

  if [[ "$sender" != *"Claude"* ]] && [[ "$sender" != *"Antigravity"* ]]; then
    # Humano falando sempre reseta o streak social, igual ao AUTO_TURNS antigo.
    social=0
  elif [ "$fp" != "$last_fp" ]; then
    productive=$((productive + 1))
    social=0
  else
    social=$((social + 1))
  fi

  tmp="${WR_SHARED_STATE_FILE}.tmp.$$"
  jq -n \
    --arg owner "$sender" \
    --argjson counter "$counter" \
    --argjson productive "$productive" \
    --argjson social "$social" \
    --arg fp "$fp" \
    --argjson lastsentinel "$current_sentinel" \
    '{turn_owner:$owner, turn_counter:$counter, productive_turns:$productive, social_streak:$social, last_git_fingerprint:$fp, last_recorded_sentinel:$lastsentinel}' \
    > "$tmp" && mv "$tmp" "$WR_SHARED_STATE_FILE"

  if [ "$social" -ge "$WR_SOCIAL_TURN_LIMIT" ]; then
    echo "AVISO: $social turnos sociais seguidos sem mutação no repo (limite $WR_SOCIAL_TURN_LIMIT)." >&2
  fi
}

wr_social_streak() {
  jq -r '.social_streak // 0' "$WR_SHARED_STATE_FILE" 2>/dev/null || echo 0
}
