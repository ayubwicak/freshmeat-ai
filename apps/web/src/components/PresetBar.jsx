import { ChevronDown } from 'lucide-react'
import { PRESETS } from '@freshmeat/analysis'

export default function PresetBar({ onSelect, activePreset }) {
  return (
    <details className="glass-card group p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-slate-700">
        <span>
          Skenario demo <span className="font-normal text-slate-400">(opsional)</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-1 text-[11px] text-slate-400">
        Muat contoh sampel untuk mencoba sistem tanpa foto.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.key

          return (
            <button
              key={preset.key}
              type="button"
              data-preset={preset.key}
              title={preset.caption}
              aria-pressed={isActive}
              onClick={() => onSelect(preset.key)}
              className={[
                'min-h-11 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                isActive
                  ? 'border-slate-900 bg-slate-900 font-medium text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="truncate font-semibold">{preset.label}</div>
              <div
                className={`truncate text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-500'}`}
              >
                {preset.caption}
              </div>
            </button>
          )
        })}
      </div>
    </details>
  )
}
