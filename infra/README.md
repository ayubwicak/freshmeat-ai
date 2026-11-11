# Infrastruktur FreshMeat AI

Folder ini berisi artefak deployment. Docker tidak tersedia di lingkungan pengembangan saat ini, sehingga file di sini disediakan sebagai referensi dan belum diverifikasi lewat `docker build` di mesin ini.

## Docker Compose

Dari root repositori:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

- Web (Nginx + React build): `http://localhost:8080`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## Komponen

| File | Fungsi |
|:---|:---|
| `docker/api.Dockerfile` | Image FastAPI + `freshmeat-core`, database pada volume `/data` |
| `docker/web.Dockerfile` | Multi-stage build React lalu disajikan Nginx |
| `docker/docker-compose.yml` | Orkestrasi `api` dan `web` |
| `nginx/default.conf` | Static SPA + reverse proxy `/api`, `/health`, `/docs` |

## Catatan Produksi

- Ganti `FRESHMEAT_CORS_ORIGINS` dari `*` menjadi origin web yang spesifik.
- Pasang TLS di depan Nginx (mis. reverse proxy eksternal atau sertifikat pada Nginx).
- Mount volume persisten untuk database dan lakukan backup rutin.
- Batasi ukuran upload dan tambahkan rate limiting pada endpoint analisis.
