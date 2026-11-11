import { useState } from 'react'
import {
  ClipboardList,
  Database,
  Download,
  FileCheck2,
  Printer,
  Search,
  X,
} from 'lucide-react'
import { commodityShortName } from '@freshmeat/analysis'

function badgeClass(score) {
  if (score >= 80) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]'
  }
  if (score >= 55) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_-3px_rgba(245,158,11,0.3)]'
  }
  return 'border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_12px_-3px_rgba(244,63,94,0.3)]'
}

function EmptyState({ hasLogs }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-slate-500 ring-1 ring-white/10">
        <Database className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-xs text-slate-400">
        {hasLogs ? 'Tidak ada rekaman yang cocok dengan pencarian.' : 'Belum ada rekaman inspeksi.'}
      </p>
    </div>
  )
}

export default function AuditTable({ logs, onExport, onPrint }) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const filteredLogs = normalized
    ? logs.filter((log) =>
        [log.id, log.batchName, commodityShortName(log.commodity), log.status]
          .join(' ')
          .toLowerCase()
          .includes(normalized),
      )
    : logs

  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      <div className="border-b border-white/[0.08] bg-slate-900/40 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white sm:text-base">
                  Riwayat &amp; Log Inspeksi
                </h3>
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-indigo-300">
                  SQLITE
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Log audit persisten dengan parameter CIELAB, biomarker, dan klasifikasi mutu
              </p>
            </div>
          </div>
          <span
            id="logCounter"
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] font-bold text-slate-300"
          >
            {logs.length} Rekaman
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari ID sampel, nama batch, komoditas, atau status..."
              aria-label="Cari riwayat inspeksi"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-10 pr-9 text-xs text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>Ekspor JSON</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              <Printer className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Cetak Sertifikat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Feed */}
      <div className="divide-y divide-white/[0.06] sm:hidden">
        {filteredLogs.length === 0 ? (
          <EmptyState hasLogs={logs.length > 0} />
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-4 transition hover:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${badgeClass(
                    log.score,
                  )}`}
                >
                  {log.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-bold text-slate-200">
                  {commodityShortName(log.commodity)}
                </span>
                <span className="shrink-0 font-mono text-slate-400">
                  Skor: <strong className="text-white">{log.score}</strong> · TVB-N: {log.tvbn}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-teal-400">
                <span>Batch: {log.batchName ?? 'Mandiri'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[500px] table-fixed border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] bg-slate-950/30 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              <th className="w-[30%] px-5 py-3 font-semibold">ID Inspeksi &amp; Batch</th>
              <th className="w-[20%] px-4 py-3 font-semibold">Komoditas</th>
              <th className="w-[14%] px-3 py-3 font-semibold">Skor</th>
              <th className="w-[18%] px-3 py-3 font-semibold">TVB-N</th>
              <th className="w-[18%] px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody
            id="auditTableBody"
            className="divide-y divide-white/[0.04] text-xs text-slate-200"
          >
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState hasLogs={logs.length > 0} />
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="truncate font-mono text-[11px] font-semibold text-slate-300">
                      {log.id}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-teal-400/90">
                      {log.batchName ? `Batch: ${log.batchName}` : 'Tanpa batch'}
                    </div>
                  </td>
                  <td className="truncate px-4 py-3.5 font-medium text-slate-300">
                    {commodityShortName(log.commodity)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 font-mono font-black tabular-nums text-white">
                    {log.score}/100
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 font-mono tabular-nums text-slate-400">
                    {log.tvbn} mg/100g
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wide ${badgeClass(
                        log.score,
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
