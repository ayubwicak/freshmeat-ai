import { Camera, ImagePlus, Info, Loader2 } from 'lucide-react'
import { TONES } from '../lib/tones.js'

export default function ScannerPanel({
  canvasRef,
  metrics,
  result,
  scanning,
  onUpload,
}) {
  const tone = TONES[result.tone] ?? TONES.emerald

  const handleFiles = (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) onUpload(files)
    event.target.value = ''
  }

  const isBackend = Boolean(metrics.backend)
  const redText = isBackend
    ? `a*: ${Number(metrics.redRatio).toFixed(1)}`
    : Number(metrics.redRatio).toFixed(2)
  const oxidationText = isBackend
    ? `${Number(metrics.oxidation).toFixed(1)}%`
    : `${metrics.oxidation}%`
  const moistureText = isBackend
    ? `GLCM: ${Number(metrics.homogeneity).toFixed(2)}`
    : metrics.specularity > 25
      ? 'Tinggi'
      : 'Normal'

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Citra Spesimen</h2>
          <p className="text-xs text-slate-500">Ekstraksi warna CIELAB dan tekstur GLCM</p>
        </div>
        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold',
            scanning
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600',
          ].join(' ')}
          aria-live="polite"
        >
          {scanning ? 'Menganalisis…' : 'Siap'}
        </span>
      </div>

      {/* Aksi utama kamera-first */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          className={[
            'flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors',
            scanning
              ? 'cursor-wait bg-slate-500'
              : 'bg-slate-900 hover:bg-slate-800',
          ].join(' ')}
        >
          {scanning ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="h-5 w-5" aria-hidden="true" />
          )}
          <span>{scanning ? 'Memproses…' : 'Ambil Foto'}</span>
          <input
            type="file"
            id="cameraInput"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFiles}
            disabled={scanning}
          />
        </label>

        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <ImagePlus className="h-5 w-5" aria-hidden="true" />
          <span>Galeri</span>
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={scanning}
          />
        </label>
      </div>

      {/* Tips singkat memotret */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] leading-relaxed text-emerald-900">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>
          Gunakan cahaya terang, jarak 15–20 cm, dan pastikan permukaan daging
          memenuhi area kotak. Pilih Galeri untuk memproses beberapa foto sekaligus.
        </p>
      </div>

      {/* Viewport Canvas harus selalu ter-mount untuk analisis lokal */}
      <div className="mt-4">
        <div className="relative overflow-hidden rounded-xl bg-slate-950">
          <canvas
            id="meatCanvas"
            ref={canvasRef}
            width={480}
            height={300}
            className="block h-auto w-full"
          />

          <div id="scannerLine" className={`scanner-line ${scanning ? 'active' : ''}`} />

          <div
            id="roiBox"
            className="roi-box"
            style={{
              top: '18%',
              left: '16%',
              width: '68%',
              height: '64%',
              borderColor: tone.roiColor,
            }}
          >
            <span
              id="roiLabel"
              className="absolute -top-6 left-0 rounded bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] text-white"
            >
              Area ROI
            </span>
          </div>
        </div>

        {/* Metrik ringkas 3 kolom */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 sm:p-3">
            <div className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">
              {isBackend ? 'CIELAB a*' : 'Rasio Merah'}
            </div>
            <div
              id="metricRedRatio"
              className="mt-0.5 truncate text-sm font-bold tabular-nums text-slate-900 sm:text-xl"
            >
              {redText}
            </div>
            <div className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
              {isBackend ? 'Pigmen mioglobin' : 'Kerapatan rona merah'}
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 sm:p-3">
            <div className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">
              {isBackend ? 'Diskolorasi' : 'Oksidasi'}
            </div>
            <div
              id="metricOxidation"
              className="mt-0.5 truncate text-sm font-bold tabular-nums text-slate-900 sm:text-xl"
            >
              {oxidationText}
            </div>
            <div className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
              Akumulasi metmyoglobin
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 sm:p-3">
            <div className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">
              {isBackend ? 'Homogenitas' : 'Kelembapan'}
            </div>
            <div
              id="metricMoisture"
              className="mt-0.5 truncate text-sm font-bold tabular-nums text-slate-900 sm:text-xl"
            >
              {moistureText}
            </div>
            <div className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
              {isBackend ? 'Keteraturan serat' : `Pantulan ${metrics.specularity}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
