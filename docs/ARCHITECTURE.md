# Arsitektur Monorepo FreshMeat AI

Dokumen ini menjelaskan struktur **enterprise monorepo**, batas tanggung jawab setiap paket, dan alur data utama.

## 1. Prinsip

- **Apps vs Packages:** `apps/` hanya berisi layanan yang dijalankan. Logika domain yang dapat dipakai ulang berada di `packages/`.
- **Arah dependensi satu arah:** aplikasi boleh bergantung pada paket; paket tidak boleh bergantung pada aplikasi.
- **Kontrak eksplisit:** backend memakai Pydantic schema, frontend memakai paket analisis dan API client dengan antarmuka fungsi yang stabil.
- **Infrastruktur terpisah:** Docker, Nginx, dan orkestrasi berada di `infra/`, bukan bercampur dengan kode aplikasi.
- **Dokumentasi terpusat:** SDD, arsitektur, dan panduan operasional berada di `docs/`.

## 2. Struktur

```text
.
├── apps/
│   ├── api/                  FastAPI delivery service
│   │   ├── app/
│   │   │   ├── api/routes.py     HTTP endpoints
│   │   │   ├── config.py         konfigurasi environment
│   │   │   ├── main.py           app factory + static frontend
│   │   │   └── storage.py        SQLite audit repository
│   │   ├── tests/                API, persistence, E2E backend
│   │   └── pyproject.toml
│   └── web/                  React 19 + Vite dashboard
│       ├── src/
│       │   ├── components/       presentational + dashboard panels
│       │   ├── lib/              tema, API client instance, report
│       │   ├── App.jsx           orkestrasi state
│       │   └── main.jsx
│       └── package.json
├── packages/
│   ├── core/                 freshmeat-core (Python)
│   │   ├── src/freshmeat_core/
│   │   │   ├── vision.py         CIELAB, GLCM, ROI
│   │   │   ├── scoring.py        skor, rules, verdict
│   │   │   ├── service.py        orkestrasi pipeline
│   │   │   ├── schemas.py        Pydantic contract
│   │   │   └── exceptions.py
│   │   └── tests/
│   ├── analysis/             @freshmeat/analysis (JS)
│   │   └── src/                  Canvas fallback + domain constants
│   └── api-client/           @freshmeat/api-client (JS)
│       └── src/                  fetch wrapper untuk REST API
├── infra/
│   ├── docker/               Dockerfile API, web, compose
│   └── nginx/                reverse proxy + static serving
├── docs/
│   ├── SDD.md
│   └── ARCHITECTURE.md
├── .github/workflows/ci.yml
├── Makefile
├── package.json              npm workspaces
├── pyproject.toml            Ruff config
├── pytest.ini
├── requirements.txt
└── requirements-dev.txt
```

## 3. Dependency Graph

```text
apps/web ──> @freshmeat/analysis
         └─> @freshmeat/api-client

apps/api ──> freshmeat-core

freshmeat-core ──> numpy, opencv-python-headless, pydantic
apps/api       ──> fastapi, uvicorn, python-multipart
apps/web       ──> react, react-dom, tailwindcss, lucide-react
```

Aturan:

- `packages/core` tidak mengimpor FastAPI, SQLite, atau kode `apps/api`.
- `packages/analysis` tidak mengimpor React; ia hanya berisi fungsi analisis dan konstanta domain.
- `apps/api` tidak mengimpor paket JavaScript, dan `apps/web` tidak mengimpor kode Python.

## 4. Alur Runtime

### 4.1 Mode lokal (edge)

1. React menggambar sampel ke `<canvas>`.
2. `@freshmeat/analysis` menghitung rasio merah otot, oksidasi, dan specularity dari piksel; lemak/marbling dan highlight dikeluarkan dari rata-rata warna otot.
3. Skor lokal, hard rules, dan shelf-life dihitung di browser.
4. Hasil ditampilkan tanpa memanggil backend.

### 4.2 Mode FastAPI

1. React mengirim `multipart/form-data` melalui `@freshmeat/api-client`.
2. `apps/api` memvalidasi upload dan memanggil `freshmeat_core.analyze_sample`.
3. Core melakukan resize, segmentasi ROI sadar-marbling, pemisahan otot/lemak, CIELAB, GLCM, scoring, dan rules.
4. `apps/api/app/storage.py` menyimpan payload ke SQLite.
5. Response dipetakan ke UI React; tabel riwayat dimuat dari `GET /api/v1/inspections`.
6. Jika backend gagal/timeout, React kembali ke mode lokal.

## 5. Batas Tanggung Jawab

| Lapisan | Tanggung jawab | Tidak boleh |
|:---|:---|:---|
| `apps/web` | UI, state, canvas rendering, pemanggilan API | Menyimpan logika domain yang dipakai layanan lain |
| `apps/api` | HTTP, validasi request, CORS, static serving, persistence | Menyimpan algoritma vision/scoring |
| `packages/core` | Vision, scoring, rules, schema domain | Bergantung pada framework web |
| `packages/analysis` | Analisis Canvas lokal dan konstanta domain | Mengimpor React atau DOM component |
| `packages/api-client` | Kontrak pemanggilan REST | Mengetahui detail UI |
| `infra` | Build image, reverse proxy, volume | Mengandung logika aplikasi |

## 6. Persistensi & Konfigurasi

- Database default: `apps/api/data/freshmeat.db`.
- Override: `FRESHMEAT_DB_PATH`.
- Lokasi build web: `apps/web/dist`; override: `FRESHMEAT_WEB_DIST`.
- CORS: `FRESHMEAT_CORS_ORIGINS` (dipisah koma, default `*`).
- API base frontend: `VITE_API_BASE` (default same-origin).

## 7. Perintah Operasional

```bash
make install       # venv + editable Python packages + npm ci
make dev-api       # FastAPI :8000
make dev-web       # Vite :5173
make build         # build React ke apps/web/dist
make test          # pytest (API + core)
make lint          # Ruff check + format check
```

Tanpa Make:

```bash
.venv/bin/uvicorn app.main:app --app-dir apps/api --reload --port 8000
npm run dev
npm run build
.venv/bin/pytest
.venv/bin/ruff check .
```

## 8. CI dan Deployment

- CI menjalankan dua job: **api** (lint, build web, pytest) dan **web** (npm ci + build).
- `infra/docker/docker-compose.yml` menjalankan API dan Nginx/static web.
- Nginx mem-proxy `/api`, `/health`, `/docs`, dan `/openapi.json` ke service `api`.
- Database API disimpan pada volume `api-data`.
