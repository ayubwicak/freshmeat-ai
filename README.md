# FreshMeat AI

Sistem inspeksi kesegaran daging berbasis computer vision (CIELAB + GLCM) dan estimasi masa simpan. Frontend **React 19 + Vite + Tailwind CSS**, backend **FastAPI + OpenCV + SQLite**, disusun sebagai **enterprise monorepo**.

## Fitur

- Dashboard React interaktif dengan 4 skenario demo: sapi segar, ayam mulai menurun, indikasi gelonggongan, dan daging busuk.
- Analisis piksel Canvas lokal sebagai fallback tanpa backend.
- Ekstraksi fitur CIELAB (L\*, a\*, b\*, chroma, hue, diskolorasi, oksimioglobin).
- Fitur tekstur GLCM (contrast, homogeneity, energy, correlation) dan specular wetness.
- Hard override rules RULE-01 s.d. RULE-03.
- Estimasi TVB-N, klasifikasi Grade A/B/Reject, dan shelf-life.
- Riwayat audit persisten di SQLite, ekspor JSON, dan cetak sertifikat.

## Struktur Monorepo

```text
apps/
  api/            FastAPI delivery + SQLite (freshmeat-api)
  web/            React 19 + Vite + Tailwind (@freshmeat/web)
packages/
  core/           Domain vision/scoring Python (freshmeat-core)
  analysis/       Analisis Canvas + konstanta domain ( @freshmeat/analysis )
  api-client/     Klien REST ( @freshmeat/api-client )
infra/
  docker/         Dockerfile API, web, docker-compose
  nginx/          Reverse proxy + static SPA
docs/
  SDD.md          Software Design Document
  ARCHITECTURE.md Detail arsitektur dan batas tanggung jawab
```

## Quick Start

Prasyarat: Python 3.11+ dan Node.js 22+.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
npm ci
npm run build
```

Jalankan API:

```bash
uvicorn app.main:app --app-dir apps/api --reload --port 8000
```

Buka `http://localhost:8000/`; Swagger tersedia di `/docs`.

Mode development frontend (backend tetap berjalan):

```bash
npm run dev
```

Buka `http://localhost:5173`. Vite mem-proxy `/api` ke `http://127.0.0.1:8000`. Jika backend tidak tersedia, aplikasi otomatis memakai analisis Canvas lokal.

## Perintah

```bash
make install    # venv, paket Python editable, npm ci
make dev-api    # FastAPI :8000
make dev-web    # Vite :5173
make build      # build React ke apps/web/dist
make test       # pytest API + core
make lint       # Ruff check + format check
```

Padanan tanpa Make:

```bash
npm run build
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

## Test

Frontend harus di-build terlebih dahulu karena salah satu test memverifikasi penyajian aplikasi React:

```bash
npm ci
npm run build
.venv/bin/pytest
```

Test mencakup endpoint API, klasifikasi Grade A/B/Reject, batas RULE-01 s.d. RULE-03, validasi file, persistensi riwayat, dan penyajian frontend hasil build. CI ada di `.github/workflows/ci.yml`.

## Konfigurasi

| Variabel | Default | Keterangan |
|:---|:---|:---|
| `FRESHMEAT_DB_PATH` | `apps/api/data/freshmeat.db` | Lokasi SQLite audit |
| `FRESHMEAT_WEB_DIST` | `apps/web/dist` | Lokasi build frontend |
| `FRESHMEAT_CORS_ORIGINS` | `*` | Origin CORS, pisahkan dengan koma |
| `VITE_API_BASE` | same-origin | Base URL API untuk frontend |

## Endpoint

| Method | Path | Keterangan |
|:---|:---|:---|
| GET | `/health` | Status server |
| POST | `/api/v1/analyze` | Analisis citra + parameter kontekstual |
| GET | `/api/v1/inspections?limit=20` | Riwayat audit tersimpan (SQLite) |
| GET | `/docs` | Dokumentasi Swagger |
| GET | `/` | Frontend React hasil build |

Contoh:

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -F "file=@sampel.jpg" \
  -F "commodity=Sapi (Beef Sirloin/Tenderloin)" \
  -F "storage_temp=4" \
  -F "exposure_hours=1.5" \
  -F "surface_condition=normal" \
  -F "aroma_condition=fresh"
```

## Dokumentasi

- `docs/SDD.md` — desain sistem, rumus, rules, dan pengujian.
- `docs/ARCHITECTURE.md` — monorepo, dependency graph, dan alur runtime.
- `infra/README.md` — deployment Docker/Nginx.

## Catatan

Hasil adalah estimasi pendukung keputusan, bukan pengganti uji laboratorium TVB-N, mikrobiologi, atau sensori resmi.
