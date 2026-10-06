#!/bin/bash
# ==============================================================================
# ProteinFold AI Service Launcher
# Launches FastAPI backend on port 8000 and Next.js frontend on port 3000
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🧪 Starting ProteinFold AI backend (FastAPI)..."
nohup "$PROJECT_ROOT/.venv/bin/uvicorn" backend.app.main:app --host 127.0.0.1 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend started (PID: $BACKEND_PID, logs: backend.log)"

echo "⏳ Waiting for backend health check..."
for i in {1..10}; do
  if curl -s http://127.0.0.1:8000/api/v1/health | grep -q "healthy"; then
    echo "   Backend is live and healthy on http://127.0.0.1:8000! 🚀"
    break
  fi
  sleep 1
done

echo "🌐 Starting Next.js frontend on http://127.0.0.1:3000..."
cd "$PROJECT_ROOT/frontend"
npm run start
