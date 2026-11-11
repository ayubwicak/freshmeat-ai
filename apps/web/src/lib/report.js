function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function exportAuditJson(logs) {
  const payload = JSON.stringify(logs, null, 2)
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'FreshMeat_AI_Audit_Report.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function printCertificate(result, logs = []) {
  if (!result) {
    window.alert('Belum ada hasil inspeksi untuk dicetak.')
    return
  }

  const certificateId = logs[0]?.id ?? result.inspectionId
  const batchName = logs[0]?.batchName ?? result.batchName
  const timestamp = new Date().toLocaleString('id-ID')
  const rulesHtml =
    result.rules.length > 0
      ? `<div class="note"><strong>Peringatan:</strong> ${escapeHtml(
          result.rules.map((rule) => rule.title).join(' | '),
        )}</div>`
      : ''

  const win = window.open('', '_blank')
  if (!win) {
    window.alert('Popup diblokir browser. Izinkan popup untuk mencetak sertifikat.')
    return
  }

  win.document.write(
    `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">` +
      `<title>Sertifikat Inspeksi ${escapeHtml(certificateId)}</title>` +
      `<style>` +
      `body{font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;padding:40px;}` +
      `.sheet{max-width:760px;margin:0 auto;background:#fff;border:2px solid #10b981;border-radius:16px;padding:40px;box-shadow:0 20px 60px rgba(15,23,42,.12);}` +
      `.brand{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:18px;}` +
      `h1{margin:0;font-size:24px;color:#047857;}h2{margin:6px 0 0;font-size:13px;font-weight:500;color:#64748b;}` +
      `.id{text-align:right;font-size:12px;color:#475569;}.id strong{display:block;font-size:16px;color:#0f172a;}` +
      `table{width:100%;border-collapse:collapse;margin-top:26px;font-size:14px;}` +
      `td{padding:10px 8px;border-bottom:1px solid #e2e8f0;}td:first-child{color:#64748b;width:38%;}` +
      `.score{font-size:42px;font-weight:800;color:#047857;margin:24px 0 0;}` +
      `.note{margin-top:22px;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;font-size:12px;color:#9a3412;}` +
      `.disclaimer{margin-top:28px;font-size:10px;color:#94a3b8;line-height:1.5;}` +
      `.sign{margin-top:46px;display:flex;justify-content:space-between;font-size:12px;color:#475569;}` +
      `</style></head><body><div class="sheet">` +
      `<div class="brand"><div><h1>FreshMeat AI</h1><h2>Sertifikat Inspeksi Kesegaran Daging</h2></div>` +
      `<div class="id">ID Inspeksi<strong>${escapeHtml(certificateId)}</strong>${escapeHtml(timestamp)}</div></div>` +
      `<p class="score">${escapeHtml(result.score)}/100</p>` +
      `<p style="margin:0;font-weight:700;font-size:18px;">${escapeHtml(result.title)}</p>` +
      `<p style="margin:6px 0 0;color:#475569;font-size:13px;">${escapeHtml(result.subtitle)}</p>` +
      `<table>` +
      `<tr><td>Komoditas</td><td>${escapeHtml(result.commodity)}</td></tr>` +
      (batchName
        ? `<tr><td>Batch</td><td>${escapeHtml(batchName)}</td></tr>`
        : '') +
      `<tr><td>Estimasi TVB-N</td><td>${escapeHtml(result.tvbn)} mg/100g</td></tr>` +
      `<tr><td>Oksimioglobin</td><td>${escapeHtml(result.oxy)}%</td></tr>` +
      `<tr><td>Risiko Mikroba</td><td>${escapeHtml(result.microbeLabel)}</td></tr>` +
      `<tr><td>Shelf-life Suhu Ruang</td><td>${escapeHtml(result.shelfLife.room)}</td></tr>` +
      `<tr><td>Shelf-life Chiller</td><td>${escapeHtml(result.shelfLife.chiller)}</td></tr>` +
      `<tr><td>Shelf-life Freezer</td><td>${escapeHtml(result.shelfLife.freezer)}</td></tr>` +
      `<tr><td>Rekomendasi</td><td>${escapeHtml(result.recommendation)}</td></tr>` +
      `</table>${rulesHtml}` +
      `<div class="sign"><div>Petugas Inspeksi<br><br>________________________</div>` +
      `<div>FreshMeat AI<br><br>________________________</div></div>` +
      `<p class="disclaimer">Dokumen ini dihasilkan secara otomatis oleh prototipe FreshMeat AI dan bukan pengganti uji laboratorium resmi (TVB-N, mikrobiologi, dan sensori).</p>` +
      `</div></body></html>`,
  )
  win.document.close()
  win.focus()
  window.setTimeout(() => win.print(), 350)
}
