/* FreshMeat AI service worker: app shell offline, API tetap selalu jaringan. */
const CACHE = 'freshmeat-shell-v1'

const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
]

async function precacheShell() {
  const cache = await caches.open(CACHE)
  const index = await fetch('/')
  if (!index.ok) throw new Error('Gagal mengambil app shell')

  const html = await index.clone().text()
  await cache.put('/', index)

  // Vite memberi nama hash pada aset; ambil URL aktual dari index.html.
  const assets = Array.from(
    html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
    (match) => match[1],
  )
  await cache.addAll(assets)
  await cache.addAll(STATIC_ASSETS)
}

const NEVER_CACHE = ['/api/', '/health', '/docs']

function isNeverCache(url) {
  return NEVER_CACHE.some(
    (path) => url.pathname === path || url.pathname.startsWith(path),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isNeverCache(url)) return

  // Navigasi: network-first, fallback ke shell "/" saat offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(request, copy)),
            )
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match(request, { ignoreVary: true })) ||
            (await cache.match('/', { ignoreVary: true })) ||
            Response.error()
          )
        }),
    )
    return
  }

  // Aset statis: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request, { ignoreVary: true })

      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => null)

      if (cached) {
        event.waitUntil(network.catch(() => undefined))
        return cached
      }

      return (await network) || Response.error()
    })(),
  )
})
