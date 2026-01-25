# Deployment & Production Operations Runbook

## 1. Quick Start with Docker Compose

To launch the full production environment (FastAPI backend + Next.js frontend):

```bash
# Build and start services
docker-compose up --build -d

# Check container status
docker-compose ps

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend
```

The services will be available at:
- Frontend Dashboard: `http://localhost:3000`
- FastAPI Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/v1/health`

---

## 2. Local Development Without Docker

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- `uv` (recommended) or standard `pip`

### Backend Setup
```bash
# Install Python package in editable mode
pip install -e .

# Or using uv
uv pip install -e .

# Start FastAPI server with live reloading
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`.

---

## 3. Automated Test Suite Execution

Run the complete test suite across ML components and API endpoints:

```bash
# Run all tests
pytest -v

# Run with coverage report
pytest --cov=ml --cov=backend/app tests/ backend/tests/
```

Expected result: 15 passed in < 3 seconds.

---

## 4. Hardware Acceleration

The backend automatically detects and leverages:
1. **Apple Silicon (MPS)**: Utilizes `torch.backends.mps.is_available()`.
2. **NVIDIA GPUs (CUDA)**: Utilizes `torch.cuda.is_available()`.
3. **CPU Fallback**: Graceful fallback with multithreading support.

Override manually via environment variable:
```bash
export DEVICE=cpu
uvicorn backend.app.main:app --port 8000
```
