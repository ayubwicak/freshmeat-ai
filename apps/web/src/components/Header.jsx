import { Menu } from 'lucide-react'

export default function Header({ engineMode, onOpenMenu }) {
  const isFastApi = engineMode.includes('FastAPI')

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-sm lg:left-64">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm sm:text-base">FreshMeat AI</span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="hidden text-xs text-slate-500 sm:inline">Pemeriksaan Mutu Daging</span>
          </div>
        </div>

        {/* Engine Status */}
        <div className="flex items-center gap-2">
          <div
            title={`Mode Engine: ${engineMode}`}
            className={[
              'flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
              isFastApi
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-700',
            ].join(' ')}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isFastApi ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            />
            <span id="engineStatusText" className="font-mono text-[11px]">
              {engineMode}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
