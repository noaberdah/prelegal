#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="prelegal-app"

echo "Stopping ${CONTAINER_NAME}..."
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
echo "Stopped."
