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
          'fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/[0.08] bg-[#070d17]/95 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navigasi utama"
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/25">
              <FlaskConical className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[16px] font-extrabold tracking-tight text-white">
                FreshMeat <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                Quality Intelligence
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
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
                      ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent text-emerald-300 ring-1 ring-inset ring-emerald-500/30 font-semibold shadow-sm shadow-emerald-950/40'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-white/[0.03] text-slate-400 group-hover:text-slate-200 group-hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.8)]" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span
                className={`relative flex h-2 w-2 ${
                  isFastApi ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200">
                {isFastApi ? 'FastAPI Connected' : 'Local Canvas Mode'}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              {isFastApi
                ? 'Analisis CIELAB + GLCM otomatis via server FastAPI & tersimpan di database SQLite.'
                : 'Analisis piksel berjalan via Canvas lokal di browser.'}
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              Vision Engine
            </div>
            <div className="mt-1 text-[12px] font-semibold text-slate-200">
              {isFastApi ? 'OpenCV CIELAB + GLCM' : 'Canvas Specimen Analyzer'}
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-500">v1.0.0 · Dual Engine</div>
          </div>
        </div>

        <div className="border-t border-white/[0.08] px-5 py-4">
          <p className="text-[10px] leading-relaxed text-slate-500">
            Sistem pendukung keputusan uji mutu pangan standar SNI / ISO.
          </p>
        </div>
      </aside>
    </>
  )
}
