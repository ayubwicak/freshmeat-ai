import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import AppBar from './components/AppBar.jsx'
import AuditTable from './components/AuditTable.jsx'
import BatchPanel from './components/BatchPanel.jsx'
import BottomNav, { TABS } from './components/BottomNav.jsx'
import DiagnosisPanel from './components/DiagnosisPanel.jsx'
import ParameterPanel from './components/ParameterPanel.jsx'
import PresetBar from './components/PresetBar.jsx'
import ScannerPanel from './components/ScannerPanel.jsx'
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
    className: 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300',
    iconClass: 'bg-emerald-100 text-emerald-700',
    titleClass: 'text-emerald-800',
  },
  {
    label: 'Grade B (Sub-Fresh)',
    range: 'Skor Mutu 55–79,9',
    description: 'Terjadi degradasi mutu awal atau mendekati batas masa simpan. Butuh penanganan cold-chain segera.',
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50/70 hover:border-amber-300',
    iconClass: 'bg-amber-100 text-amber-700',
    titleClass: 'text-amber-800',
  },
  {
    label: 'Reject (Afkir/Busuk)',
    range: 'Skor Mutu < 55',
    description: 'Tidak layak konsumsi. Terdeteksi TVB-N tinggi, lendir lengket, dekomposisi atau indikasi gelonggongan.',
    icon: XCircle,
    className: 'border-rose-200 bg-rose-50/70 hover:border-rose-300',
    iconClass: 'bg-rose-100 text-rose-700',
    titleClass: 'text-rose-800',
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
  const [activeTab, setActiveTab] = useState('periksa')
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
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

  const notify = useCallback((message, tone = 'info') => {
    setToast({ message, tone })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [],
  )

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      notify('Kembali online · sinkronisasi server tersedia.')
    }
    const handleOffline = () => {
      setOnline(false)
      notify('Anda offline · analisis lokal tetap dapat dipakai.', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [notify])

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
      setActiveTab('hasil')
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
      notify('File gambar tidak dapat dibaca. Gunakan format JPG/PNG yang valid.', 'error')
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
      if (!keepScanning) setActiveTab('hasil')
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
      notify(
        'Backend tidak aktif · hasil lokal ditampilkan, belum tersimpan ke SQLite.',
        'warning',
      )
      if (!keepScanning) setActiveTab('hasil')
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
    setActiveTab('riwayat')
    notify(
      `${selected.length} foto selesai diproses${
        activeBatch ? ` di ${activeBatch.name}` : ''
      }.`,
    )
  }

  const handlePrint = () => {
    const outcome = printCertificate(result, auditLogs)
    if (!outcome.ok) notify(outcome.message, 'warning')
  }
  const handleExport = () => exportAuditJson(auditLogs)
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <div className="min-h-screen text-slate-800">
      <AppBar
        title={activeTabMeta.title}
        engineMode={engineMode}
        online={online}
      />

      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:px-6">
        {/* Tab Periksa: kamera dan parameter tetap ter-mount agar canvasRef selalu tersedia. */}
        <section
          id="tab-periksa"
          role="tabpanel"
          aria-label="Periksa sampel"
          className={activeTab === 'periksa' ? 'space-y-4 pt-4' : 'hidden'}
        >
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Pemeriksaan Mutu Daging
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Ambil foto sampel, lalu sistem menghitung CIELAB, GLCM, dan estimasi TVB-N.
            </p>
          </div>

          <ScannerPanel
            canvasRef={canvasRef}
            metrics={metrics}
            result={result}
            scanning={scanning}
            onUpload={handleUpload}
          />

          <PresetBar onSelect={selectPreset} activePreset={activePreset} />

          <div id="parameter">
            <ParameterPanel
              batch={activeBatch}
              form={form}
              scanning={scanning}
              onChange={updateForm}
              onScan={handleScan}
            />
          </div>
        </section>

        <section
          id="tab-hasil"
          role="tabpanel"
          aria-label="Hasil analisis"
          className={activeTab === 'hasil' ? 'space-y-4 pt-4' : 'hidden'}
        >
          <DiagnosisPanel result={result} />
          <button
            type="button"
            onClick={() => setActiveTab('periksa')}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Periksa Sampel Lain
          </button>
        </section>

        <section
          id="tab-riwayat"
          role="tabpanel"
          aria-label="Riwayat inspeksi"
          className={activeTab === 'riwayat' ? 'space-y-4 pt-4' : 'hidden'}
        >
          <AuditTable logs={auditLogs} onExport={handleExport} onPrint={handlePrint} />
        </section>

        <section
          id="tab-batch"
          role="tabpanel"
          aria-label="Batch daging"
          className={activeTab === 'batch' ? 'space-y-4 pt-4' : 'hidden'}
        >
          <BatchPanel
            batches={batches}
            activeBatch={activeBatch}
            defaultCommodity={form.commodity}
            onSelect={handleSelectBatch}
            onCreate={handleCreateBatch}
          />
        </section>

        <section
          id="tab-info"
          role="tabpanel"
          aria-label="Informasi aplikasi"
          className={activeTab === 'info' ? 'space-y-4 pt-4' : 'hidden'}
        >
          <div className="glass-card p-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Standar Klasifikasi Mutu Daging
              </h2>
              <p className="text-xs text-slate-500">
                Pedoman acuan mutu berdasarkan indeks kesegaran komposit (0–100)
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {STANDARDS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5"
                >
                  <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-0.5 font-mono text-xs font-bold text-slate-700">{item.range}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <footer className="border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-400">
              FreshMeat AI — Sistem Uji Cepat Mutu Daging
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Hasil bersifat estimasi pendukung keputusan, bukan pengganti uji laboratorium.
            </p>
          </footer>
        </section>
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-lg border bg-white p-3 text-xs shadow-lg sm:inset-x-auto sm:right-6',
            toast.tone === 'error'
              ? 'border-rose-200'
              : toast.tone === 'warning'
                ? 'border-amber-200'
                : 'border-slate-200',
          ].join(' ')}
        >
          <div
            className={[
              'font-semibold',
              toast.tone === 'error'
                ? 'text-rose-800'
                : toast.tone === 'warning'
                  ? 'text-amber-800'
                  : 'text-slate-900',
            ].join(' ')}
          >
            {toast.tone === 'error'
              ? 'Gagal'
              : toast.tone === 'warning'
                ? 'Perhatian'
                : 'Notifikasi'}
          </div>
          <div className="mt-0.5 text-slate-600">{toast.message}</div>
        </div>
      )}
    </div>
  )
}
