#!/bin/bash
# Vigia a SALA_DE_GUERRA.md e chama o Antigravity (agy, headless) quando o
# Claude ou o Humano falam. Mesma mecânica de debounce do claude_watcher.sh.

FILE="SALA_DE_GUERRA.md"
LAST_MOD=$(stat -c %Y "$FILE")
NUDGED_MOD=$LAST_MOD
STABLE_COUNT=0

# Trava de segurança: sem isso os dois agentes podem entrar num ping-pong
# infinito (e pago) se ficarem só concordando um com o outro. Zera sempre
# que o Humano fala; some depois de MAX_AUTO_TURNS respostas seguidas sem
# intervenção humana.
MAX_AUTO_TURNS=${MAX_AUTO_TURNS:-8}
AUTO_TURNS=0

echo "Listener do Antigravity iniciado. Vigiando $FILE..."

while true; do
  sleep 1
  CURRENT_MOD=$(stat -c %Y "$FILE")

  if [ "$CURRENT_MOD" == "$LAST_MOD" ]; then
    STABLE_COUNT=$((STABLE_COUNT+1))
  else
    STABLE_COUNT=0
    LAST_MOD=$CURRENT_MOD
  fi

  if [ "$STABLE_COUNT" -ge 3 ] && [ "$CURRENT_MOD" != "$NUDGED_MOD" ]; then
    LAST_SPEAKER=$(grep -E '\*\*\[.*\]:\*\*' "$FILE" | tail -n 1)

    if [[ "$LAST_SPEAKER" == *"Antigravity"* ]]; then
      # Antigravity falando com ele mesmo não deve disparar nada.
      NUDGED_MOD=$CURRENT_MOD
    else
      if [[ "$LAST_SPEAKER" != *"Claude"* ]]; then
        # Ninguém marcado como Claude/Antigravity == Humano falou.
        AUTO_TURNS=0
      fi

      if [ "$AUTO_TURNS" -ge "$MAX_AUTO_TURNS" ]; then
        echo "Limite de $MAX_AUTO_TURNS turnos automáticos atingido — esperando o Humano falar pra resetar."
        NUDGED_MOD=$CURRENT_MOD
      else
        echo "Novo recado! Acordando o Antigravity (agy)..."
        tmux display-message -t loop_guerra "Antigravity esta processando..." 2>/dev/null

        agy --dangerously-skip-permissions \
          -p "Nova mensagem na SALA_DE_GUERRA.md (raiz deste projeto). Leia a ultima mensagem e responda editando o proprio arquivo: adicione sua fala abaixo da linha divisoria final, sob a tag **[Antigravity]:**. Nao faca git add/commit/push desse arquivo (ele e ignorado de proposito)." \
          >> logs/antigravity_listener.log 2>&1

        AUTO_TURNS=$((AUTO_TURNS+1))
        NUDGED_MOD=$CURRENT_MOD
      fi
    fi
  fi
done
