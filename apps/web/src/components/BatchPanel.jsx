import { useEffect, useState } from 'react'
import { ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { COMMODITIES, commodityShortName } from '@freshmeat/analysis'

const selectClass =
  'min-h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 outline-none focus:border-slate-400 sm:min-h-0 sm:py-2 sm:text-xs'

export default function BatchPanel({
  batches,
  activeBatch,
  defaultCommodity,
  onSelect,
  onCreate,
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [commodity, setCommodity] = useState(defaultCommodity)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const openModal = () => {
    setName('')
    setCommodity(defaultCommodity)
    setError('')
    setOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onCreate({ name: name.trim(), commodity })
      setOpen(false)
    } catch (createError) {
      console.warn('Gagal membuat batch:', createError)
      setError('Batch belum bisa dibuat. Pastikan backend FastAPI aktif, lalu coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section id="batch" className="glass-card p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Batch Kedatangan Daging</span>
              {activeBatch && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Aktif
                </span>
              )}
            </div>
            <div className="mt-0.5 text-sm font-bold text-slate-900">
              {activeBatch ? activeBatch.name : 'Tidak ada batch aktif (Mode Mandiri)'}
            </div>
            {activeBatch && (
              <div className="mt-0.5 text-xs text-slate-500">
                {activeBatch.batch_id} · {commodityShortName(activeBatch.commodity)} ·{' '}
                {activeBatch.sample_count} sampel diuji
                {activeBatch.average_score != null &&
                  ` · Rata-rata skor: ${activeBatch.average_score}/100`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
            {batches.length > 0 && (
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={activeBatch?.batch_id ?? ''}
                  onChange={(event) => onSelect(event.target.value || null)}
                  aria-label="Pilih batch aktif"
                  className="min-h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-base font-medium text-slate-700 hover:border-slate-300 sm:min-h-0 sm:py-1.5 sm:text-xs"
                >
                  <option value="">Tanpa batch (Mandiri)</option>
                  {batches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batch.name} ({batch.sample_count} sampel)
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            )}

            <button
              type="button"
              onClick={openModal}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Batch Baru</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal: bottom sheet di HP, dialog di layar besar */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="batchModalTitle"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl border border-slate-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg sm:rounded-xl sm:pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="batchModalTitle" className="text-sm font-bold text-slate-900">
                Tambah Batch Baru
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                aria-label="Tutup formulir batch"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="batchName" className="mb-1 block text-xs font-medium text-slate-700">
                  Nama Batch <span className="font-normal text-slate-400">(opsional)</span>
                </label>
                <input
                  id="batchName"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Misal: Batch Kedatangan #104"
                  maxLength={80}
                  autoFocus
                  className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-800 outline-none focus:border-slate-400 sm:min-h-0 sm:py-2 sm:text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="batchCommodity"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Komoditas Daging
                </label>
                <select
                  id="batchCommodity"
                  value={commodity}
                  onChange={(event) => setCommodity(event.target.value)}
                  className={selectClass}
                >
                  {COMMODITIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
