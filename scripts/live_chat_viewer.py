#!/usr/bin/env python3
"""
Visualizador Terminal Amigável da Sala de Guerra (Antigravity & Claude Code)
Usa Rich para renderizar balões de chat modernos, syntax highlighting e auto-scroll.
"""

import os
import sys
import time
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.text import Text
from rich import box

CHAT_FILE = Path(__file__).resolve().parent.parent / "SALA_DE_GUERRA.md"
console = Console()

AGENT_CONFIG = {
    "Antigravity": {
        "title": "🤖 Antigravity (Google DeepMind)",
        "color": "cyan",
        "border_style": "bold cyan",
    },
    "Claude": {
        "title": "🧠 Claude Code (Anthropic)",
        "color": "magenta",
        "border_style": "bold magenta",
    },
    "Humano": {
        "title": "👤 Usuário (Comando)",
        "color": "green",
        "border_style": "bold green",
    },
    "Sistema": {
        "title": "⚙️ Sistema",
        "color": "yellow",
        "border_style": "yellow",
    },
}

def parse_messages(content: str):
    """Divide o conteúdo da SALA_DE_GUERRA.md em mensagens estruturadas."""
    lines = content.splitlines()
    messages = []
    
    current_sender = "Sistema"
    current_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # Detecta tags como **[Claude]:** ou **[Antigravity]:** ou **[Nome]:**
        if stripped.startswith("**[") and "]:**" in stripped:
            if current_lines:
                text = "\n".join(current_lines).strip()
                if text:
                    messages.append((current_sender, text))
                current_lines = []
            
            # Extrai o remetente
            sender_raw = stripped.split("]:**")[0].replace("**[", "").strip()
            if "Antigravity" in sender_raw:
                current_sender = "Antigravity"
            elif "Claude" in sender_raw:
                current_sender = "Claude"
            elif any(h in sender_raw.lower() for h in ["mark", "yure", "juan", "humano"]):
                current_sender = "Humano"
            else:
                current_sender = sender_raw
            
            # Texto restante na mesma linha se houver
            remainder = stripped.split("]:**", 1)[1].strip()
            if remainder:
                current_lines.append(remainder)
        elif stripped == "---":
            continue
        elif line.startswith("# Sala de Guerra") or line.startswith("**Instruções"):
            continue
        else:
            current_lines.append(line)
            
    if current_lines:
        text = "\n".join(current_lines).strip()
        if text:
            messages.append((current_sender, text))
            
    return messages

def render_message(sender: str, text: str):
    config = AGENT_CONFIG.get(sender, AGENT_CONFIG["Humano"])
    md_content = Markdown(text, code_theme="monokai")
    
    panel = Panel(
        md_content,
        title=f"[bold]{config['title']}[/bold]",
        title_align="left",
        border_style=config["border_style"],
        box=box.ROUNDED,
        padding=(1, 2),
    )
    return panel

def main():
    if not CHAT_FILE.exists():
        console.print(f"[bold red]Erro: Arquivo {CHAT_FILE} não encontrado![/bold red]")
        sys.exit(1)
        
    console.clear()
    
    header = Panel(
        Text.from_markup(
            "[bold white]⚔️  SALA DE GUERRA — TERMINAL AO VIVO[/bold white]\n"
            "[cyan]🤖 Antigravity[/cyan] [white]⚡[/white] "
            "[magenta]🧠 Claude Code[/magenta] [white]⚡[/white] "
            "[green]👤 Mark / Yure[/green]\n"
            "[dim]Pressione [bold white]Ctrl + C[/bold white] para sair do visualizador[/dim]"
        ),
        box=box.DOUBLE_EDGE,
        border_style="bright_blue",
        padding=(1, 2),
    )
    console.print(header)
    console.print()
    
    # Primeira carga - mostra as últimas 5 mensagens
    content = CHAT_FILE.read_text(encoding="utf-8", errors="replace")
    messages = parse_messages(content)
    
    initial_batch = messages[-5:] if len(messages) > 5 else messages
    for sender, text in initial_batch:
        console.print(render_message(sender, text))
        console.print()
        
    last_count = len(messages)
    last_mtime = CHAT_FILE.stat().st_mtime
    
    console.rule("[bold green]🟢 Conectado ao vivo — Monitorando SALA_DE_GUERRA.md...[/bold green]")
    console.print()
    
    try:
        while True:
            time.sleep(1)
            try:
                current_mtime = CHAT_FILE.stat().st_mtime
            except FileNotFoundError:
                continue
                
            if current_mtime != last_mtime:
                last_mtime = current_mtime
                content = CHAT_FILE.read_text(encoding="utf-8", errors="replace")
                messages = parse_messages(content)
                
                if len(messages) > last_count:
                    new_msgs = messages[last_count:]
                    for sender, text in new_msgs:
                        console.print(render_message(sender, text))
                        console.print()
                    last_count = len(messages)
    except KeyboardInterrupt:
        console.print("\n[bold yellow]👋 Visualizador encerrado![/bold yellow]")

if __name__ == "__main__":
    main()
