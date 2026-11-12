import { useState } from 'react'
import { Download, Printer, Search, X } from 'lucide-react'
import { commodityShortName } from '@freshmeat/analysis'

function badgeClass(score) {
  if (score >= 80) {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (score >= 55) {
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-rose-100 text-rose-800'
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
    <div className="glass-card overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat &amp; Log Inspeksi</h3>
            <p className="text-xs text-slate-500">Daftar rekaman pengujian mutu sampel</p>
          </div>
          <span
            id="logCounter"
            className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
          >
            {logs.length} Rekaman
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari ID, batch, komoditas..."
              aria-label="Cari riwayat inspeksi"
              className="min-h-11 w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-10 text-base text-slate-800 outline-none focus:border-slate-400 sm:min-h-0 sm:py-1.5 sm:text-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 flex h-9 w-9 min-h-0 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ekspor JSON</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak Hasil</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kartu riwayat untuk layar kecil */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {filteredLogs.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-slate-400">
            {logs.length > 0 ? 'Tidak ada rekaman yang cocok.' : 'Belum ada rekaman inspeksi.'}
          </li>
        ) : (
          filteredLogs.map((log) => (
            <li key={log.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-semibold text-slate-900">
                    {log.id}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {log.batchName ? `Batch: ${log.batchName}` : 'Mandiri'}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${badgeClass(log.score)}`}
                >
                  {log.status}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="min-w-0 rounded-lg bg-slate-50 p-2">
                  <dt className="text-[10px] text-slate-500">Komoditas</dt>
                  <dd
                    className="mt-0.5 truncate text-[11px] font-semibold text-slate-800"
                    title={commodityShortName(log.commodity)}
                  >
                    {commodityShortName(log.commodity)}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-[10px] text-slate-500">Skor Mutu</dt>
                  <dd className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                    {log.score}/100
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-[10px] text-slate-500">TVB-N</dt>
                  <dd className="mt-0.5 font-mono text-xs text-slate-700">
                    {log.tvbn} mg
                  </dd>
                </div>
              </dl>
            </li>
          ))
        )}
      </ul>

      {/* Tabel untuk layar sm ke atas */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[500px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-600">
              <th className="px-4 py-2.5">ID Inspeksi &amp; Batch</th>
              <th className="px-3 py-2.5">Komoditas</th>
              <th className="px-3 py-2.5">Skor Mutu</th>
              <th className="px-3 py-2.5">TVB-N</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody id="auditTableBody" className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  {logs.length > 0 ? 'Tidak ada rekaman yang cocok.' : 'Belum ada rekaman inspeksi.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <div className="font-mono font-medium text-slate-900">{log.id}</div>
                    <div className="text-[11px] text-slate-400">
                      {log.batchName ? `Batch: ${log.batchName}` : 'Mandiri'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {commodityShortName(log.commodity)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                    {log.score}/100
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{log.tvbn} mg/100g</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${badgeClass(log.score)}`}
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
