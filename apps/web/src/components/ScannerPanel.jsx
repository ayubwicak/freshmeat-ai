import { Camera, Crosshair, Eye, Sparkles, Upload, Waves, Zap } from 'lucide-react'
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
    : `${metrics.specularity > 38 ? 'Tinggi' : 'Normal'} (${metrics.specularity}%)`

  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      {/* Header bar */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Eye className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Citra Spesimen &amp; Analisis ROI
                </h2>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-700">
                  CV-2D
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Segmentasi jaringan otot otomatis dan ekstraksi fitur warna CIELAB + tekstur GLCM
              </p>
            </div>
          </div>

          {/* Quick upload & camera actions */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
              <Camera className="h-4 w-4 text-emerald-600 transition group-hover:scale-110" aria-hidden="true" />
              <span>Kamera</span>
              <input
                type="file"
                id="cameraInput"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFiles}
              />
            </label>
            <label className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.98]">
              <Upload className="h-4 w-4 transition group-hover:-translate-y-0.5" aria-hidden="true" />
              <span>Unggah Foto</span>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Viewport Canvas & HUD */}
      <div className="p-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#070d17] shadow-xl">
          <canvas
            id="meatCanvas"
            ref={canvasRef}
            width={480}
            height={300}
            className="block h-auto w-full transition-opacity duration-300"
          />

          {/* Laser scanning beam */}
          <div id="scannerLine" className={`scanner-line ${scanning ? 'active' : ''}`} />

          {/* ROI Box with target corners */}
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
            {/* Corner reticles */}
            <span className="absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2" style={{ borderColor: tone.roiColor }} />
            <span className="absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2" style={{ borderColor: tone.roiColor }} />
            <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2" style={{ borderColor: tone.roiColor }} />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2" style={{ borderColor: tone.roiColor }} />

            <span
              id="roiLabel"
              className={`absolute -top-7 left-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-extrabold ${tone.roiLabel}`}
            >
              ROI: MUSCLE TISSUE
            </span>
          </div>

          {/* Top HUD overlay elements */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/70 via-black/20 to-transparent">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-300">
                  {scanning ? 'SCANNING...' : 'LIVE FEED'}
                </span>
              </div>
              <span className="hidden font-mono text-[10px] text-slate-300 sm:inline-block">
                SPECTRAL-OPTIC 60FPS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md border border-white/15 bg-black/60 px-2 py-0.5 font-mono text-[9px] text-slate-200 backdrop-blur-md">
                480 × 300 PX
              </span>
            </div>
          </div>

          {/* Bottom HUD overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-slate-400 font-mono">
            <span className="hidden sm:inline">MATRIX 32-BIT CIELAB</span>
            <span className="text-right">CALIBRATION: D65/10°</span>
          </div>
        </div>

        {/* Live Telemetry Sensor Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Card 1: Rasio Merah / CIELAB a* */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 transition hover:border-rose-300 hover:bg-rose-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isBackend ? 'CIELAB a* (Red Chroma)' : 'Rasio Merah (R/G)'}
              </span>
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            </div>
            <div
              id="metricRedRatio"
              className="mt-1.5 text-2xl font-black tabular-nums text-rose-600"
            >
              {redText}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              {isBackend ? 'Nilai a* tinggi menandakan mioglobin segar' : 'Kerapatan rona merah jaringan'}
            </p>
          </div>

          {/* Card 2: Diskolorasi / Oksidasi */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 transition hover:border-amber-300 hover:bg-amber-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isBackend ? 'Diskolorasi Cokelat' : 'Indeks Oksidasi'}
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <div
              id="metricOxidation"
              className="mt-1.5 text-2xl font-black tabular-nums text-amber-600"
            >
              {oxidationText}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Akumulasi metmyoglobin pada permukaan
            </p>
          </div>

          {/* Card 3: Tekstur / Homogenitas / Kilap Air */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/30">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Waves className="h-3.5 w-3.5 text-cyan-600" aria-hidden="true" />
                {isBackend ? 'Tekstur Homogenitas' : 'Kilap Air Permukaan'}
              </span>
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
            </div>
            <div
              id="metricMoisture"
              className="mt-1.5 text-2xl font-black tabular-nums text-cyan-600"
            >
              {moistureText}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              {isBackend ? 'Keteraturan serat matriks GLCM' : 'Indikator pantulan spekular'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
