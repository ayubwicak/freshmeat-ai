import { Camera, Upload } from 'lucide-react'
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
    : `${metrics.specularity > 25 ? 'Tinggi' : 'Normal'} (${metrics.specularity}%)`

  return (
    <div className="glass-card p-5">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Citra Spesimen &amp; Analisis Visual
          </h2>
          <p className="text-xs text-slate-500">
            Ekstraksi fitur warna CIELAB dan tekstur permukaan
          </p>
        </div>

        {/* Quick upload & camera actions */}
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
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
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
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

      {/* Viewport Canvas */}
      <div className="mt-4">
        <div className="relative overflow-hidden rounded-lg bg-slate-950">
          <canvas
            id="meatCanvas"
            ref={canvasRef}
            width={480}
            height={300}
            className="block h-auto w-full"
          />

          {/* Laser scanning beam */}
          <div id="scannerLine" className={`scanner-line ${scanning ? 'active' : ''}`} />

          {/* Functional ROI Box */}
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

        {/* Live Telemetry Sensor Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="text-[11px] font-medium text-slate-500">
              {isBackend ? 'CIELAB a* (Red Chroma)' : 'Rasio Warna Merah'}
            </div>
            <div id="metricRedRatio" className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {redText}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              {isBackend ? 'Indikator pigmen mioglobin' : 'Kerapatan rona merah'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="text-[11px] font-medium text-slate-500">
              {isBackend ? 'Diskolorasi Cokelat' : 'Indeks Oksidasi'}
            </div>
            <div id="metricOxidation" className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {oxidationText}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              Akumulasi metmyoglobin
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="text-[11px] font-medium text-slate-500">
              {isBackend ? 'Homogenitas GLCM' : 'Kelembapan Permukaan'}
            </div>
            <div id="metricMoisture" className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {moistureText}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              {isBackend ? 'Keteraturan serat jaringan' : 'Pantulan spekular'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
