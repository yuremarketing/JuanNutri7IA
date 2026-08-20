# Base de conhecimento do RAG — Nutri7IA

Esta pasta reúne os documentos que vão alimentar a base de conhecimento
(RAG) do agente de IA descrito no EPIC #1. São os "conhecimentos da
profissão" que faltam pro agente sair do esqueleto visual e virar um
assistente nutricional de verdade — sem inventar informação clínica.

Cada subpasta corresponde a uma issue do GitHub. Preencha os templates
substituindo os `[PREENCHER: ...]` pelo conteúdo real; não apague as
seções, só complete.

| Pasta | Issue | O que entra aqui |
|---|---|---|
| `01-conhecimento-tecnico/` | [#4](https://github.com/yuremarketing/JuanNutri7IA/issues/4) | Tabela de alimentos, fórmula de TMB, micronutrientes |
| `02-protocolos-cardapios/` | [#5](https://github.com/yuremarketing/JuanNutri7IA/issues/5) | Cardápios-modelo por perfil (Atleta/Clínico/Estética) e substituições |
| `03-faq/` | [#6](https://github.com/yuremarketing/JuanNutri7IA/issues/6) | Perguntas reais de pacientes e como o Juan responde |
| [`../../brain dump/`](../../brain%20dump/) | [#7](https://github.com/yuremarketing/JuanNutri7IA/issues/7) | Fontes brutas já reunidas (export do Instagram, do NotebookLM, PDFs) — ainda cheias de HTML/JS/CSS irrelevante, precisam da limpeza técnica da issue #7 antes de virar conteúdo de RAG |

## Regra de ouro

Tudo aqui precisa ser **conteúdo real do Juan**, validado por ele — nunca
gerado por IA "inventando" conduta clínica. Se um agente (Claude/Gemini)
tocar nestes arquivos, o trabalho dele é organizar/formatar o que o Juan
forneceu, nunca preencher a lacuna clínica sozinho.
