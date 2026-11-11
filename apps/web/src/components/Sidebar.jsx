import { useEffect, useState } from 'react'
import {
  Cpu,
  FlaskConical,
  History,
  Layers3,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'pemeriksaan', label: 'Pemeriksaan Cepat', icon: ScanLine },
  { id: 'batch', label: 'Batch Kedatangan', icon: Layers3 },
  { id: 'riwayat', label: 'Riwayat Sampel', icon: History },
  { id: 'parameter', label: 'Pengaturan Analisis', icon: SlidersHorizontal },
  { id: 'standar', label: 'Standar Mutu', icon: ShieldCheck },
]

export default function Sidebar({ open, onClose, engineMode }) {
  const [active, setActive] = useState('pemeriksaan')
  const isFastApi = engineMode.includes('FastAPI')

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const navigate = (id) => {
    setActive(id)
    onClose()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navigasi utama"
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20">
              <FlaskConical className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[17px] font-black tracking-tight text-slate-900">
                FreshMeat <span className="text-emerald-600">AI</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Quality Intelligence
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Menu Utama
          </div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-all',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2">
              <span
                className={`relative flex h-2 w-2 ${
                  isFastApi ? 'text-emerald-600' : 'text-amber-500'
                }`}
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-800">
                {isFastApi ? 'FastAPI Connected' : 'Local Canvas Mode'}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {isFastApi
                ? 'Analisis CIELAB + GLCM otomatis via server FastAPI & tersimpan di database SQLite.'
                : 'Analisis piksel berjalan via Canvas lokal di browser.'}
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Cpu className="h-3.5 w-3.5 text-teal-600" />
              Vision Engine
            </div>
            <div className="mt-1 text-[12px] font-bold text-slate-800">
              {isFastApi ? 'OpenCV CIELAB + GLCM' : 'Canvas Specimen Analyzer'}
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">v1.0.0 · Dual Engine</div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 px-6 py-4">
          <p className="text-[10px] leading-relaxed text-slate-400">
            Sistem pendukung keputusan uji mutu pangan standar SNI / ISO.
          </p>
        </div>
      </aside>
    </>
  )
}
