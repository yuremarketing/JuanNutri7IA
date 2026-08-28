#!/bin/bash
# Vigia a SALA_DE_GUERRA.md e chama o Antigravity (agy, headless) quando o
# Claude ou o Humano falam. Detecção de turno via sentinel
# (scripts/war_room_lib.sh) — ver comentário lá pra contexto da Fase 1 do
# debate de arquitetura.
#
# Também resolve o item 2 do debate: em vez de o `agy -p` reprocessar o
# arquivo inteiro a cada chamada (custo O(N) crescente conforme a Sala
# cresce), esse script manda só o delta de linhas novas desde a última
# resposta do Antigravity, guardado em WR_CURSOR_FILE (estado local,
# ignorado no git — não é histórico, é só um ponteiro de leitura).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/war_room_lib.sh"

WR_CURSOR_FILE="${WR_CURSOR_FILE:-.war_room_cursor_antigravity}"
WR_STATE_FILE="${WR_STATE_FILE:-.war_room_cursor_wait_antigravity_listener}"

# Trava de segurança absoluta: sem isso os dois agentes podem entrar num
# ping-pong infinito (e pago) se ficarem só concordando um com o outro.
# Zera sempre que o Humano fala; some depois de MAX_AUTO_TURNS respostas
# seguidas sem intervenção humana, PRODUTIVAS OU NÃO — é o teto de última
# instância, nunca deveria ser o que de fato pausa o loop no dia a dia.
MAX_AUTO_TURNS=${MAX_AUTO_TURNS:-8}
AUTO_TURNS=0

# Trava fina (Fase 2 do debate, item 3): pausa bem antes do teto absoluto
# se os turnos estiverem se repetindo sem nenhuma mutação real no repo
# (commit novo ou arquivo alterado) — o que aconteceu de fato no teste do
# poema e no de matemática, que não geraram diff nenhum. Contador vive no
# estado compartilhado (wr_record_turn), não aqui, porque os 3 watchers
# precisam enxergar o mesmo streak.
echo "Listener do Antigravity iniciado. Vigiando $WR_FILE..."

while true; do
  SENDER=$(wr_wait_for_turn)
  wr_record_turn "$SENDER"

  # Antigravity falando com ele mesmo não deve disparar nada.
  if [[ "$SENDER" == *"Antigravity"* ]]; then
    continue
  fi

  if [[ "$SENDER" != *"Claude"* ]]; then
    # Ninguém marcado como Claude/Antigravity == Humano falou.
    AUTO_TURNS=0
  fi

  if [ "$AUTO_TURNS" -ge "$MAX_AUTO_TURNS" ]; then
    echo "Limite de $MAX_AUTO_TURNS turnos automáticos atingido — esperando o Humano falar pra resetar."
    continue
  fi

  SOCIAL_STREAK=$(wr_social_streak)
  if [ "$SOCIAL_STREAK" -ge "$WR_SOCIAL_TURN_LIMIT" ]; then
    echo "Pausado: $SOCIAL_STREAK turnos sociais seguidos sem mutação no repo (limite $WR_SOCIAL_TURN_LIMIT) — esperando o Humano falar pra resetar."
    continue
  fi

  echo "Novo recado! Acordando o Antigravity (agy)..."
  tmux display-message -t loop_guerra "Antigravity esta processando..." 2>/dev/null

  LAST_CURSOR=$(cat "$WR_CURSOR_FILE" 2>/dev/null || echo 0)
  DELTA=$(wr_delta_since_line "$LAST_CURSOR")

  agy --dangerously-skip-permissions \
    -p "Nova mensagem na SALA_DE_GUERRA.md (raiz deste projeto). Segue o delta com as linhas novas desde sua ultima resposta (nao precisa reler o arquivo inteiro, so usar isso como contexto do turno atual; o arquivo completo continua sendo a fonte de verdade se precisar de historico antigo):

--- INICIO DELTA ---
$DELTA
--- FIM DELTA ---

Leia a ultima mensagem do delta acima e responda editando o arquivo SALA_DE_GUERRA.md: adicione sua fala abaixo da linha divisoria final, sob a tag **[Antigravity]:**, terminando com a linha $WR_SENTINEL sozinha numa linha pra sinalizar fim do turno (convencao nova da Fase 1 do debate de arquitetura, substitui a espera por tempo). Nao faca git add/commit/push desse arquivo (ele e ignorado de proposito)." \
    >> logs/antigravity_listener.log 2>&1

  wr_total_lines > "$WR_CURSOR_FILE"
  AUTO_TURNS=$((AUTO_TURNS+1))
done
