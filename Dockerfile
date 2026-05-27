# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build the Next.js static export ----------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build
# Static output ends up at /app/frontend/out (next.config.ts sets output: "export")


# ---------- Stage 2: Python runtime ----------
FROM python:3.12-slim AS runtime

# Install uv via pip (pinned to a known-good major version)
RUN pip install --no-cache-dir "uv>=0.5,<1.0"

WORKDIR /app/backend

# Resolve and install dependencies first for better layer caching
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy backend source, then install the project itself
COPY backend/src ./src
RUN uv sync --frozen --no-dev

# Bring in the static frontend build
COPY --from=frontend-build /app/frontend/out /app/frontend/out

ENV PRELEGAL_DB_PATH=/tmp/prelegal.db \
    PRELEGAL_STATIC_DIR=/app/frontend/out \
    PRELEGAL_COOKIE_SECURE=false \
    PYTHONUNBUFFERED=1 \
    PATH="/app/backend/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "prelegal.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
