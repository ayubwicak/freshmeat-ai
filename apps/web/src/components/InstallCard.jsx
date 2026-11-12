import { useEffect, useState } from 'react'
import { Download, Share, Smartphone } from 'lucide-react'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function InstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [isIos] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
  })

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-emerald-300">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Pasang Aplikasi</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            FreshMeat AI dapat dipasang ke layar utama dan dibuka seperti aplikasi
            biasa, termasuk saat koneksi terputus.
          </p>
        </div>
      </div>

      {installed ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          Aplikasi sudah terpasang di perangkat ini.
        </p>
      ) : isIos ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Di iPhone/iPad, gunakan Safari:
          </p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 leading-relaxed">
            <li>
              Ketuk tombol <Share className="inline h-3.5 w-3.5" aria-hidden="true" />{' '}
              Bagikan di toolbar Safari.
            </li>
            <li>Pilih “Tambah ke Layar Utama”.</li>
            <li>Ketuk “Tambah” untuk membuka FreshMeat AI seperti aplikasi.</li>
          </ol>
        </div>
      ) : deferredPrompt ? (
        <button
          type="button"
          onClick={install}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Pasang FreshMeat AI
        </button>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          Buka menu browser (⋮), lalu pilih <strong>Install app</strong> atau{' '}
          <strong>Tambahkan ke layar utama</strong>. Instalasi tersedia setelah
          aplikasi dibuka melalui HTTPS.
        </p>
      )}
    </div>
  )
}
