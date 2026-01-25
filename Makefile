.PHONY: help install test lint run-backend run-frontend docker-build docker-up docker-down evaluate-holdout

help:
	@echo "ProteinFold AI Management Commands:"
	@echo "  make install         Install backend dependencies"
	@echo "  make test            Run backend and ML pytest suite"
	@echo "  make evaluate-holdout Reproduce validation score (0.4703)"
	@echo "  make run-backend     Start FastAPI backend server"
	@echo "  make run-frontend    Start Next.js frontend"
	@echo "  make docker-up       Start full platform with docker-compose"
	@echo "  make docker-down     Stop docker-compose containers"

install:
	pip install -e .

test:
	pytest -v

evaluate-holdout:
	python scripts/evaluate_holdout.py

run-backend:
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	cd frontend && npm run dev

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
