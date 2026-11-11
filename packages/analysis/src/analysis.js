export const DEFAULT_METRICS = {
  redRatio: 2.45,
  specularity: 18,
  oxidation: 11.2,
  visualScore: 92,
  lightness: 45,
  homogeneity: null,
  backend: false,
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function createInspectionId(date = new Date()) {
  const ymd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `FM-${ymd}-${suffix}`
}

export function commodityShortName(commodity) {
  if (commodity.includes('Sapi')) return 'Daging Sapi'
  if (commodity.includes('Ayam')) return 'Ayam Broiler'
  if (commodity.includes('Ikan')) return 'Ikan / Fillet'
  if (commodity.includes('Kambing')) return 'Kambing / Domba'
  return commodity
}

export function statusShortFromClassification(classification) {
  if (classification === 'GRADE_A_FRESH') return 'GRADE A (SEGAR)'
  if (classification === 'GRADE_B_SUBFRESH') return 'GRADE B (SEGERA OLAH)'
  return 'REJECT (TIDAK LAYAK)'
}

export function analyzeCanvasPixels(ctx, canvas) {
  let imgData
  try {
    imgData = ctx.getImageData(90, 60, 300, 180).data
  } catch (error) {
    console.warn('Canvas tidak dapat dibaca:', error)
    return { ...DEFAULT_METRICS }
  }

  let rSum = 0
  let gSum = 0
  let bSum = 0
  let brightCount = 0
  let pixelCount = 0

  for (let i = 0; i < imgData.length; i += 16) {
    const r = imgData[i]
    const g = imgData[i + 1]
    const b = imgData[i + 2]

    if (r + g + b > 65) {
      rSum += r
      gSum += g
      bSum += b
      pixelCount += 1

      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC
      if (maxC > 205 && saturation < 0.3) brightCount += 1
    }
  }

  if (pixelCount === 0) pixelCount = 1

  const rAvg = rSum / pixelCount
  const gAvg = gSum / pixelCount
  const bAvg = bSum / pixelCount
  const redRatio = Number((rAvg / Math.max(gAvg, 1)).toFixed(2))
  const specularity = Math.min(95, Math.round((brightCount / pixelCount) * 200))
  const visualScore = clamp(Math.round((redRatio - 0.95) * 62), 10, 100)

  return {
    redRatio,
    specularity,
    oxidation: Number((100 - visualScore).toFixed(1)),
    visualScore,
    lightness: Math.round((0.299 * rAvg + 0.587 * gAvg + 0.114 * bAvg) / 2.55),
    homogeneity: null,
    backend: false,
  }
}

export function drawMeatSample(ctx, canvas, type) {
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = '#090d16'
  ctx.fillRect(0, 0, w, h)

  let baseColor
  let secondaryColor
  let fatColor
  let spotsColor = null
  let glossAlpha

  if (type === 'fresh_beef') {
    baseColor = '#b91c1c'
    secondaryColor = '#dc2626'
    fatColor = '#fde8e8'
    glossAlpha = 0.08
  } else if (type === 'subfresh_chicken') {
    baseColor = '#d97757'
    secondaryColor = '#b45309'
    fatColor = '#fef3c7'
    spotsColor = 'rgba(120, 83, 40, 0.35)'
    glossAlpha = 0.22
  } else if (type === 'gelonggongan') {
    baseColor = '#e15b64'
    secondaryColor = '#f43f5e'
    fatColor = '#ffe4e6'
    spotsColor = 'rgba(56, 189, 248, 0.25)'
    glossAlpha = 0.55
  } else {
    baseColor = '#573b26'
    secondaryColor = '#a8a29e'
    fatColor = '#3f4e38'
    spotsColor = 'rgba(77, 124, 15, 0.55)'
    glossAlpha = 0.45
  }

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(85, 65)
  ctx.bezierCurveTo(180, 30, 340, 40, 395, 85)
  ctx.bezierCurveTo(430, 140, 410, 230, 340, 255)
  ctx.bezierCurveTo(220, 275, 110, 260, 75, 200)
  ctx.bezierCurveTo(50, 145, 55, 90, 85, 65)
  ctx.closePath()

  const gradient = ctx.createLinearGradient(70, 50, 400, 260)
  gradient.addColorStop(0, baseColor)
  gradient.addColorStop(0.6, secondaryColor)
  gradient.addColorStop(1, baseColor)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.clip()

  ctx.strokeStyle = fatColor
  for (let i = 0; i < 22; i += 1) {
    const startY = 40 + i * 11
    ctx.lineWidth = i % 4 === 0 ? 3.5 : 1.2
    ctx.globalAlpha = i % 4 === 0 ? 0.65 : 0.22
    ctx.beginPath()
    ctx.moveTo(60, startY)
    ctx.bezierCurveTo(
      180,
      startY + (i % 2 === 0 ? 18 : -15),
      290,
      startY - 12,
      420,
      startY + 15,
    )
    ctx.stroke()
  }

  if (spotsColor) {
    ctx.fillStyle = spotsColor
    ctx.globalAlpha = 0.7
    for (let j = 0; j < 14; j += 1) {
      ctx.beginPath()
      ctx.arc(
        110 + ((j * 23) % 260),
        80 + ((j * 37) % 150),
        14 + (j % 3) * 8,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }

  ctx.globalAlpha = glossAlpha
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(210, 130, 85, 25, -0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(280, 185, 55, 16, 0.2, 0, Math.PI * 2)
  ctx.fill()
  if (type === 'gelonggongan') {
    ctx.beginPath()
    ctx.ellipse(165, 185, 62, 19, -0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(320, 115, 55, 17, 0.18, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(235, 210, 48, 14, 0.05, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
  return analyzeCanvasPixels(ctx, canvas)
}

export function drawImageCover(ctx, canvas, image) {
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  const scale = Math.max(w / image.width, h / image.height)
  const drawW = image.width * scale
  const drawH = image.height * scale
  ctx.drawImage(image, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH)
}

function localVerdict(score) {
  if (score >= 80) {
    return {
      classification: 'GRADE_A_FRESH',
      statusShort: 'GRADE A (SEGAR)',
      title: 'SEGAR OPTIMAL (GRADE A)',
      subtitle:
        'Pigmen oksimioglobin cerah, serat otot padat, memenuhi baku mutu pangan segar.',
      tone: 'emerald',
      recommendation:
        'Layak untuk konsumsi utama maupun distribusi ritel. Simpan pada suhu chiller (0-4 °C) atau bekukan pada -18 °C untuk penyimpanan jangka panjang.',
      shelfLife: { room: '6.0 Jam', chiller: '3 - 4 Hari', freezer: '5 - 6 Bulan' },
    }
  }

  if (score >= 55) {
    return {
      classification: 'GRADE_B_SUBFRESH',
      statusShort: 'GRADE B (SEGERA OLAH)',
      title: 'MULAI MENURUN (GRADE B)',
      subtitle:
        'Terjadi oksidasi parsial pigmen dan penurunan kesegaran akibat suhu/paparan udara.',
      tone: 'amber',
      recommendation:
        'Wajib segera dimasak hingga matang sempurna (suhu internal minimal 75 °C). Tidak disarankan untuk dikonsumsi mentah atau disimpan terlalu lama.',
      shelfLife: {
        room: 'Kurang dari 1.5 Jam',
        chiller: '18 Jam',
        freezer: 'Tidak Disarankan',
      },
    }
  }

  return {
    classification: 'REJECT_SPOILED',
    statusShort: 'REJECT (TIDAK LAYAK)',
    title: 'TIDAK LAYAK KONSUMSI (REJECT)',
    subtitle:
      'Degradasi protein lanjut (TVB-N melampaui ambang aman) atau anomali fisik berbahaya.',
    tone: 'rose',
    recommendation:
      'DILARANG DIKONSUMSI. Pisahkan segera dari bahan pangan lain untuk mencegah kontaminasi silang dan hubungi petugas keamanan pangan.',
    shelfLife: {
      room: '0 Jam (Kedaluwarsa)',
      chiller: '0 Jam (Kedaluwarsa)',
      freezer: '0 Bulan',
    },
  }
}

export function computeLocalResult(form, metrics = DEFAULT_METRICS) {
  const visualScore = metrics?.visualScore ?? DEFAULT_METRICS.visualScore
  const specularity = metrics?.specularity ?? DEFAULT_METRICS.specularity
  const { commodity, temp, hours, surface, aroma } = form

  let textureScore = 95 - specularity * 0.15
  if (surface === 'wet') textureScore = Math.min(textureScore, 52)
  if (surface === 'slimy') textureScore = Math.min(textureScore, 12)

  let thermalPenalty = 0
  if (temp > 4) {
    thermalPenalty = (temp - 4) * 1.35 + hours * (temp > 20 ? 4.2 : 1.5)
  } else if (temp >= 0) {
    thermalPenalty = hours * 0.4
  }
  const thermalScore = clamp(Math.round(100 - thermalPenalty), 5, 100)
  const aromaScore = aroma === 'fresh' ? 98 : aroma === 'neutral' ? 60 : 5

  let total = Math.round(
    0.45 * visualScore + 0.25 * textureScore + 0.2 * thermalScore + 0.1 * aromaScore,
  )

  const rules = []

  if (surface === 'slimy' || aroma === 'ammonia' || visualScore < 30) {
    total = Math.min(total, 22)
    rules.push({
      title: 'RULE-01 TRIGGERED',
      desc: 'Terdeteksi oksidasi metmioglobin tingkat lanjut dan pembentukan lendir/amonia. Daging dikunci pada status tidak layak konsumsi.',
    })
  }

  if (temp >= 25 && hours > 8) {
    total = Math.min(total, 58)
    rules.push({
      title: 'RULE-02 TRIGGERED',
      desc: 'Daging berada di suhu ruang melebihi batas aman 8 jam. Risiko proliferasi bakteri patogen meningkat tajam.',
    })
  }

  if ((surface === 'wet' || specularity > 38) && commodity.includes('Sapi')) {
    total = Math.min(total, 48)
    rules.push({
      title: 'RULE-03 TRIGGERED',
      desc: 'Saturasi pigmen merah pucat disertai indeks spekularitas air permukaan sangat tinggi. Indikasi kuat injeksi air berlebih.',
    })
  }

  total = Math.round(total)
  const verdict = localVerdict(total)

  return {
    inspectionId: createInspectionId(),
    score: total,
    tvbn: Number((4.5 + (100 - total) * 0.38).toFixed(1)),
    oxy: clamp(Math.round(total - 3), 8, 96),
    microbePct: clamp(100 - total, 8, 98),
    microbeLabel: total >= 80 ? 'Rendah' : total >= 55 ? 'Sedang' : 'Tinggi / Kritis',
    ...verdict,
    commodity,
    commodityShort: commodityShortName(commodity),
    rules,
    source: 'Lokal Canvas',
    visualScore,
  }
}

export function mapBackendResult(data) {
  const score = Math.round(data.scores.total_freshness_score)
  const classification = data.classification
  const verdict = localVerdict(score)

  const rules = (data.triggered_rules || []).map((text) => {
    const separator = text.indexOf(':')
    return {
      title: separator >= 0 ? text.slice(0, separator) : text,
      desc: text,
    }
  })

  return {
    ...verdict,
    classification,
    statusShort: statusShortFromClassification(classification),
    inspectionId: data.inspection_id,
    score,
    tvbn: data.biomarkers.estimated_tvbn_mg100g,
    oxy: Math.round(data.biomarkers.oxymyoglobin_ratio_pct),
    microbePct: clamp(100 - score, 8, 98),
    microbeLabel: data.biomarkers.microbial_risk_level,
    recommendation: data.recommendation,
    shelfLife: {
      room: data.shelf_life.room_temp_28c,
      chiller: data.shelf_life.chiller_4c,
      freezer: data.shelf_life.freezer_minus18c,
    },
    commodity: data.commodity,
    commodityShort: commodityShortName(data.commodity),
    batchId: data.batch_id ?? null,
    batchName: data.batch_name ?? null,
    rules,
    source: 'FastAPI CIELAB + GLCM',
    visualScore: data.scores.color_score,
  }
}

export function toAuditRecord(result) {
  return {
    id: result.inspectionId,
    timestamp: new Date().toISOString(),
    commodity: result.commodity,
    score: result.score,
    tvbn: result.tvbn,
    status: result.statusShort,
    source: result.source,
    batchId: result.batchId ?? null,
    batchName: result.batchName ?? null,
  }
}

export function fromHistoryRecord(item) {
  return {
    id: item.inspection_id,
    timestamp: item.timestamp,
    commodity: item.commodity,
    score: Math.round(item.scores.total_freshness_score),
    tvbn: item.biomarkers.estimated_tvbn_mg100g,
    status: statusShortFromClassification(item.classification),
    source: 'FastAPI CIELAB + GLCM',
    batchId: item.batch_id ?? null,
    batchName: item.batch_name ?? null,
  }
}
