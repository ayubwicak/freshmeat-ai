import { useEffect, useState } from 'react'
import { ChevronDown, FolderPlus, Layers3, Loader2, Plus, X } from 'lucide-react'
import { COMMODITIES, commodityShortName } from '@freshmeat/analysis'

const selectClass =
  'w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-xs outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'

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
      setError(
        'Batch belum bisa dibuat. Pastikan backend FastAPI aktif, lalu coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section
        id="batch"
        className="glass-card mb-6 mt-6 scroll-mt-24 rounded-3xl p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Layers3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
                  Batch Kedatangan Daging
                </span>
                {activeBatch && (
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 font-mono text-[9px] font-bold text-teal-700">
                    AKTIF
                  </span>
                )}
              </div>
              <h2 className="mt-1 truncate text-base font-black text-slate-900 sm:text-lg">
                {activeBatch ? activeBatch.name : 'Belum Ada Batch Aktif'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeBatch
                  ? `${activeBatch.batch_id} · ${commodityShortName(
                      activeBatch.commodity,
                    )} · ${activeBatch.sample_count} sampel diuji`
                  : 'Kelompokkan beberapa foto dari kedatangan daging yang sama dalam satu batch.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center lg:shrink-0">
            {batches.length > 0 && (
              <div className="relative">
                <select
                  value={activeBatch?.batch_id ?? ''}
                  onChange={(event) => onSelect(event.target.value || null)}
                  aria-label="Pilih batch aktif"
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-xs font-semibold text-slate-800 shadow-xs outline-none transition hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 sm:w-60"
                >
                  <option value="">Tanpa batch (Mandiri)</option>
                  {batches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batch.name} ({batch.sample_count} sampel)
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
              </div>
            )}

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-teal-600/25 transition hover:bg-teal-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Buat Batch Baru</span>
            </button>
          </div>
        </div>

        {activeBatch && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 font-mono text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>Rata-rata Skor Batch:</span>
              <strong className="text-slate-900 font-bold text-xs">
                {activeBatch.average_score ?? '—'}/100
              </strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-teal-700 font-semibold">
              Foto baru otomatis tercatat di batch ini
            </span>
          </div>
        )}
      </section>

      {/* Modal Dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="batchModalTitle"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="batchModalTitle" className="text-base font-bold text-slate-900">
                    Tambah Batch Baru
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Registrasi kelompok inspeksi untuk kedatangan spesimen
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Tutup formulir batch"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="batchName"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Nama Batch <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  id="batchName"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Misal: Batch Kedatangan RPH #104"
                  maxLength={80}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="batchCommodity"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Jenis Komoditas Daging
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

              <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900">
                Setelah batch dibuat, foto-foto yang diunggah akan secara otomatis tercatat dalam grup inspeksi ini.
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-teal-600/25 transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Batch</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
