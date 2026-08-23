# Documentação Técnica — Agente de Atendimento Nutricional (Nutri7IA)

> Status deste documento: **blueprint de arquitetura**, não implementação.
> O repositório hoje contém só a landing page estática (`index.html`) e o
> conteúdo de RAG em preenchimento (`documentos_artefatos_humanos/rag/`).
> Este documento descreve o que precisa ser construído pra realizar as
> user stories do EPIC [#1](https://github.com/yuremarketing/JuanNutri7IA/issues/1).

## 1. Visão geral

O Nutri7IA é um agente de IA que atua como assistente de atendimento
nutricional para o consultório do Juan Pablo (CRN 27717/P), automatizando
triagem, anamnese, segmentação de pacientes, geração de lista de compras
por visão computacional, acompanhamento de refeições e agendamento —
suportando mais de 100 pacientes simultâneos com isolamento de dados por
paciente (multi-tenant).

Este documento traduz as 6 user stories do EPIC (US01–US06) em componentes
de arquitetura, modelo de dados e decisões técnicas necessárias pra
construir o sistema.

## 2. Arquitetura da solução

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Canais de entrada                            │
│   WhatsApp Business API   ·   Web app (paciente)   ·   Web app (Juan) │
└───────────────────────────────┬────────────────────────────────────--┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Camada de Orquestração   │
                    │  (API backend + roteamento │
                    │   de intenção do agente)   │
                    └───────┬───────────┬───────┘
                            │           │
              ┌─────────────▼───┐   ┌───▼─────────────────┐
              │   Motor de IA /   │   │  Serviços de domínio │
              │   RAG (LLM +      │   │  (triagem, planos,   │
              │   base vetorial)  │   │  agendamento, etc.)   │
              └─────────┬────────┘   └───────────┬──────────┘
                        │                          │
              ┌─────────▼──────────────────────────▼─────────┐
              │              Banco de dados (multi-tenant)     │
              │   pacientes · triagens · planos · refeições    │
              │   agendamentos · logs de acesso (LGPD)         │
              └────────────────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Visão Computacional │  ← módulo separado (US04),
              │  (reconhecimento de   │    processa imagem da geladeira,
              │   alimentos na foto)  │    não guarda a imagem além do
              └───────────────────────┘    necessário (ver §7)
```

### Por que essa separação

- **Motor de IA/RAG** fica isolado dos **serviços de domínio** porque a IA
  nunca deve escrever direto no banco de dados clínico — ela consulta a
  base de conhecimento (RAG) e sugere; quem persiste dado de paciente é o
  serviço de domínio, com regras de negócio explícitas (auditável, testável,
  sem "alucinação" gravada como fato).
- **Visão computacional** é um módulo à parte porque tem requisito de
  latência e custo diferentes (processamento de imagem), e porque a
  imagem em si é dado sensível (ver §7) — deve ser processada e descartada,
  não acumulada indefinidamente.

## 3. Stack tecnológica recomendada

| Camada | Sugestão | Por quê |
|---|---|---|
| LLM / agente | Claude (Anthropic) via API, com RAG sobre `documentos_artefatos_humanos/rag/` | Já é a base de conhecimento que o projeto está construindo; ver `docs/claude-api` internamente para padrões de tool use/streaming |
| Base vetorial (RAG) | pgvector (Postgres) ou serviço gerenciado equivalente | Evita infraestrutura extra se o banco principal já for Postgres |
| Backend | API HTTP (Node.js/TypeScript ou Python), stateless, multi-tenant por `paciente_id`/`tenant_id` | Compatível com o ecossistema atual do repo (front hoje é HTML/CSS/JS puro) |
| Banco de dados | PostgreSQL, com Row-Level Security por tenant | Suporta o requisito de isolamento rigoroso de dados |
| Canal de mensagem | WhatsApp Business API (Cloud API da Meta) | O número de contato do Juan já está documentado em `informacoes_operacionais.md`; é o canal onde as dúvidas de paciente já chegam hoje (ver issue #6) |
| Visão computacional | API multimodal (Claude ou Gemini) para reconhecimento de alimentos em foto | Não precisa de modelo de visão treinado do zero — reconhecimento de alimentos em foto é bem coberto por modelos multimodais atuais |
| Agendamento | Integração com Google Calendar/Calendly (ou equivalente) via API | US06 pede agendamento de sessão de 30 min — não precisa reinventar um calendário |
| Frontend paciente/nutricionista | Evoluir o `index.html` atual para uma SPA (React/Vue) ou manter multi-página, conforme a equipe decidir | Fora do escopo deste documento definir framework — é decisão de time, não de arquitetura de dados |

## 4. Modelo de dados (visão lógica)

```
Tenant (consultório)
 └── Paciente
      ├── Perfil        (Atleta | Clínico Geral | Estética — US01/US03)
      ├── Triagem        (respostas do questionário estruturado — US02)
      ├── PlanoAlimentar (cardápio vigente, versionado)
      ├── RegistroRefeicao (log diário de adesão — US05)
      ├── ListaDeCompras (gerada a partir da Visão Computacional — US04)
      └── Agendamento    (sessões marcadas — US06)

BaseConhecimentoRAG (por tenant ou compartilhada, decisão de negócio)
 ├── ConhecimentoTecnico   (tabela de alimentos, fórmula de TMB, micronutrientes)
 ├── ProtocoloCardapio     (cardápios-modelo por perfil, substituições)
 └── FAQ                  (pergunta/resposta validada pelo Juan)
```

Campos de saúde (triagem, plano alimentar, registro de refeição) são
**dados sensíveis** sob a LGPD (art. 5º, II) — ver §7 antes de definir
schema físico (criptografia em repouso, controle de acesso por campo).

## 5. Módulos funcionais (mapeados às user stories)

### US01 — Triagem Automatizada
Fluxo: paciente inicia conversa (WhatsApp ou web) → agente aplica
questionário inicial → classifica em Atleta / Clínico Geral / Estética
com base nas respostas + regras definidas pelo Juan (ver
`documentos_artefatos_humanos/rag/02-protocolos-cardapios/`).

### US02 — Coleta de Informações de Saúde e Hábitos Alimentares
Questionário estruturado (não conversa livre não-estruturada) — garante
dado confiável e comparável entre pacientes. Persistido como `Triagem`.

### US03 — Segmentação por Sub-nichos Metabólicos
Pós-processamento da triagem: classifica em sub-nicho (ex. hipertrofia,
emagrecimento estético, performance) e gera resumo pro Juan revisar antes
de qualquer plano ser enviado ao paciente — **o agente propõe, o Juan
aprova**, especialmente enquanto o RAG clínico (issues #4–#6) não estiver
100% validado.

### US04 — Reconhecimento Visual da Geladeira
Paciente envia foto → modelo multimodal identifica itens → sistema
compara com o plano alimentar vigente → gera lista de compras dos itens
faltantes. Ver §7 para retenção da imagem.

### US05 — Monitoramento e Registro de Refeições
Paciente registra refeição (texto ou foto) → sistema compara com o plano
→ feedback automático + resumo de adesão pro Juan.

### US06 — Agendamento de Consulta Online
Pré-triagem automatizada → oferece horários disponíveis (via integração
de calendário) → confirma sessão de 30 min.

## 6. RAG — Base de conhecimento

A qualidade do agente depende inteiramente do conteúdo em
`documentos_artefatos_humanos/rag/` estar preenchido e validado pelo Juan
(issues [#4](https://github.com/yuremarketing/JuanNutri7IA/issues/4),
[#5](https://github.com/yuremarketing/JuanNutri7IA/issues/5),
[#6](https://github.com/yuremarketing/JuanNutri7IA/issues/6)) e do
material bruto em `brain dump/` ser limpo (issue
[#7](https://github.com/yuremarketing/JuanNutri7IA/issues/7)). **Nenhuma
US do EPIC deve ir pra produção respondendo paciente real antes desse
conteúdo estar validado** — é o que evita o agente inventar conduta
clínica.

## 7. Segurança, privacidade e LGPD

- Dado de saúde é **dado sensível** (LGPD art. 5º, II) — exige base legal
  específica (em geral, consentimento explícito do paciente) e cuidado
  redobrado de acesso e retenção.
- **Isolamento multi-tenant**: nenhum paciente deve conseguir, por
  nenhuma falha de autorização, acessar dado de outro paciente — Row-Level
  Security no banco, não só checagem na aplicação.
- **Imagens da geladeira (US04)** e **fotos de refeição (US05)**: definir
  política de retenção (ex.: processar e descartar em X dias) — não
  acumular indefinidamente sem necessidade.
- **Logs de acesso**: quem (Juan, sistema, agente) acessou qual dado de
  qual paciente e quando — necessário tanto pra auditoria quanto pra
  atender a um eventual pedido de titular (LGPD art. 18).
- **Direitos do titular**: o paciente pode pedir exclusão dos seus dados
  — o modelo de dados precisa suportar isso sem quebrar o histórico de
  outros pacientes.
- Consulte um profissional jurídico antes de ir a produção com dados de
  saúde reais — este documento aponta os requisitos técnicos que decorrem
  da LGPD, não substitui parecer jurídico.

## 8. Escalabilidade e multi-tenancy

Requisito do EPIC: suportar mais de 100 pacientes simultâneos com alto
desempenho. Implicações de arquitetura:

- Backend stateless (qualquer instância atende qualquer requisição) —
  permite escalar horizontalmente.
- Base vetorial do RAG pode ser compartilhada entre tenants (o
  conhecimento nutricional geral é o mesmo), mas dado de paciente nunca é.
- Fila assíncrona para processamento de imagem (US04/US05), pra não
  bloquear a conversa esperando o modelo multimodal responder.

## 9. Roadmap sugerido (fases)

1. **Fase 0 — Fundação de conhecimento** (em andamento): preencher e
   validar o RAG (issues #4–#7). Sem isso, nenhuma fase seguinte tem
   conteúdo confiável pra usar.
2. **Fase 1 — Triagem e segmentação** (US01, US02, US03): fluxo
   conversacional estruturado + classificação de perfil. Não depende de
   visão computacional nem agendamento.
3. **Fase 2 — Agendamento** (US06): valor rápido de entregar, integração
   relativamente simples com calendário.
4. **Fase 3 — Monitoramento de refeições** (US05): depende de Fase 1
   (plano alimentar já existir pra comparar adesão).
5. **Fase 4 — Visão computacional da geladeira** (US04): a mais complexa
   tecnicamente (processamento de imagem, custo, latência) — deixada por
   último de propósito.

## 10. Referências internas

- EPIC e user stories: [issue #1](https://github.com/yuremarketing/JuanNutri7IA/issues/1)
- Base de conhecimento RAG: `documentos_artefatos_humanos/rag/`
- Loop de desenvolvimento assistido (Claude + Gemini): `scripts/agent-loop/`
- Dados operacionais do Juan: `documentos_artefatos_humanos/informacoes_operacionais.md`
