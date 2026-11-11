import { useEffect, useState } from 'react'
import {
  ClipboardList,
  Layers3,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'pemeriksaan', label: 'Pemeriksaan', icon: ScanLine },
  { id: 'batch', label: 'Batch Daging', icon: Layers3 },
  { id: 'riwayat', label: 'Riwayat & Log', icon: ClipboardList },
  { id: 'parameter', label: 'Pengaturan', icon: SlidersHorizontal },
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
          'fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navigasi utama"
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">FreshMeat AI</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="text-[11px] text-slate-500">
            <div className="font-medium text-slate-700">
              {isFastApi ? 'Mode FastAPI' : 'Mode Canvas Lokal'}
            </div>
            <div className="mt-0.5 text-slate-400">
              {isFastApi ? 'Analisis CIELAB + GLCM via API' : 'Analisis piksel via browser'}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
