# Software Design Document (SDD)

# FreshMeat AI

**Sistem Deteksi Kesegaran Daging & Estimasi Masa Simpan Berbasis Computer Vision dan Analisis Multi-Parameter**

- **Versi Dokumen:** 1.0.0
- **Status:** Release Candidate (Competition Build)
- **Kategori Sistem:** Food Tech / Quality Assurance & Food Safety

## 1. Pendahuluan & Latar Belakang Masalah

Keracunan pangan akibat konsumsi daging yang mengalami pembusukan dini, praktik kecurangan pedagang (seperti penyuntikan air berlebih atau daging gelonggongan), serta penyimpanan yang tidak sesuai rantai dingin masih menjadi masalah nyata di Indonesia. Pemeriksaan organoleptik manual bersifat subjektif, sedangkan uji laboratorium TVB-N dan mikrobiologi membutuhkan waktu serta biaya yang tidak selalu tersedia bagi rumah tangga dan UMKM.

**FreshMeat AI** hadir sebagai sistem inspeksi cepat (*rapid non-destructive assessment*) yang menganalisis perubahan warna pigmen mioglobin, tekstur permukaan, indikator aroma, dan riwayat suhu untuk menghasilkan skor kesegaran, estimasi TVB-N, klasifikasi kelayakan, serta estimasi masa simpan. Sistem bersifat **pendukung keputusan** dan tidak menggantikan uji laboratorium resmi.

## 2. Arsitektur Sistem

Sistem menggunakan pendekatan **Modular Edge-First Architecture** di dalam **monorepo enterprise**: frontend **React 19 + Vite** dapat menjalankan analisis Canvas lokal sepenuhnya di browser, lalu ditingkatkan dengan backend Python/FastAPI ketika tersedia. Tailwind CSS v4 dan lucide-react digunakan untuk antarmuka. Kode dipisahkan menjadi `apps/` untuk layanan yang berjalan, `packages/` untuk modul domain bersama, `infra/` untuk deployment, dan `docs/` untuk dokumentasi.

1. **Input Acquisition Layer**
   - Unggah citra daging atau tangkapan kamera.
   - Parameter kontekstual: komoditas (sapi, ayam, ikan, kambing), suhu penyimpanan (°C), durasi paparan (jam), kondisi permukaan, dan indikator aroma.
2. **Pre-processing & ROI Extraction**
   - Normalisasi ukuran citra (backend 480 × 360; Canvas lokal 480 × 300) dan konversi ruang warna.
   - Segmentasi jaringan otot dari latar belakang/wadah menggunakan HSV threshold dan operasi morfologi.
   - Fallback ROI area tengah bila mask terlalu kecil.
3. **Feature Extraction & Biomarker Engine**
   - **CIELAB:** L\*, a\*, b\*, chroma, hue angle, rasio diskolorasi, estimasi oksimioglobin.
   - **GLCM:** contrast, homogeneity, energy, correlation (d = 1, arah 0°).
   - **Specular Wetness Index:** proporsi piksel sangat terang dengan saturasi rendah pada ROI.
4. **Decision Fusion & Shelf-Life Estimator**
   - Pembobotan skor warna, tekstur, suhu, dan aroma.
   - Hard override rules untuk mencegah false negative.
   - Estimasi TVB-N dan sisa masa simpan pada suhu ruang, chiller, dan freezer.

### 2.1 Struktur Repositori

```text
freshmeat-ai/
├── .github/workflows/ci.yml
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── api/routes.py
│   │   │   ├── config.py
│   │   │   ├── main.py
│   │   │   └── storage.py
│   │   ├── data/           # dibuat saat runtime (SQLite)
│   │   ├── tests/
│   │   │   ├── conftest.py
│   │   │   └── test_api.py
│   │   └── pyproject.toml
│   └── web/
│       ├── src/
│       │   ├── App.jsx
│       │   ├── components/
│       │   ├── lib/
│       │   ├── main.jsx
│       │   └── index.css
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── dist/           # dibuat oleh `npm run build`
├── packages/
│   ├── core/               # freshmeat-core (vision, scoring, schema)
│   ├── analysis/           # @freshmeat/analysis (analisis lokal JS)
│   └── api-client/         # @freshmeat/api-client
├── infra/
│   ├── docker/
│   └── nginx/
├── docs/
│   ├── ARCHITECTURE.md
│   └── SDD.md
├── .gitignore
├── Makefile
├── package.json
├── package-lock.json
├── pyproject.toml
├── pytest.ini
├── README.md
├── requirements.txt
└── requirements-dev.txt
```

## 3. Aturan Sistem & Logika Penilaian

### 3.1 Rumus Skor Kesegaran Total

```text
S_total = (0.45 × S_warna) + (0.25 × S_tekstur) + (0.20 × S_suhu) + (0.10 × S_aroma)
```

Setiap komponen berada pada rentang 0–100.

- **S_warna:** diturunkan dari estimasi oksimioglobin dan nilai a\* CIELAB (backend) atau rasio kanal merah (mode lokal).
- **S_tekstur:** diturunkan dari specular wetness, homogeneity GLCM, serta kondisi permukaan (`normal`, `wet`, `slimy`).
- **S_suhu:** penalti kinetika termal (pendekatan Q10) berdasarkan suhu dan durasi paparan.
- **S_aroma:** pemetaan indikator aroma (`fresh` = 98, `neutral` = 60, `ammonia` = 5).

### 3.2 Hard Override Rules

**RULE-01 — Deteksi Pembusukan Lanjut:** jika permukaan berlendir, aroma amonia, atau rasio diskolorasi > 18%, skor total dibatasi maksimum 20.

**RULE-02 — Zona Bahaya Termal:** jika suhu ≥ 25 °C dan paparan > 8 jam, skor total dibatasi maksimum 58.

**RULE-03 — Indikasi Daging Gelonggongan:** jika komoditas sapi, permukaan sangat berair atau specular wetness > 38%, dan L\* > 48, skor total dibatasi maksimum 48.

### 3.3 Matriks Klasifikasi Output

| Rentang Skor | Klasifikasi | Estimasi TVB-N | Rekomendasi |
|:---:|:---|:---|:---|
| 80–100 | **SEGAR OPTIMAL (Grade A)** | < 15 mg/100g | Layak konsumsi dan distribusi ritel; pertahankan rantai dingin. |
| 55–79 | **MULAI MENURUN (Grade B)** | 15–28 mg/100g | Wajib segera dimasak matang (suhu internal ≥ 75 °C); jangan dikonsumsi mentah. |
| 0–54 | **TIDAK LAYAK / BUSUK (Reject)** | > 28 mg/100g | Berbahaya. Tolak dari rantai pangan dan pisahkan untuk mencegah kontaminasi silang. |

### 3.4 Estimasi TVB-N

```text
TVB-N (mg/100g) = 4.5 + ((100 - S_total) × 0.38)
```

Nilai ini adalah estimasi indikatif, bukan hasil uji destilasi laboratorium.

## 4. Spesifikasi Data JSON Audit Log

```json
{
  "inspection_id": "FM-20261020-8841",
  "timestamp": "2026-10-20T10:55:00Z",
  "commodity": "beef_sirloin",
  "parameters": {
    "storage_temp_celsius": 4.0,
    "exposure_hours": 2.5,
    "surface_condition": "normal_moist"
  },
  "metrics": {
    "freshness_score": 91,
    "oxymyoglobin_ratio": 0.88,
    "estimated_tvbn_mg100g": 9.4,
    "shelf_life_chiller_hours": 72,
    "shelf_life_freezer_days": 150
  },
  "classification": "GRADE_A_FRESH",
  "warnings": []
}
```

Setiap hasil analisis disimpan ke SQLite (`apps/api/data/freshmeat.db`) melalui `apps/api/app/storage.py`. Lokasi database dapat diatur dengan environment variable `FRESHMEAT_DB_PATH`. Frontend memuat lima riwayat terbaru dari `GET /api/v1/inspections?limit=5` dan tetap mendukung ekspor JSON melalui tombol **Unduh JSON Audit**.

## 5. API Backend

### `POST /api/v1/analyze`

`multipart/form-data`:

| Field | Tipe | Default |
|:---|:---|:---|
| `file` | file gambar | wajib |
| `commodity` | string | `Sapi (Beef Sirloin/Tenderloin)` |
| `storage_temp` | float | `4.0` |
| `exposure_hours` | float | `1.5` |
| `surface_condition` | `normal` / `wet` / `slimy` | `normal` |
| `aroma_condition` | `fresh` / `neutral` / `ammonia` | `fresh` |

Respons utama: `inspection_id`, `cielab_features`, `glcm_features`, `biomarkers`, `scores`, `classification`, `status_label`, `shelf_life`, `triggered_rules`, `recommendation`.

### `GET /api/v1/inspections?limit=20`

Mengembalikan riwayat inspeksi terbaru dari SQLite, terurut dari yang paling baru. Parameter `limit` dibatasi 1–100.

### `GET /health`

Mengembalikan status server dan versi engine.

### Dokumentasi Interaktif

Swagger UI tersedia di `http://localhost:8000/docs`.

## 6. Cara Menjalankan

### Backend

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --app-dir apps/api --reload --host 0.0.0.0 --port 8000
```

### Frontend (React + Vite)

Mode development:

```bash
npm ci
npm run dev
```

Buka `http://localhost:5173`. Vite mem-proxy `/api` ke backend pada port 8000. Jika backend aktif, unggahan foto dianalisis dengan CIELAB + GLCM; jika tidak, sistem memakai fallback Canvas lokal.

Build produksi:

```bash
npm run build
```

Hasil build di `apps/web/dist/` disajikan otomatis oleh backend pada `http://localhost:8000/`. Jika `dist/` belum ada, backend menampilkan instruksi build.

## 7. Pengujian Otomatis

Suite pengujian menggunakan pytest dan FastAPI TestClient. Test domain berada di `packages/core/tests/`, sedangkan test API dan persistensi berada di `apps/api/tests/`:

- **Endpoint:** health check, penyajian frontend React hasil build, validasi unggahan bukan gambar.
- **Klasifikasi:** batas Grade A (≥ 80), Grade B (55–79,9), dan Reject (< 55).
- **Hard override:** RULE-01, RULE-02, RULE-03, termasuk batas nilai agar tidak terpicu dini.
- **Kualitas fitur:** nilai a\* CIELAB, homogeneity GLCM, dan struktur respons API.
- **Persistensi:** hasil analisis tersimpan dan dapat diambil kembali melalui riwayat, termasuk validasi batas `limit`.

Perintah:

```bash
pip install -r requirements-dev.txt
npm ci
npm run build
pytest
```

Workflow GitHub Actions (`.github/workflows/ci.yml`) menjalankan lint Ruff, build React, dan seluruh test pada setiap push/pull request.

## 8. Kepatuhan & Transparansi

- Repositori menggunakan riwayat commit atomik dan pesan yang deskriptif.
- Identitas Git harus menggunakan nama dan email asli anggota tim.
- Penggunaan alat bantu AI, pustaka, dataset, dan referensi eksternal wajib didokumentasikan sesuai aturan lomba/kompetisi yang berlaku. Jangan menyembunyikan atribusi yang diminta panitia.
- Data uji sebaiknya disertai sumber dan izin penggunaan.
- Sistem tidak boleh dipresentasikan sebagai alat diagnosis medis atau pengganti uji laboratorium resmi.

## 9. Batasan & Pengembangan Lanjutan

- Prototipe menggunakan estimasi heuristik, bukan model machine learning terlatih pada dataset mioglobin tersertifikasi.
- Kalibrasi kamera, pencahayaan, dan white balance sangat memengaruhi hasil.
- Pengembangan lanjutan: dataset citra berlabel TVB-N, validasi laboratorium, model regresi terkalibrasi, dukungan kamera real-time, dan integrasi basis data audit.
