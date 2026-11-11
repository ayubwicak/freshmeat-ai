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
      'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm',
    inactive:
      'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30',
    iconActive: 'bg-emerald-600 text-white',
    iconInactive: 'bg-emerald-100 text-emerald-700',
    indicator: 'bg-emerald-600',
  },
  amber: {
    active:
      'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20 shadow-sm',
    inactive:
      'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/30',
    iconActive: 'bg-amber-500 text-white',
    iconInactive: 'bg-amber-100 text-amber-700',
    indicator: 'bg-amber-500',
  },
  sky: {
    active:
      'border-sky-500 bg-sky-50/80 text-sky-900 ring-2 ring-sky-500/20 shadow-sm',
    inactive:
      'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/30',
    iconActive: 'bg-sky-600 text-white',
    iconInactive: 'bg-sky-100 text-sky-700',
    indicator: 'bg-sky-600',
  },
  rose: {
    active:
      'border-rose-500 bg-rose-50/80 text-rose-900 ring-2 ring-rose-500/20 shadow-sm',
    inactive:
      'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/30',
    iconActive: 'bg-rose-600 text-white',
    iconInactive: 'bg-rose-100 text-rose-700',
    indicator: 'bg-rose-600',
  },
}

export default function PresetBar({ onSelect, activePreset }) {
  return (
    <div className="mb-6 mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Skenario Uji Cepat (Simulasi Sampel)</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Pilih skenario untuk simulasi parameter visual & organoleptik
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                'group relative flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98]',
                isActive ? styles.active : styles.inactive,
              ].join(' ')}
            >
              <div
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                  isActive ? styles.iconActive : styles.iconInactive,
                ].join(' ')}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="truncate text-xs font-bold leading-tight block">
                  {preset.label}
                </span>
                <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${styles.indicator}`} />
                  <span className="truncate">{preset.caption}</span>
                </div>
              </div>

              {isActive && (
                <div className="absolute right-3 top-3 flex h-2 w-2">
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
