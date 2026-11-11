import {
  Clock3,
  Flame,
  Info,
  Layers3,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react'
import { AROMAS, COMMODITIES, SURFACES, temperatureZone } from '@freshmeat/analysis'

const selectClass =
  'w-full appearance-none rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-xs font-semibold text-slate-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20'

const sliderBackground = (percent) =>
  `linear-gradient(90deg, #10b981 0%, #06b6d4 ${percent}%, rgba(30, 41, 59, 0.9) ${percent}%, rgba(30, 41, 59, 0.9) 100%)`

export default function ParameterPanel({ batch, form, scanning, onChange, onScan }) {
  const tempPercent = Math.round(((form.temp + 18) / 54) * 100)
  const hoursPercent = Math.round((form.hours / 24) * 100)

  return (
    <div className="glass-card rounded-3xl">
      <div className="flex items-center gap-3 border-b border-white/[0.08] bg-slate-900/40 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white sm:text-base">
              Parameter Kontekstual &amp; Sensor
            </h2>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300">
              CONFIG
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Faktor suhu cold-chain, durasi udara terbuka, dan biomarker organoleptik
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {batch && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-teal-500/20 bg-teal-500/[0.06] p-3.5 text-xs text-slate-300">
            <Layers3
              className="mt-0.5 h-4 w-4 shrink-0 text-teal-400"
              aria-hidden="true"
            />
            <span>
              Terkait ke batch aktif: <strong className="text-white font-bold">{batch.name}</strong>.
              Pengaturan dan pemindaian berikutnya dikelompokkan ke batch ini.
            </span>
          </div>
        )}

        {/* Commodity select */}
        <div>
          <label
            htmlFor="commodityType"
            className="mb-1.5 block text-xs font-semibold text-slate-300"
          >
            Jenis Komoditas Daging
          </label>
          <div className="relative">
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
        </div>

        {/* Temperature slider */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/30 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Thermometer className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              Suhu Penyimpanan Saat Ini
            </span>
            <span
              id="tempValueLabel"
              className="font-mono text-xs font-bold text-emerald-300 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 shadow-sm"
            >
              {form.temp} °C · {temperatureZone(form.temp)}
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
            className="range-input h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{ background: sliderBackground(tempPercent) }}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-400">
            <span>-18 °C · Deep Freeze</span>
            <span>4 °C · Chilled</span>
            <span>28 °C+ · Danger Zone</span>
          </div>
        </div>

        {/* Exposure Hours slider */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/30 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Clock3 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Durasi Paparan Udara Terbuka
            </span>
            <span
              id="hoursValueLabel"
              className="font-mono text-xs font-bold text-cyan-300 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 shadow-sm"
            >
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
            className="range-input h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{ background: sliderBackground(hoursPercent) }}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-400">
            <span>0 Jam · Segar</span>
            <span>8 Jam · Batas Kritis</span>
            <span>24 Jam</span>
          </div>
        </div>

        {/* Texture & Aroma in 2 columns */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="surfaceSelect"
              className="mb-1.5 block text-xs font-semibold text-slate-300"
            >
              Tekstur Permukaan Daging
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
            <label
              htmlFor="aromaSelect"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
            >
              <Wind className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              Indikator Aroma / Gas Volatil
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

        {/* Info card */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            Setiap pemindaian ulang mengirim frame visual ke FastAPI untuk inferensi CIELAB + GLCM.
            Jika backend offline, sistem otomatis beralih ke analisis Canvas lokal.
          </span>
        </div>

        {/* Scan Button */}
        <button
          type="button"
          onClick={onScan}
          disabled={scanning}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/35 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2 tracking-wide">
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" aria-hidden="true" />
                <span>Memindai &amp; Menganalisis Sampel...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 text-slate-950" aria-hidden="true" />
                <span>Jalankan Pemindaian AI</span>
              </>
            )}
          </span>
        </button>

        <p className="text-center font-mono text-[10px] text-slate-500">
          DATA DIANALISIS BERDASARKAN AMBANG BATAS SNI 3932:2008
        </p>
      </div>
    </div>
  )
}
