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

echo "Starting container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:8000" \
  "${IMAGE_NAME}" >/dev/null

echo "Prelegal is running at http://localhost:${PORT}"
