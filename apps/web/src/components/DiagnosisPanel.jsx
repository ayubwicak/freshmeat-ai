import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Droplets,
  Gauge,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sun,
  Thermometer,
  Zap,
} from 'lucide-react'
import { TONES } from '../lib/tones.js'

export default function DiagnosisPanel({ result }) {
  const tone = TONES[result.tone] ?? TONES.emerald
  const confidence = Math.min(99.4, 88 + result.score * 0.1).toFixed(1)
  const hasRules = result.rules && result.rules.length > 0
  const threshold =
    result.score >= 80
      ? 'Memenuhi Standar Mutu Grade A (≥ 80)'
      : result.score >= 55
        ? 'Zona Evaluasi Grade B (55–79,9)'
        : 'Di Bawah Ambang Batas Aman (< 55)'

  return (
    <div className="glass-card relative overflow-hidden rounded-3xl">
      {/* Ambient background glow */}
      <div
        className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${tone.soft} blur-3xl opacity-70`}
      />

      <div className="relative p-5 sm:p-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Hasil Keputusan Sistem &amp; AI</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] text-slate-400 sm:inline">
              ID: {result.inspectionId}
            </span>
            <span
              id="confidenceTag"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-bold ${tone.badge}`}
            >
              <Zap className="h-3 w-3" />
              AI CONF {confidence}%
            </span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mt-4">
          <h3
            id="statusTitle"
            aria-live="polite"
            className={`text-2xl font-black tracking-tight sm:text-3xl ${tone.text}`}
          >
            {result.title}
          </h3>
          <p
            id="statusSubtitle"
            className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm"
          >
            {result.subtitle}
          </p>
        </div>

        {/* Score & Gauge Hero Card */}
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center">
          <div
            className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-[4px] shadow-lg sm:mx-0"
            style={{
              background: `conic-gradient(${tone.accent} ${result.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              boxShadow: `0 0 25px -4px ${tone.glow}`,
            }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#080d16]">
              <span
                id="scoreCircle"
                className="text-3xl font-black leading-none tabular-nums text-white"
              >
                {result.score}
              </span>
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
                / 100
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Indeks Kesegaran Total
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${tone.badge}`}
              >
                {result.score >= 80 ? 'Grade A' : result.score >= 55 ? 'Grade B' : 'Reject'}
              </span>
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-200 sm:text-sm">
              {threshold}
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[10px] text-slate-400 sm:justify-start">
              <span>Pipeline:</span>
              <span className="text-slate-300">{result.source}</span>
            </div>
          </div>
        </div>

        {/* Hard Override Alert (RULE-01, RULE-02, RULE-03) */}
        <div
          id="specialAlertBox"
          className={
            hasRules
              ? 'mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs leading-relaxed shadow-lg shadow-rose-950/30'
              : 'hidden'
          }
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
              <AlertOctagon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <strong
                id="specialAlertTitle"
                className="block text-xs font-bold text-rose-300 uppercase tracking-wide"
              >
                {hasRules
                  ? `${result.rules[0].title}${
                      result.rules.length > 1
                        ? ` (+${result.rules.length - 1} aturan lain)`
                        : ''
                    }`
                  : 'Peringatan Sistem Keamanan Pangan'}
              </strong>
              <span id="specialAlertDesc" className="mt-1 block text-slate-300">
                {hasRules
                  ? result.rules.map((rule) => rule.desc).join(' ')
                  : 'Deteksi anomali pada sampel daging.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Biomarker Vital Meters */}
      <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3 sm:px-6">
        {/* Oksimioglobin */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Droplets className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              Oksimioglobin
            </span>
            <span
              id="bioOxy"
              className={`font-mono text-xs font-black tabular-nums ${tone.text}`}
            >
              {result.oxy}%
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div
              id="barOxy"
              className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
              style={{ width: `${result.oxy}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Pigmen alami daging segar
          </p>
        </div>

        {/* TVB-N */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              TVB-N Total
            </span>
            <span
              id="bioTvbn"
              className={`font-mono text-xs font-black tabular-nums ${tone.text}`}
            >
              {result.tvbn} mg/100g
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div
              id="barTvbn"
              className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
              style={{ width: `${Math.min(100, Math.round(result.tvbn * 2.5))}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Batas aman standar: &lt; 20 mg/100g
          </p>
        </div>

        {/* Risiko Mikroba */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              Risiko Mikroba
            </span>
            <span
              id="bioMicrobe"
              className={`text-xs font-black tabular-nums ${tone.text}`}
            >
              {result.microbeLabel}
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div
              id="barMicrobe"
              className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
              style={{ width: `${result.microbePct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Kinetika suhu dan waktu paparan
          </p>
        </div>
      </div>

      {/* Shelf Life Prediction Pods */}
      <div className="border-t border-white/[0.08] bg-slate-950/40 px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Clock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            Estimasi Sisa Masa Simpan
          </h4>
          <span className="font-mono text-[9px] text-slate-400">ARRHENIUS MODEL</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Room Temp Pod */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-900/40 p-3 transition hover:border-amber-500/30">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Sun className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-slate-400">Suhu Ruang (28 °C)</div>
              <div
                id="shelfRoom"
                className="mt-0.5 truncate text-xs font-extrabold text-white"
              >
                {result.shelfLife.room}
              </div>
            </div>
          </div>

          {/* Chiller Pod */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-900/40 p-3 transition hover:border-cyan-500/30">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Thermometer className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-slate-400">Chiller (2–4 °C)</div>
              <div
                id="shelfChiller"
                className="mt-0.5 truncate text-xs font-extrabold text-white"
              >
                {result.shelfLife.chiller}
              </div>
            </div>
          </div>

          {/* Freezer Pod */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-900/40 p-3 transition hover:border-indigo-500/30">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <Snowflake className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-slate-400">Freezer (-18 °C)</div>
              <div
                id="shelfFreezer"
                className="mt-0.5 truncate text-xs font-extrabold text-white"
              >
                {result.shelfLife.freezer}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Recommendation Banner */}
      <div className="mx-5 mb-5 mt-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 sm:mx-6 sm:mb-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Rekomendasi Penanganan Laboratorium
            </div>
            <p
              id="recommendationText"
              className="mt-1 text-xs leading-relaxed text-slate-200"
            >
              {result.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
