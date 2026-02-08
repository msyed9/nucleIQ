#!/bin/bash
set -e

echo "=========================================="
echo " MINIMAL STARTUP TEST"
echo "=========================================="

cd /app/backend
export PORT=${PORT:-8080}

echo "Starting supervisord immediately..."
exec "$@"
