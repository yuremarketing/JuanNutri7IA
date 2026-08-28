# JuanNutri7IA

Painel interno + assistente de IA para o consultório de nutrição do Juan.
React + Vite + TypeScript no front, Firebase (Auth/Firestore) como backend.

## Stack

- **Front-end:** React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Firebase (Authentication + Firestore)
- **Testes:** Vitest + Testing Library (`jsdom`)
- **Deploy:** Netlify (build automático a partir da `main`)

## Estrutura de pastas (`src/`)

Organização por domínio (DDD simplificado):

```
src/
├── app/        # painel de gestão do Juan (Dashboard, Login)
├── agente/     # produto de IA conversacional — reservado, ainda sem código
│               # (entra aqui conforme #4/#5/#6 avançarem)
├── interno/    # ferramentas de uso exclusivo do Juan (Briefing, RagIntake)
├── shared/     # componentes/config compartilhados (ProtectedRoute, firebase.ts)
├── App.tsx
└── main.tsx
```

## Rodando localmente

```bash
npm install
npm run dev        # servidor de desenvolvimento (Vite)
npm run build       # build de produção (tsc -b && vite build)
npm run preview     # serve o build de produção localmente
```

Requer um `.env` com a config do Firebase do projeto (não versionado).

## Autenticação e dados

- `/briefing` e `/rag-intake` são rotas internas protegidas por `ProtectedRoute`
  (Firebase Auth, email/senha) — só o Juan tem conta, sem tela de cadastro.
- Respostas do briefing de marketing vão para a collection `briefings` no
  Firestore; respostas do intake de conhecimento (técnico + persona clínica)
  vão para `rag_conteudo`.
- Regras de acesso em `firestore.rules` — exigem `request.auth != null` para
  leitura/escrita dessas collections.

## Conteúdo de RAG

`documentos_artefatos_humanos/rag/` guarda templates de referência em
markdown para o conhecimento técnico e de persona clínica do Juan. A fonte
de verdade real é o formulário `/rag-intake` (Firestore); os templates
servem como rascunho/apoio, não substituem os dados coletados pelo app.

## Gestão do projeto

- Backlog e prioridades: GitHub Issues deste repositório (issue #1 é o EPIC
  guarda-chuva).
- `SALA_DE_GUERRA.md` (não versionado) é o canal de coordenação em tempo
  real entre os agentes de IA que trabalham no projeto — não faz parte do
  código do produto.
