# CET — Local Development Guide

## Docker Commands

| Command | What it does |
|---------|-------------|
| `docker compose up -d` | Start all containers. Data preserved. |
| `docker compose down` | Stop containers. Data preserved. |
| `docker compose up -d --build cet-frontend` | Rebuild and restart one service. |
| `docker compose up -d --build cet-backend` | Rebuild and restart backend. |
| `docker compose logs -f cet-frontend` | Tail logs for one service. |
| `docker compose restart cet-frontend` | Quick restart without rebuild. |

### Warning

**Never run `docker compose down -v`.** The `-v` flag destroys all named volumes — your database, auth data, and storage are permanently deleted. Use plain `docker compose down` instead.

## Hot Reload

Volume mounts are configured for both services:

- **Frontend:** `./frontend/src` and `./frontend/public` mounted into `/app/src` and `/app/public`
- **Backend:** `./backend/app` mounted into `/app/app`

`WATCHPACK_POLLING=true` is set for the frontend to support WSL2 and Docker file watching.

### When HMR handles it automatically

- Editing any `.tsx`, `.ts`, `.css` file in `frontend/src` — page refreshes instantly
- Editing any `.py` file in `backend/app` — uvicorn reloads automatically

### When you need to rebuild

- Changing `package.json` dependencies → `docker compose up -d --build cet-frontend`
- Changing `requirements.txt` dependencies → `docker compose up -d --build cet-backend`
- Changing `Dockerfile` or `docker-compose.yml` → `docker compose up -d --build <service>`
- Changing `next.config.js` → `docker compose up -d --build cet-frontend`

## Environment Files

| File | Purpose | Gitignored |
|------|---------|-----------|
| `backend/.env` | API keys, DB URL, secrets | Yes |
| `frontend/.env.local` | Supabase URL, API URL | Yes |
| `backend/.env.example` | Template — safe to commit | No |

## Troubleshooting

**Frontend not picking up changes?**
1. Confirm volume mounts: `docker inspect cet-frontend --format '{{json .Mounts}}'`
2. Restart: `docker compose restart cet-frontend`

**Port already in use?**
```bash
docker compose down     # stops containers
docker compose up -d    # starts fresh
```

**Database connection refused?**
```bash
docker compose logs cet-db    # check Postgres health
docker compose restart cet-db # restart if unhealthy
```
