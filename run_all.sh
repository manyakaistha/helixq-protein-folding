#!/bin/bash
# ==============================================================================
# ProteinFold AI Service Daemon Controller
# Launches FastAPI backend on port 8000 and Next.js frontend on port 3000
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

BACKEND_PORT=8000
FRONTEND_PORT=3000
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

stop_services() {
  echo "🛑 Stopping existing services..."
  if [ -f "$BACKEND_PID_FILE" ]; then
    kill -9 "$(cat "$BACKEND_PID_FILE")" 2>/dev/null || true
    rm -f "$BACKEND_PID_FILE"
  fi
  if [ -f "$FRONTEND_PID_FILE" ]; then
    kill -9 "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null || true
    rm -f "$FRONTEND_PID_FILE"
  fi
  lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
  lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
  echo "   Services stopped."
}

start_services() {
  stop_services
  echo "🧪 Starting ProteinFold AI backend (FastAPI)..."
  nohup "$PROJECT_ROOT/.venv/bin/uvicorn" backend.app.main:app --host 127.0.0.1 --port $BACKEND_PORT > "$PROJECT_ROOT/backend.log" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"
  echo "   Backend started (PID: $(cat "$BACKEND_PID_FILE"), logs: backend.log)"

  echo "⏳ Waiting for backend health check..."
  for i in {1..15}; do
    if curl -s "http://127.0.0.1:$BACKEND_PORT/api/v1/health" | grep -q "healthy"; then
      echo "   Backend is live and healthy on http://127.0.0.1:$BACKEND_PORT! 🚀"
      break
    fi
    sleep 1
  done

  echo "🌐 Starting Next.js frontend on http://127.0.0.1:$FRONTEND_PORT..."
  cd "$PROJECT_ROOT/frontend"
  nohup npm run start > "$PROJECT_ROOT/frontend.log" 2>&1 &
  echo $! > "$FRONTEND_PID_FILE"
  echo "   Frontend started (PID: $(cat "$FRONTEND_PID_FILE"), logs: frontend.log)"

  echo "⏳ Waiting for frontend health check..."
  for i in {1..15}; do
    if curl -s -I "http://127.0.0.1:$FRONTEND_PORT" | grep -q "HTTP/1.1 200"; then
      echo "   Frontend is live on http://127.0.0.1:$FRONTEND_PORT! 🚀"
      break
    fi
    sleep 1
  done

  echo ""
  echo "================================================================="
  echo " ProteinFold AI Services Online:"
  echo "   • Frontend:  http://127.0.0.1:3000"
  echo "   • Backend:   http://127.0.0.1:8000"
  echo "   • API Docs:  http://127.0.0.1:8000/docs"
  echo "================================================================="
}

status_services() {
  echo "=== Service Status ==="
  if curl -s "http://127.0.0.1:$BACKEND_PORT/api/v1/health" | grep -q "healthy"; then
    echo " Backend (8000):  HEALTHY 🟢"
  else
    echo " Backend (8000):  OFFLINE 🔴"
  fi

  if curl -s -I "http://127.0.0.1:$FRONTEND_PORT" | grep -q "HTTP/1.1 200"; then
    echo " Frontend (3000): HEALTHY 🟢"
  else
    echo " Frontend (3000): OFFLINE 🔴"
  fi
}

case "$1" in
  stop)
    stop_services
    ;;
  status)
    status_services
    ;;
  restart)
    stop_services
    start_services
    ;;
  *)
    start_services
    ;;
esac
