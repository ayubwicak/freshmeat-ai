import { WifiOff } from 'lucide-react'

export default function AppBar({ title, engineMode, online }) {
  const isFastApi = engineMode.includes('FastAPI')

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs font-bold text-emerald-300"
          >
            FM
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900">{title}</h1>
            <p className="truncate text-[11px] text-slate-500">FreshMeat AI</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!online && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700"
            >
              <WifiOff className="h-3 w-3" aria-hidden="true" />
              Offline
            </span>
          )}
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold',
              isFastApi
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700',
            ].join(' ')}
            title={
              isFastApi
                ? 'Analisis memakai backend FastAPI CIELAB + GLCM'
                : 'Analisis memakai Canvas lokal di perangkat'
            }
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${isFastApi ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {isFastApi ? 'Server' : 'Lokal'}
          </span>
        </div>
      </div>
    </header>
  )
}
