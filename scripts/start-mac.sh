#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="prelegal:latest"
CONTAINER_NAME="prelegal-app"
PORT="${PORT:-8000}"

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building Docker image (${IMAGE_NAME})..."
docker build -t "${IMAGE_NAME}" .

echo "Removing any existing container..."
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

ENV_ARGS=()
if [ -f "${ROOT_DIR}/.env" ]; then
  ENV_ARGS+=(--env-file "${ROOT_DIR}/.env")
fi

echo "Starting container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:8000" \
  "${ENV_ARGS[@]}" \
  "${IMAGE_NAME}" >/dev/null

echo "Prelegal is running at http://localhost:${PORT}"
