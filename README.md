<div align="center">

<img src="https://cet.mintlify.app/logo/dark.png" alt="CET Logo" height="60" />

# Context Engineering Toolkit

**The Postman for LLM context** — a visual toolkit for building, testing, and optimizing RAG pipelines with real-time token analytics.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Docker](https://img.shields.io/badge/docker--compose-9%20services-blue.svg)](docker-compose.yml)
[![Docs](https://img.shields.io/badge/docs-mintlify-green.svg)](https://cet.mintlify.app/docs/introduction)

> Fix RAG failures in 15 minutes instead of 2 days.
> See exactly what enters your model's context window before it runs.

</div>

---

## What is CET?

Every developer building LLM-powered applications faces the same invisible crisis: *my AI gives wrong answers in production but I have no idea what it's actually seeing.*

The root cause is always context mismanagement — and until now, there was no dedicated tool to see, design, or measure it.

**CET gives you a visual interface to:**
- Design context pipelines on a drag-and-drop canvas (System Prompt → RAG → Chat History → LLM → Output)
- See exactly what enters your model's context window before it runs
- Measure token usage, cost, and retrieval relevance on every request
- Fix RAG failures in 15 minutes instead of 2 days

CET is **BYOK** (Bring Your Own Key) — you connect your own [OpenRouter](https://openrouter.ai) API key. CET is the tool. You supply the fuel.

## What CET is Not

- **Not a hosted SaaS** — you run it locally or self-host
- **Not an LLM provider** — BYOK, you bring your own OpenRouter key
- **Not a replacement for LangChain/LlamaIndex** — it's a visual debugging tool, not a framework

---

## Screenshots

> Dashboard · Pipeline Canvas · Knowledge Base · Playground · Analytics

---

## Features

| Feature | Description |
|---|---|
| **Pipeline Canvas** | Drag-and-drop visual builder with React Flow. Connect System Prompt, RAG, History, LLM, and Output nodes |
| **RAG Knowledge Base** | Upload PDFs, TXT files, or URLs. Chunked, embedded (BAAI/bge-m3, 1024-dim), and stored in pgvector |
| **Playground** | Chat interface with real-time SSE streaming, token counter, and model switcher |
| **Token Budget Bar** | Live color-coded bar showing token allocation per block — blue, green, yellow, red for over-budget |
| **Analytics** | Per-pipeline token usage, cost (USD), latency, and relevance scores across all runs |
| **Prompt Library** | Monaco Editor with live token counting, variable support, and reusable saved prompts |
| **3 LLM Models** | Claude Sonnet 4.6 (quality), GLM-5 (agent/coding), Gemini 3.1 Pro Preview (budget) |
| **BYOK** | Encrypted OpenRouter API key via AES-256-GCM vault — zero server-side LLM costs |
| **Auth** | Google OAuth, GitHub OAuth, Email OTP — all passwordless via Supabase |

---

## Tech Stack

### Frontend
- **Next.js 14** · TypeScript · Tailwind CSS v4 · Shadcn/ui
- **React Flow** (`@xyflow/react` v12) — pipeline canvas
- **Zustand** v5 · TanStack Query v5 · React Hook Form + Zod
- **Monaco Editor** — system prompt editing with live token counting
- **Recharts** — analytics charts

### Backend
- **FastAPI** 0.115 · Pydantic v2 · Uvicorn
- **LiteLLM** — unified LLM routing across 3 providers
- **sentence-transformers** — BAAI/bge-m3 embeddings (1024-dim)
- **PyMuPDF + BeautifulSoup4** — PDF and URL ingestion
- **python-jose** — JWT verification

### Data & Infrastructure
- **Supabase** — PostgreSQL 15 + pgvector + Auth + Storage
- **pgvector** with IVFFlat index for fast similarity search
- **Row Level Security (RLS)** on all tables
- **Vercel** — frontend deployment
- **Railway** — backend Docker deployment

---

## Supported LLM Models

| Model | Provider | Role | Context Window |
|---|---|---|---|
| `anthropic/claude-sonnet-4-6` | Anthropic | Quality (default) | 1,000,000 tokens |
| `z-ai/glm-5` | Z.ai | Agent / Coding | *(provider does not publicly disclose)* |
| `google/gemini-3.1-pro-preview` | Google | Budget / RAG | 1,048,576 tokens |

All models are accessed through your own OpenRouter API key.

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.12+
- Docker Desktop
- Git

### 1. Clone the repo

```bash
git clone https://github.com/mohammedziada92/context-engineering-toolkit.git
cd context-engineering-toolkit
```

### 2. Set up environment variables

```bash
# Copy example env files into place
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in `backend/.env` and `frontend/.env.local` with your values. Required variables:

```env
# PostgreSQL
POSTGRES_PASSWORD=your-generated-password

# Supabase (local Docker values — safe to use as-is)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-generated-secret

# LLM Models
MODEL_QUALITY=anthropic/claude-sonnet-4-6
MODEL_AGENT=z-ai/glm-5
MODEL_BUDGET=google/gemini-3.1-pro-preview

# Embeddings
EMBEDDING_MODEL=baai/bge-m3
EMBEDDING_DIMENSIONS=1024

# OAuth
GOOGLE_CLIENT_ID=from-google-console
GOOGLE_CLIENT_SECRET=from-google-console
GITHUB_CLIENT_ID=from-github-settings
GITHUB_CLIENT_SECRET=from-github-settings

# App
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
VAULT_ENCRYPTION_KEY=generate-with-python-below
```

Generate `VAULT_ENCRYPTION_KEY`:
```bash
python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
```

### 3. Start all services with Docker

```bash
docker compose up --build
```

This starts 9 services: frontend, backend, PostgreSQL, Supabase Auth, PostgREST, Realtime, Storage, Studio, and Meta.

Initial setup downloads Docker images (~3-4 GB). Subsequent starts take seconds.

### 4. Run database migrations

```bash
# In a new terminal
cd supabase
supabase db push
```

### 5. Open the app

| Service | URL |
|---|---|
| **CET App** | http://localhost:3000 |
| **FastAPI Docs** | http://localhost:8000/docs |
| **Supabase Studio** | http://localhost:54323 |

---

## OAuth Setup

### Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add to **Authorized Redirect URIs**: `http://localhost:54321/auth/v1/callback`
4. Copy Client ID + Secret → paste into `backend/.env`
5. Open Supabase Studio → Authentication → Providers → Google → Enable + paste credentials

### GitHub OAuth
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Set callback URL to `http://localhost:54321/auth/v1/callback`
3. Copy Client ID + Secret → paste into `backend/.env`
4. Open Supabase Studio → Authentication → Providers → GitHub → Enable + paste credentials

---

## Project Structure

```
context-engineering-toolkit/
├── frontend/                    # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── (auth)/login/    # Login page (static)
│       │   ├── (protected)/     # All dashboard pages
│       │   │   ├── dashboard/
│       │   │   ├── pipelines/
│       │   │   ├── knowledge/
│       │   │   ├── playground/
│       │   │   ├── analytics/
│       │   │   └── settings/
│       │   └── auth/callback/   # OAuth callback handler
│       ├── components/
│       │   ├── canvas/nodes/    # React Flow nodes
│       │   ├── editor/          # Monaco editor wrapper
│       │   └── analytics/       # Recharts components
│       ├── stores/              # Zustand stores
│       └── hooks/               # useSSE, usePipeline, useKnowledge
│
├── backend/                     # FastAPI application
│   └── app/
│       ├── api/routes/          # pipelines, knowledge, models, analytics
│       ├── core/                # config, security, models whitelist
│       ├── services/            # pipeline engine, RAG, embeddings, vault
│       └── db/queries/          # Supabase query functions
│
├── supabase/
│   └── migrations/              # PostgreSQL + pgvector schema
│
└── docker-compose.yml           # Full 9-service local stack
```

---

## API Reference

Full API documentation: [cet.mintlify.app/docs/introduction](https://cet.mintlify.app/docs/introduction)

Key endpoints:

```
GET  /health                          # Health check
POST /api/v1/pipelines/{id}/run       # Run pipeline (SSE streaming)
GET  /api/v1/pipelines                # List pipelines
POST /api/v1/knowledge                # Create knowledge source
GET  /api/v1/models                   # List supported LLM models
GET  /api/v1/analytics                # Usage analytics
PUT  /api/v1/settings/api-keys        # Save encrypted OpenRouter key
```

All endpoints require a valid Supabase JWT in the `Authorization: Bearer` header.

---

## Pipeline Config Format

Pipelines are stored as JSON and executed by the backend engine:

```json
{
  "pipeline_id": "uuid",
  "nodes": [
    { "id": "node-1", "type": "system_prompt", "data": { "content": "You are a helpful assistant.", "max_tokens": 500 }},
    { "id": "node-2", "type": "rag", "data": { "knowledge_source_id": "uuid", "top_k": 5, "similarity_threshold": 0.75, "max_tokens": 1500 }},
    { "id": "node-3", "type": "chat_history", "data": { "strategy": "summarize", "max_tokens": 500 }},
    { "id": "node-4", "type": "llm", "data": { "model": "anthropic/claude-sonnet-4-6", "temperature": 0.7, "max_tokens": 2048 }},
    { "id": "node-5", "type": "output", "data": {}}
  ],
  "edges": [
    { "source": "node-1", "target": "node-4" },
    { "source": "node-2", "target": "node-4" },
    { "source": "node-3", "target": "node-4" },
    { "source": "node-4", "target": "node-5" }
  ]
}
```

---

## Security

CET is built with security-first principles:

- **BYOK** — OpenRouter API keys are never stored in plaintext. Encrypted with AES-256-GCM via `VAULT_ENCRYPTION_KEY`
- **RLS** — Row Level Security enabled on all Supabase tables. Users can only access their own data
- **JWT verification** — every FastAPI route validates the Supabase JWT with `audience: authenticated`
- **Model whitelist** — all `model_override` inputs validated against `ALLOWED_MODEL_IDS`
- **SSRF protection** — URL ingestion blocks RFC 1918, loopback, and cloud metadata IPs
- **Non-root Docker** — backend containers run as `appuser`, not root

---

## Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Auto-deploy on push to `main`. Root directory: `frontend` |
| Backend | [Railway](https://railway.app) | Dockerfile in `backend/`. Auto-deploy on push to `main` |
| Database | [Supabase Cloud](https://supabase.com) | PostgreSQL 15 + pgvector + Auth + Storage |

### Required env vars for production

**Vercel (Frontend):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

**Railway (Backend):** See `backend/.env.example` for the full list of required variables.

---

## Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please read the [Setup Guide](./SETUP.md) before contributing.

---

## Roadmap

- [ ] Arabic language support (v2)
- [ ] A/B testing between pipeline versions
- [ ] Pipeline sharing and public templates
- [ ] Next.js 15/16 upgrade (deferred — `CET-SEC-NPM-NEXT`)
- [ ] Sentry error monitoring integration
- [ ] Billing and usage limits

---

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE).

Copyright (C) 2026 Mohammed Ziada

---

## Documentation

| Doc | Description |
|---|---|
| [SETUP.md](./SETUP.md) | Local development setup guide |
| [Live Docs](https://cet.mintlify.app/docs/introduction) | Mintlify hosted documentation |

---

<div align="center">

Built with ❤️ by [Mohammed Ziada](https://github.com/mohammedziada92)

⭐ Star this repo if CET helped you debug your RAG pipeline

</div>
