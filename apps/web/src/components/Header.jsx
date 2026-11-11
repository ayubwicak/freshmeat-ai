import { Activity, FlaskConical, Menu, Shield } from 'lucide-react'

export default function Header({ engineMode, onOpenMenu }) {
  const isFastApi = engineMode.includes('FastAPI')

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-white/[0.08] bg-[#060b13]/80 backdrop-blur-xl transition-all lg:left-72">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-emerald-500/40 hover:bg-white/[0.08] hover:text-white lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5 sm:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20">
              <FlaskConical className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 lg:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                BIO-SPECTRAL LAB
              </span>
              <span className="hidden text-slate-600 lg:inline">/</span>
              <span className="truncate text-xs font-semibold text-slate-200 sm:text-sm">
                Pemeriksaan Cepat
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Engine Status Pill */}
          <div
            title={`Mode Engine: ${engineMode}`}
            className={[
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all',
              isFastApi
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
            ].join(' ')}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isFastApi ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isFastApi ? 'bg-emerald-400' : 'bg-amber-400'
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
          <div className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-1.5 transition hover:border-white/20 sm:pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 text-[10px] font-black text-slate-950 shadow-sm shadow-emerald-500/30">
              MS
            </div>
            <div className="hidden text-right xl:block">
              <div className="text-[11px] font-bold leading-tight text-slate-200">
                Dr. M. Sanjaya
              </div>
              <div className="text-[9px] font-medium tracking-wider text-slate-400">
                Lead Inspector
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
