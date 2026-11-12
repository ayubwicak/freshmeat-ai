const MAX_SIDE = 1280
const JPEG_QUALITY = 0.88

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar untuk kompresi'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

/**
 * Mengecilkan sisi terpanjang gambar dan mengubahnya menjadi JPEG 0.88.
 * Backend tetap me-resize ke 480x360, sehingga hasil analisis tidak berubah.
 * Jika kompresi gagal, file asli dikembalikan agar upload tetap berjalan.
 */
export async function compressImage(
  file,
  { maxSide = MAX_SIDE, quality = JPEG_QUALITY } = {},
) {
  if (!(file instanceof Blob) || !file.type?.startsWith('image/')) {
    return file
  }

  try {
    const image = await loadImage(file)
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (!width || !height) return file

    const scale = Math.min(1, maxSide / Math.max(width, height))
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')
    if (!context) return file

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, targetWidth, targetHeight)

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (!blob) return file

    const baseName =
      (file.name || 'specimen').replace(/\.[^.]+$/, '') || 'specimen'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch (error) {
    console.warn('Kompresi gambar gagal, memakai file asli.', error)
    return file
  }
}
