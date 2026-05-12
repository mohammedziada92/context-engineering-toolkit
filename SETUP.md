# CET — Local Development Setup

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account (cloud or local via Docker)
- OpenRouter API key

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd context-engineering-toolkit

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in your Supabase credentials and OpenRouter API key.

### 3. Start servers

```bash
# Backend (port 8000)
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000

---

## Windows Development

### LiteLLM Long-Path Fix

LiteLLM has deeply nested package files that exceed Windows MAX_PATH (260 chars). You must use a short-path virtual environment.

**One-time setup:**

```bash
# Run from repo root
backend\scripts\setup-windows.bat

# OR enable long paths system-wide (requires admin):
reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f
git config --system core.longpaths true
```

**Start backend (Windows):**

```bash
cd backend
C:\tmp\cet-env\Scripts\uvicorn app.main:app --reload --port 8000
```

**Linux/Mac/Docker:** Standard venv works fine. No action needed.

---

## Docker (Full Stack)

```bash
docker compose up -d
```

This starts: Postgres, GoTrue (auth), PostgREST, Realtime, Storage, Studio, Backend, Frontend.

See `docker-compose.yml` for port mappings.

---

## Project Structure

```
context-engineering-toolkit/
├── backend/           # FastAPI + Supabase
│   ├── app/
│   │   ├── api/routes/    # REST endpoints
│   │   ├── db/queries/    # Data access layer
│   │   ├── middleware/     # Auth, rate limiting
│   │   ├── services/      # LLM, RAG, embedding
│   │   └── core/          # Config, security
│   ├── scripts/           # Setup helpers
│   └── .env.example
├── frontend/          # Next.js 15 + React Flow
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # UI components
│   │   ├── stores/        # Zustand stores
│   │   └── lib/           # API client, utils
│   └── .env.example
└── docker-compose.yml
```
