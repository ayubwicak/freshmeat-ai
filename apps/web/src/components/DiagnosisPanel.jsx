import { AlertTriangle, Info } from 'lucide-react'
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
    <div className="glass-card p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Hasil Diagnosis &amp; Mutu</h2>
          <span className="text-xs text-slate-500">ID Sampel: {result.inspectionId}</span>
        </div>
        <span
          id="confidenceTag"
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-medium text-slate-700"
        >
          Keyakinan AI: {confidence}%
        </span>
      </div>

      {/* Main Score and Status */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3
              id="statusTitle"
              aria-live="polite"
              className={`text-xl font-bold ${tone.title || 'text-slate-900'}`}
            >
              {result.title}
            </h3>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                result.score >= 80
                  ? 'bg-emerald-100 text-emerald-800'
                  : result.score >= 55
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
              }`}
            >
              {result.score >= 80 ? 'Grade A' : result.score >= 55 ? 'Grade B' : 'Reject'}
            </span>
          </div>
          <p id="statusSubtitle" className="mt-1 text-xs text-slate-600">
            {result.subtitle}
          </p>
          <div className="mt-2 text-xs font-medium text-slate-500">{threshold}</div>
        </div>

        <div className="flex items-baseline gap-1 sm:text-right">
          <span id="scoreCircle" className="text-4xl font-extrabold text-slate-900 tabular-nums">
            {result.score}
          </span>
          <span className="text-xs font-semibold text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Hard Override Alert */}
      <div
        id="specialAlertBox"
        className={
          hasRules
            ? 'mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed'
            : 'hidden'
        }
      >
        <div className="flex items-start gap-2 text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong id="specialAlertTitle" className="font-semibold block">
              {hasRules ? result.rules[0].title : ''}
            </strong>
            <span id="specialAlertDesc" className="text-rose-700">
              {hasRules ? result.rules.map((rule) => rule.desc).join(' ') : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Biomarker Parameters */}
      <div className="mt-4 space-y-3">
        <div className="text-xs font-semibold text-slate-700">Parameter Biomarker:</div>

        <div className="space-y-2">
          {/* Oksimioglobin */}
          <div className="rounded border border-slate-200 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Oksimioglobin</span>
              <span id="bioOxy" className="font-mono font-bold text-slate-900">
                {result.oxy}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                id="barOxy"
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${result.oxy}%` }}
              />
            </div>
          </div>

          {/* TVB-N */}
          <div className="rounded border border-slate-200 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">TVB-N (Total Volatile Basic Nitrogen)</span>
              <span id="bioTvbn" className="font-mono font-bold text-slate-900">
                {result.tvbn} mg/100g
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                id="barTvbn"
                className="h-full rounded-full bg-slate-700 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(result.tvbn * 2.5))}%` }}
              />
            </div>
          </div>

          {/* Mikroba */}
          <div className="rounded border border-slate-200 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Estimasi Risiko Mikroba</span>
              <span id="bioMicrobe" className="font-bold text-slate-900">
                {result.microbeLabel}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                id="barMicrobe"
                className="h-full rounded-full bg-slate-700 transition-all duration-300"
                style={{ width: `${result.microbePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estimasi Masa Simpan */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-2 text-xs font-semibold text-slate-700">Estimasi Sisa Masa Simpan:</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded border border-slate-200 bg-slate-50/50 p-2">
            <div className="text-[11px] text-slate-500">Suhu Ruang</div>
            <div id="shelfRoom" className="mt-1 font-bold text-slate-900">
              {result.shelfLife.room}
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50/50 p-2">
            <div className="text-[11px] text-slate-500">Chiller (4°C)</div>
            <div id="shelfChiller" className="mt-1 font-bold text-slate-900">
              {result.shelfLife.chiller}
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50/50 p-2">
            <div className="text-[11px] text-slate-500">Freezer (-18°C)</div>
            <div id="shelfFreezer" className="mt-1 font-bold text-slate-900">
              {result.shelfLife.freezer}
            </div>
          </div>
        </div>
      </div>

      {/* Rekomendasi */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-800">Rekomendasi Penanganan:</div>
            <p id="recommendationText" className="mt-0.5 text-xs text-slate-600 leading-relaxed">
              {result.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
