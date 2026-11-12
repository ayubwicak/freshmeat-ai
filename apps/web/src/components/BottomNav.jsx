import {
  CheckCircle2,
  ClipboardList,
  Info,
  Layers3,
  ScanLine,
} from 'lucide-react'

export const TABS = [
  { id: 'periksa', label: 'Periksa', title: 'Periksa Sampel', icon: ScanLine },
  { id: 'hasil', label: 'Hasil', title: 'Hasil Analisis', icon: CheckCircle2 },
  { id: 'riwayat', label: 'Riwayat', title: 'Riwayat Inspeksi', icon: ClipboardList },
  { id: 'batch', label: 'Batch', title: 'Batch Daging', icon: Layers3 },
  { id: 'info', label: 'Info', title: 'Informasi', icon: Info },
]

export default function BottomNav({ activeTab, onChange }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
              ].join(' ')}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'text-emerald-600' : ''}`}
                aria-hidden="true"
              />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
