import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import AuditTable from './components/AuditTable.jsx'
import BatchPanel from './components/BatchPanel.jsx'
import DiagnosisPanel from './components/DiagnosisPanel.jsx'
import Header from './components/Header.jsx'
import ParameterPanel from './components/ParameterPanel.jsx'
import PresetBar from './components/PresetBar.jsx'
import ScannerPanel from './components/ScannerPanel.jsx'
import Sidebar from './components/Sidebar.jsx'
import { analyzeImage, createBatch, fetchBatches, fetchHistory } from './lib/api.js'
import {
  DEFAULT_METRICS,
  INITIAL_FORM,
  PRESETS,
  analyzeCanvasPixels,
  computeLocalResult,
  drawImageCover,
  drawMeatSample,
  fromHistoryRecord,
  mapBackendResult,
  toAuditRecord,
} from '@freshmeat/analysis'
import { exportAuditJson, printCertificate } from './lib/report.js'

const STANDARDS = [
  {
    label: 'Grade A (Prima)',
    range: 'Skor Mutu ≥ 80',
    description: 'Kondisi kesegaran optimal, jaringan otot kenyal, pigmen mioglobin stabil. Layak edar & konsumsi prima.',
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-500/[0.08] hover:border-emerald-500/50',
    iconClass: 'bg-emerald-500/20 text-emerald-300',
    titleClass: 'text-emerald-300',
  },
  {
    label: 'Grade B (Sub-Fresh)',
    range: 'Skor Mutu 55–79,9',
    description: 'Terjadi degradasi mutu awal atau mendekati batas masa simpan. Butuh penanganan cold-chain segera.',
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/[0.08] hover:border-amber-500/50',
    iconClass: 'bg-amber-500/20 text-amber-300',
    titleClass: 'text-amber-300',
  },
  {
    label: 'Reject (Afkir/Busuk)',
    range: 'Skor Mutu < 55',
    description: 'Tidak layak konsumsi. Terdeteksi TVB-N tinggi, lendir lengket, dekomposisi atau indikasi gelonggongan.',
    icon: XCircle,
    className: 'border-rose-500/30 bg-rose-500/[0.08] hover:border-rose-500/50',
    iconClass: 'bg-rose-500/20 text-rose-300',
    titleClass: 'text-rose-300',
  },
]

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca file gambar'))
    }
    image.src = url
  })
}

export default function App() {
  const canvasRef = useRef(null)
  const scanTimer = useRef(null)
  const requestSeq = useRef(0)
  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [metrics, setMetrics] = useState(DEFAULT_METRICS)
  const [backendResult, setBackendResult] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [engineMode, setEngineMode] = useState('Lokal Canvas')
  const [scanning, setScanning] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [activePreset, setActivePreset] = useState('fresh_beef')
  const [batches, setBatches] = useState([])
  const [activeBatch, setActiveBatch] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const localResult = useMemo(
    () => computeLocalResult(form, metrics),
    [form, metrics],
  )
  const result = backendResult ?? localResult
  const resultRef = useRef(result)

  useEffect(() => {
    resultRef.current = result
  }, [result])

  const notify = useCallback((message) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [],
  )

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = navOpen ? 'hidden' : original
    return () => {
      document.body.style.overflow = original
    }
  }, [navOpen])

  const refreshHistory = useCallback(async () => {
    try {
      const data = await fetchHistory(10)
      if (!Array.isArray(data)) throw new Error('Format riwayat tidak valid')
      setAuditLogs(data.map(fromHistoryRecord))
      return true
    } catch (error) {
      console.warn('Riwayat audit backend tidak tersedia.', error)
      return false
    }
  }, [])

  const refreshBatches = useCallback(async () => {
    try {
      const data = await fetchBatches(30)
      if (!Array.isArray(data)) throw new Error('Format batch tidak valid')
      setBatches(data)
      setActiveBatch((previous) =>
        previous
          ? data.find((item) => item.batch_id === previous.batch_id) ?? null
          : null,
      )
      return true
    } catch (error) {
      console.warn('Daftar batch backend tidak tersedia.', error)
      return false
    }
  }, [])

  const appendLog = useCallback((entry) => {
    const record = toAuditRecord(entry)
    setAuditLogs((previous) =>
      [record, ...previous.filter((item) => item.id !== record.id)].slice(0, 5),
    )
  }, [])

  const clearScanTimer = useCallback(() => {
    if (scanTimer.current) {
      window.clearTimeout(scanTimer.current)
      scanTimer.current = null
    }
  }, [])

  const scanAndLog = useCallback(() => {
    setScanning(true)
    clearScanTimer()
    scanTimer.current = window.setTimeout(() => {
      setScanning(false)
      appendLog(resultRef.current)
      notify('Skenario demo dimuat · rekaman lokal masuk riwayat sesi.')
      scanTimer.current = null
    }, 900)
  }, [appendLog, clearScanTimer, notify])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    setMetrics(drawMeatSample(ctx, canvas, 'fresh_beef'))
    refreshHistory()
    refreshBatches()
  }, [refreshHistory, refreshBatches])

  useEffect(() => () => clearScanTimer(), [clearScanTimer])

  const updateForm = (patch) => {
    requestSeq.current += 1
    setForm((previous) => ({ ...previous, ...patch }))
    setBackendResult(null)
    setEngineMode('Lokal Canvas')
    setActivePreset(null)
  }

  const selectPreset = (key) => {
    const preset = PRESETS.find((item) => item.key === key)
    if (!preset) return

    requestSeq.current += 1
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const nextMetrics = drawMeatSample(ctx, canvas, key)
    setForm({ ...preset.form })
    setMetrics(nextMetrics)
    setBackendResult(null)
    setEngineMode('Lokal Canvas')
    setActivePreset(key)
    scanAndLog()
  }

  const handleCreateBatch = async ({ name, commodity }) => {
    const batch = await createBatch({ name, commodity })
    setBatches((previous) => [
      batch,
      ...previous.filter((item) => item.batch_id !== batch.batch_id),
    ])
    setActiveBatch(batch)
    setForm((previous) => ({ ...previous, commodity }))
    setActivePreset(null)
    notify(`Batch "${batch.name}" dibuat · unggah foto sampel untuk batch ini.`)
    return batch
  }

  const handleSelectBatch = (batchId) => {
    if (!batchId) {
      setActiveBatch(null)
      notify('Mode tanpa batch · hasil berikutnya tidak dikelompokkan.')
      return
    }
    const batch = batches.find((item) => item.batch_id === batchId)
    if (!batch) return
    setActiveBatch(batch)
    setForm((previous) => ({ ...previous, commodity: batch.commodity }))
    setActivePreset(null)
    notify(`Batch aktif: ${batch.name}`)
  }

  const handleScan = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], 'rescan.jpg', { type: 'image/jpeg' })
        handleFile(file)
      },
      'image/jpeg',
      0.92,
    )
  }

  const handleFile = async (file, { keepScanning = false } = {}) => {
    const uploadId = requestSeq.current + 1
    requestSeq.current = uploadId
    const batchAtUpload = activeBatch
    clearScanTimer()
    setActivePreset(null)

    let image
    try {
      image = await loadImage(file)
    } catch (error) {
      console.warn('Gagal membaca gambar:', error)
      window.alert('File gambar tidak dapat dibaca. Gunakan format JPG/PNG yang valid.')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawImageCover(ctx, canvas, image)
    const nextMetrics = analyzeCanvasPixels(ctx, canvas)

    setMetrics(nextMetrics)
    setBackendResult(null)
    setEngineMode('Lokal Canvas')
    setScanning(true)

    try {
      const data = await analyzeImage(file, form, batchAtUpload?.batch_id ?? null)
      if (uploadId !== requestSeq.current) return

      const mapped = mapBackendResult(data)
      setMetrics({
        redRatio: data.cielab_features.a_star,
        specularity: data.glcm_features.specularity_wetness_pct,
        oxidation: data.cielab_features.discoloration_ratio_pct,
        visualScore: data.scores.color_score,
        lightness: data.cielab_features.L_star,
        homogeneity: data.glcm_features.homogeneity,
        backend: true,
      })
      setBackendResult(mapped)
      setEngineMode('FastAPI CIELAB + GLCM')

      const historyLoaded = await refreshHistory()
      if (!historyLoaded) appendLog(mapped)
      await refreshBatches()
      notify(
        batchAtUpload
          ? `Analisis FastAPI selesai · tersimpan di ${batchAtUpload.name}.`
          : 'Analisis FastAPI selesai · ID batch baru tersimpan di riwayat.',
      )
      console.log('Hasil audit FastAPI (CIELAB + GLCM):', data)
    } catch (error) {
      if (uploadId !== requestSeq.current) return
      console.warn(
        'Backend FastAPI tidak aktif, menggunakan fallback Canvas lokal.',
        error,
      )
      setEngineMode('Lokal Canvas')
      appendLog({
        ...computeLocalResult(form, nextMetrics),
        batchId: batchAtUpload?.batch_id ?? null,
        batchName: batchAtUpload?.name ?? null,
      })
      notify('Backend tidak aktif · hasil lokal ditampilkan, belum tersimpan ke SQLite.')
    } finally {
      if (!keepScanning && uploadId === requestSeq.current) setScanning(false)
    }
  }

  const handleUpload = async (files) => {
    const selected = (Array.isArray(files) ? files : [files]).filter(Boolean)
    if (selected.length === 0) return
    if (selected.length === 1) {
      await handleFile(selected[0])
      return
    }

    setScanning(true)
    for (const file of selected) {
      await handleFile(file, { keepScanning: true })
    }
    setScanning(false)
    notify(
      `${selected.length} foto selesai diproses${
        activeBatch ? ` di ${activeBatch.name}` : ''
      }.`,
    )
  }

  const handlePrint = () => printCertificate(result, auditLogs)
  const handleExport = () => exportAuditJson(auditLogs)

  return (
    <div className="min-h-screen text-slate-100">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        engineMode={engineMode}
      />

      <div className="relative min-h-screen lg:pl-72">
        <Header
          engineMode={engineMode}
          onOpenMenu={() => setNavOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1520px] px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          {/* Hero Header Section */}
          <section id="pemeriksaan" className="scroll-mt-24">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Sistem Inspeksi Mutu Aktif
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[40px] leading-[1.1]">
                  Pemeriksaan Mutu Daging &amp; Keamanan Pangan
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                  Platform computer vision berbasis ekstraksi ruang warna CIELAB, tekstur GLCM, estimasi biomarker TVB-N terintegrasi, dan rule engine kepatuhan standar mutu pangan.
                </p>
              </div>

              {/* Quick Spec Tags */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-400">
                <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-md">
                  CIELAB L*a*b*
                </span>
                <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-md">
                  GLCM Matrix
                </span>
                <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-md">
                  Arrhenius Shelf-Life
                </span>
              </div>
            </div>
          </section>

          <BatchPanel
            batches={batches}
            activeBatch={activeBatch}
            defaultCommodity={form.commodity}
            onSelect={handleSelectBatch}
            onCreate={handleCreateBatch}
          />

          <PresetBar onSelect={selectPreset} activePreset={activePreset} />

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="min-w-0 space-y-6">
              <ScannerPanel
                canvasRef={canvasRef}
                metrics={metrics}
                result={result}
                scanning={scanning}
                onUpload={handleUpload}
              />
              <div id="parameter" className="scroll-mt-24">
                <ParameterPanel
                  batch={activeBatch}
                  form={form}
                  scanning={scanning}
                  onChange={updateForm}
                  onScan={handleScan}
                />
              </div>
            </div>

            <div className="min-w-0 space-y-6">
              <DiagnosisPanel result={result} />
              <div id="riwayat" className="scroll-mt-24">
                <AuditTable logs={auditLogs} onExport={handleExport} onPrint={handlePrint} />
              </div>
            </div>
          </div>

          {/* Quality Standards Reference Section */}
          <section id="standar" className="mt-8 scroll-mt-24">
            <div className="glass-card rounded-3xl p-6 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
                    <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white sm:text-lg">
                      Ambang Batas &amp; Standar Mutu Keamanan Pangan
                    </h2>
                    <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-400">
                      Klasifikasi keputusan berdasarkan skor indeks kesegaran komposit 0–100 dan aturan hard-override keamanan pangan.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {['CIELAB', 'GLCM TEXTURE', 'TVB-N KINETICS', 'RULE ENGINE'].map((method) => (
                    <span
                      key={method}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-bold text-slate-300"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {STANDARDS.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${item.className}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold ${item.titleClass}`}>
                          {item.label}
                        </span>
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.iconClass}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-xs font-bold text-slate-200">
                        {item.range}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-white/[0.06] pt-6 text-center">
            <p className="mx-auto max-w-3xl text-[11px] leading-relaxed text-slate-500">
              FreshMeat AI adalah sistem prototipe kecerdasan mutu pangan. Hasil estimasi tidak menggantikan uji laboratorium mikrobiologi dan kimiawi resmi SNI / ISO.
            </p>
          </footer>
        </main>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-[#07101c]/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-xl lg:left-auto lg:right-8 lg:translate-x-0"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Notifikasi Sistem
              </div>
              <div className="mt-0.5 text-xs leading-relaxed text-slate-200">{toast}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
