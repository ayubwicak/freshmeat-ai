export function createApiClient(baseUrl = '') {
  const apiBase = baseUrl.replace(/\/$/, '')

  async function analyzeImage(file, form, batchId = null) {
    const formData = new FormData()
    formData.append('file', file, 'specimen.jpg')
    formData.append('commodity', form.commodity)
    formData.append('storage_temp', String(form.temp))
    formData.append('exposure_hours', String(form.hours))
    formData.append('surface_condition', form.surface)
    formData.append('aroma_condition', form.aroma)
    if (batchId) formData.append('batch_id', batchId)

    const controller = new AbortController()
    // Jaringan seluler lambat: beri waktu 20 detik sebelum fallback Canvas lokal.
    const timeout = window.setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(`${apiBase}/api/v1/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Backend error ${response.status}`)
      }

      return await response.json()
    } finally {
      window.clearTimeout(timeout)
    }
  }

  async function fetchHistory(limit = 20, batchId = null) {
    const query = new URLSearchParams({ limit: String(limit) })
    if (batchId) query.set('batch_id', batchId)
    const response = await fetch(
      `${apiBase}/api/v1/inspections?${query.toString()}`,
    )
    if (!response.ok) {
      throw new Error(`History error ${response.status}`)
    }
    return await response.json()
  }

  async function createBatch({ name = '', commodity }) {
    const response = await fetch(`${apiBase}/api/v1/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, commodity }),
    })
    if (!response.ok) {
      throw new Error(`Batch error ${response.status}`)
    }
    return await response.json()
  }

  async function fetchBatches(limit = 30) {
    const response = await fetch(`${apiBase}/api/v1/batches?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Batches error ${response.status}`)
    }
    return await response.json()
  }

  return { analyzeImage, createBatch, fetchBatches, fetchHistory }
}
