import { FlaskConical, Menu, Shield } from 'lucide-react'

export default function Header({ engineMode, onOpenMenu }) {
  const isFastApi = engineMode.includes('FastAPI')

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all lg:left-72">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5 sm:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
              <FlaskConical className="h-4 w-4" strokeWidth={2.4} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 lg:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                BIO-SPECTRAL LAB
              </span>
              <span className="hidden text-slate-300 lg:inline">/</span>
              <span className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                Pemeriksaan Cepat Mutu Daging
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Engine Status Pill */}
          <div
            title={`Mode Engine: ${engineMode}`}
            className={[
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
              isFastApi
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700',
            ].join(' ')}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isFastApi ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isFastApi ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
            </span>
            <span id="engineStatusText" className="hidden whitespace-nowrap font-mono sm:inline">
              {engineMode}
            </span>
            <span className="whitespace-nowrap font-mono sm:hidden">
              {isFastApi ? 'FastAPI' : 'Lokal'}
            </span>
          </div>

          {/* Inspector Badge */}
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1.5 shadow-sm transition hover:border-slate-300 sm:pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
              MS
            </div>
            <div className="hidden text-right xl:block">
              <div className="text-[11px] font-bold leading-tight text-slate-900">
                Dr. M. Sanjaya
              </div>
              <div className="text-[9px] font-semibold tracking-wider text-slate-500">
                Lead Inspector
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
