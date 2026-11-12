# Aplikasi Mobile & PWA

FreshMeat AI memakai antarmuka mobile-first dengan lima tab: **Periksa**, **Hasil**,
**Riwayat**, **Batch**, dan **Info**. Build produksi dapat dipasang sebagai PWA
(Progressive Web App) di Android/iOS, atau dibungkus menjadi APK dengan Capacitor.

## 1. Wajib HTTPS

Service worker, instalasi PWA, dan perilaku kamera yang konsisten memerlukan
**secure context**. `http://localhost` dikecualikan, tetapi pengecualian itu hanya
berlaku di komputer yang sama, bukan di HP.

Untuk menguji dari HP, jalankan aplikasi lalu buat tunnel HTTPS:

```bash
# Terminal 1: build frontend dan jalankan API
npm ci
npm run build
uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000

# Terminal 2: tunnel HTTPS (pilih salah satu)
cloudflared tunnel --url http://localhost:8000
# atau
ngrok http 8000
```

Buka URL HTTPS yang dicetak tunnel (mis. `https://xxxx.trycloudflare.com`) dari
browser HP. Frontend dan API berada di origin yang sama, jadi `VITE_API_BASE`
tidak perlu diisi.

Jika ingin memakai Vite dev server:

```bash
npm run dev -- --host 0.0.0.0
cloudflared tunnel --url http://localhost:5173
```

Vite mem-proxy `/api` ke `http://127.0.0.1:8000`. Service worker **tidak**
didaftarkan pada mode dev, sehingga uji offline dan instalasi PWA harus memakai
build produksi yang disajikan FastAPI (atau Nginx).

## 2. Memasang PWA

### Android (Chrome)

1. Buka aplikasi melalui HTTPS.
2. Tunggu service worker aktif, lalu buka menu Chrome.
3. Pilih **Install app** / **Tambahkan ke layar utama**.
4. Alternatif: buka tab **Info** dan tekan **Pasang FreshMeat AI** jika tombol
   `beforeinstallprompt` tersedia.

### iOS (Safari)

1. Buka aplikasi melalui HTTPS di Safari.
2. Ketuk tombol **Bagikan**.
3. Pilih **Tambah ke Layar Utama**, lalu ketuk **Tambah**.

Petunjuk yang sama juga muncul di kartu **Pasang Aplikasi** pada tab Info.
Chrome di iOS tidak mendukung instalasi PWA; gunakan Safari.

## 3. Perilaku Offline

`apps/web/public/sw.js` menyimpan app shell:

- Navigasi: **network-first**, fallback ke `/`.
- Aset statis: **stale-while-revalidate**.
- `/api/*`, `/health`, dan `/docs` **tidak pernah** di-cache.

Saat offline, shell tetap terbuka dan AppBar menampilkan badge **Offline**.
Analisis foto tetap memakai fallback Canvas lokal; hasilnya belum tersimpan ke
SQLite sampai backend tersedia kembali.

Uji cepat:

1. Buka aplikasi online, pastikan service worker terdaftar di
   DevTools → Application → Service Workers.
2. DevTools → Network → **Offline**.
3. Reload halaman. Shell harus tetap tampil dan badge Offline muncul.

### Menaikkan versi cache

Setiap kali aset shell berubah (HTML, JS/CSS hasil build, ikon, atau manifest),
naikkan versi cache di `apps/web/public/sw.js`:

```js
const CACHE = 'freshmeat-shell-v2'
```

Lalu build dan deploy ulang. Cache lama dihapus otomatis pada event `activate`.
Jika perangkat masih memakai versi lama, tutup semua tab aplikasi lalu buka
kembali; pada DevTools dapat juga memakai **Unregister** service worker.

## 4. Jaringan Seluler

- Foto dikompresi di browser sebelum upload: sisi terpanjang maksimal **1280 px**,
  JPEG kualitas **0.88** (`apps/web/src/lib/image.js`).
- Backend tetap me-resize ke 480×360, sehingga hasil analisis tidak berubah.
- Timeout `analyzeImage` adalah **20 detik**. Jika backend gagal atau lambat,
  aplikasi menampilkan notifikasi dan memakai analisis Canvas lokal.

## 5. Konfigurasi API dan CORS

| Variabel | Dipakai di | Keterangan |
|:---|:---|:---|
| `VITE_API_BASE` | build frontend | Base URL API, mis. `https://api.contoh.com`. Kosongkan untuk same-origin. |
| `FRESHMEAT_CORS_ORIGINS` | backend | Daftar origin dipisahkan koma, mis. `https://app.contoh.com,https://localhost`. |

Contoh build dengan API terpisah:

```bash
VITE_API_BASE=https://api.contoh.com npm run build
FRESHMEAT_CORS_ORIGINS=https://app.contoh.com uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000
```

## 6. Membungkus Menjadi APK dengan Capacitor

Capacitor **tidak** ditambahkan sebagai dependensi proyek ini secara default.
Langkah berikut menambahkan dependensi hanya di mesin/CI yang membangun APK.

```bash
# 1. Tambahkan Capacitor (jalankan dari root repo)
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inisialisasi proyek native
npx cap init "FreshMeat AI" com.freshmeat.ai --web-dir apps/web/dist

# 3. Tambahkan platform Android
npx cap add android

# 4. Build web dengan API publik, lalu sinkronkan ke Android
VITE_API_BASE=https://api.contoh.com npm run build
npx cap sync android

# 5. Buka Android Studio atau build APK debug langsung
npx cap open android
# alternatif CLI:
cd android && ./gradlew assembleDebug
```

APK debug dihasilkan di
`android/app/build/outputs/apk/debug/app-debug.apk`.

Catatan penting:

- WebView Android memakai origin `https://localhost`. Karena itu API harus
  memakai URL absolut lewat `VITE_API_BASE`; path same-origin `/api/...` tidak
  tersedia di dalam APK.
- Izinkan origin WebView di backend:
  `FRESHMEAT_CORS_ORIGINS=https://localhost,capacitor://localhost`.
- Gunakan sertifikat HTTPS yang valid. WebView menolak sertifikat self-signed
  kecuali konfigurasi keamanan Android sengaja dilonggarkan (tidak disarankan).
- Setelah setiap perubahan frontend, ulangi `npm run build` dan
  `npx cap sync android`.
- `<input type="file" capture="environment">` biasanya membuka kamera sistem
  lewat WebView. Jika perangkat/OEM membatasi pemilih file, pertimbangkan plugin
  `@capacitor/camera` (dependensi tambahan) dan uji langsung di perangkat.
- Folder `android/` dan `ios/` adalah proyek native hasil generate. Jangan
  mencampurnya dengan build web di `apps/web/dist`; `dist` tetap tidak di-commit.

## 7. Checklist Verifikasi

- [ ] `npm run build` berhasil.
- [ ] `.venv/bin/pytest` berhasil, termasuk tes manifest, service worker, dan ikon.
- [ ] `.venv/bin/ruff check .` dan `.venv/bin/ruff format --check .` berhasil.
- [ ] Viewport 390×844: tidak ada scroll horizontal dan bottom nav tidak
      menutupi konten.
- [ ] Ambil Foto / Galeri memicu analisis dan berpindah ke tab Hasil.
- [ ] Unggah beberapa foto berpindah ke tab Riwayat dan tampil sebagai kartu.
- [ ] Manifest valid dan service worker terdaftar di build produksi.
- [ ] Mode offline: shell terbuka dan badge Offline muncul.
- [ ] Instalasi PWA diuji di Android Chrome dan iOS Safari asli.
