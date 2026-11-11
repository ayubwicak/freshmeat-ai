import { AlertTriangle, CheckCircle2, Droplet, Sparkles } from 'lucide-react'
import { PRESETS } from '@freshmeat/analysis'

const ICONS = {
  CheckCircle2,
  AlertTriangle,
  Droplet,
}

const PRESET_STYLES = {
  emerald: {
    active:
      'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30 shadow-[0_0_20px_-3px_rgba(16,185,129,0.35)]',
    inactive:
      'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] hover:text-emerald-200',
    indicator: 'bg-emerald-400',
  },
  amber: {
    active:
      'border-amber-500/50 bg-amber-500/15 text-amber-300 ring-2 ring-amber-500/30 shadow-[0_0_20px_-3px_rgba(245,158,11,0.35)]',
    inactive:
      'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-amber-500/30 hover:bg-amber-500/[0.06] hover:text-amber-200',
    indicator: 'bg-amber-400',
  },
  sky: {
    active:
      'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 ring-2 ring-cyan-500/30 shadow-[0_0_20px_-3px_rgba(6,182,212,0.35)]',
    inactive:
      'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] hover:text-cyan-200',
    indicator: 'bg-cyan-400',
  },
  rose: {
    active:
      'border-rose-500/50 bg-rose-500/15 text-rose-300 ring-2 ring-rose-500/30 shadow-[0_0_20px_-3px_rgba(244,63,94,0.35)]',
    inactive:
      'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/[0.06] hover:text-rose-200',
    indicator: 'bg-rose-400',
  },
}

export default function PresetBar({ onSelect, activePreset }) {
  return (
    <div className="mb-6 mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span>Skenario Uji Cepat (Simulasi Demo)</span>
        </div>
        <span className="text-[11px] text-slate-500">
          Klik skenario untuk memuat citra spesimen & parameter uji otomatis
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((preset) => {
          const Icon = ICONS[preset.icon] ?? AlertTriangle
          const isActive = activePreset === preset.key
          const styles = PRESET_STYLES[preset.tone] ?? PRESET_STYLES.emerald

          return (
            <button
              key={preset.key}
              type="button"
              data-preset={preset.key}
              title={preset.caption}
              aria-pressed={isActive}
              onClick={() => onSelect(preset.key)}
              className={[
                'group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.98]',
                isActive ? styles.active : styles.inactive,
              ].join(' ')}
            >
              <div
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'bg-white/[0.04] text-slate-400 group-hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold leading-tight">
                    {preset.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${styles.indicator}`} />
                  <span className="truncate">{preset.caption}</span>
                </div>
              </div>

              {isActive && (
                <div className="absolute right-2.5 top-2.5 flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${styles.indicator}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.indicator}`} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
