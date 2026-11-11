import { Loader2 } from 'lucide-react'
import { AROMAS, COMMODITIES, SURFACES, temperatureZone } from '@freshmeat/analysis'

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400'

export default function ParameterPanel({ batch, form, scanning, onChange, onScan }) {
  return (
    <div className="glass-card p-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-slate-900">
          Parameter Uji &amp; Kondisi Lingkungan
        </h2>
        <p className="text-xs text-slate-500">
          Atur suhu penyimpanan, durasi paparan, dan kondisi fisik sampel
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {batch && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Batch aktif: <strong className="font-semibold text-slate-900">{batch.name}</strong>
          </div>
        )}

        {/* Commodity select */}
        <div>
          <label htmlFor="commodityType" className="mb-1 block text-xs font-medium text-slate-700">
            Komoditas Daging
          </label>
          <select
            id="commodityType"
            value={form.commodity}
            onChange={(event) => onChange({ commodity: event.target.value })}
            className={selectClass}
          >
            {COMMODITIES.map((commodity) => (
              <option key={commodity.value} value={commodity.value}>
                {commodity.label}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature slider */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="tempSlider" className="font-medium text-slate-700">
              Suhu Penyimpanan
            </label>
            <span id="tempValueLabel" className="font-mono font-semibold text-slate-900">
              {form.temp} °C ({temperatureZone(form.temp)})
            </span>
          </div>
          <input
            type="range"
            id="tempSlider"
            min={-18}
            max={36}
            value={form.temp}
            aria-label="Suhu penyimpanan"
            onChange={(event) => onChange({ temp: Number(event.target.value) })}
            className="w-full accent-slate-900 cursor-pointer"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
            <span>-18°C (Beku)</span>
            <span>4°C (Dingin)</span>
            <span>36°C (Ruang)</span>
          </div>
        </div>

        {/* Exposure Hours slider */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="hoursSlider" className="font-medium text-slate-700">
              Durasi Paparan Udara
            </label>
            <span id="hoursValueLabel" className="font-mono font-semibold text-slate-900">
              {form.hours} Jam
            </span>
          </div>
          <input
            type="range"
            id="hoursSlider"
            min={0}
            max={24}
            step={0.5}
            value={form.hours}
            aria-label="Durasi paparan udara"
            onChange={(event) => onChange({ hours: Number(event.target.value) })}
            className="w-full accent-slate-900 cursor-pointer"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
            <span>0 Jam (Baru)</span>
            <span>8 Jam</span>
            <span>24 Jam</span>
          </div>
        </div>

        {/* Surface & Aroma */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="surfaceSelect" className="mb-1 block text-xs font-medium text-slate-700">
              Kondisi Permukaan
            </label>
            <select
              id="surfaceSelect"
              value={form.surface}
              onChange={(event) => onChange({ surface: event.target.value })}
              className={selectClass}
            >
              {SURFACES.map((surface) => (
                <option key={surface.value} value={surface.value}>
                  {surface.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aromaSelect" className="mb-1 block text-xs font-medium text-slate-700">
              Indikasi Aroma
            </label>
            <select
              id="aromaSelect"
              value={form.aroma}
              onChange={(event) => onChange({ aroma: event.target.value })}
              className={selectClass}
            >
              {AROMAS.map((aroma) => (
                <option key={aroma.value} value={aroma.value}>
                  {aroma.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scan Button */}
        <button
          type="button"
          onClick={onScan}
          disabled={scanning}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {scanning ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memproses...</span>
            </span>
          ) : (
            'Jalankan Uji Analisis'
          )}
        </button>
      </div>
    </div>
  )
}
