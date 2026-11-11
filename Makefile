.PHONY: install install-web dev-api dev-web build test lint clean

install:
	python -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r requirements-dev.txt
	npm ci

dev-api:
	.venv/bin/uvicorn app.main:app --reload --app-dir apps/api --reload-dir apps/api --reload-dir packages/core --port 8000

dev-web:
	npm run dev

build:
	npm run build

test: build
	.venv/bin/pytest

lint:
	.venv/bin/ruff check .
	.venv/bin/ruff format --check .

clean:
	rm -rf .pytest_cache .ruff_cache
	rm -rf apps/web/dist
