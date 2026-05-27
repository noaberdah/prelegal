# Prelegal backend

FastAPI backend that serves API endpoints and the statically built Next.js frontend.

## Layout

```
backend/
  pyproject.toml        # uv project
  src/prelegal/
    main.py             # FastAPI factory + lifespan + static mount
    config.py           # env-driven Settings (cached)
    db.py               # SQLite schema + connection helper
    security.py         # bcrypt + JWT helpers
    auth.py             # /api/auth routes
  tests/                # pytest suite
```

## Run locally (without Docker)

```bash
cd backend
uv sync
PRELEGAL_STATIC_DIR=../frontend/out \
  uv run uvicorn prelegal.main:create_app --factory --reload --port 8000
```

The static frontend is optional; if `PRELEGAL_STATIC_DIR` is unset, only the API is served.

## Run tests

```bash
cd backend
uv sync
uv run pytest
```

## Environment variables

| Name | Default | Description |
| --- | --- | --- |
| `PRELEGAL_JWT_SECRET` | random per process | HMAC secret for JWT cookies. Set in production. |
| `PRELEGAL_DB_PATH` | `<tempdir>/prelegal.db` | SQLite file. Wiped and recreated on app startup. |
| `PRELEGAL_STATIC_DIR` | unset | If set to a directory, mounts it at `/` (used to serve the Next.js export). |
| `PRELEGAL_COOKIE_SECURE` | `false` | Set to `true` behind HTTPS so the auth cookie carries `Secure`. |
