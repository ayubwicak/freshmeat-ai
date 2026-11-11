import { PRESETS } from '@freshmeat/analysis'

export default function PresetBar({ onSelect, activePreset }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Contoh Skenario Sampel:</span>
        <span className="text-[11px] text-slate-400">Pilih simulasi cepat untuk menguji sistem</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                'rounded-lg border px-3 py-2 text-left transition-colors text-xs',
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="truncate font-semibold">{preset.label}</div>
              <div className={`truncate text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                {preset.caption}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
