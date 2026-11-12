import cv2
import numpy as np

from freshmeat_core.exceptions import ROINotDetectedError

# Ambang pemisahan lemak/marbling dari jaringan otot. Marbling wagyu berwarna
# putih krem dengan a* rendah, sehingga tidak boleh dihitung sebagai daging
# pucat/diskolorasi atau sebagai pantulan air.
_FAT_MIN_LIGHTNESS = 62.0
_FAT_MAX_A_STAR = 8.0
_FAT_MAX_CHROMA = 22.0
_FAT_MAX_SATURATION = 70.0

# Diskolorasi metmioglobin: otot kehilangan rona merah (a* turun) dan bergeser
# ke hue cokelat/kekuningan.
_DISCOLOR_MAX_A_STAR = 22.0
_DISCOLOR_MIN_HUE = 40.0
_DISCOLOR_MIN_LIGHTNESS = 20.0
_DISCOLOR_MIN_CHROMA = 15.0

# Specular highlight harus benar-benar terang dan hampir tanpa saturasi.
_SPECULAR_MIN_VALUE = 235
_SPECULAR_MAX_SATURATION = 45


def _fill_largest_contour(mask: np.ndarray) -> np.ndarray:
    """Ambil kontur terbesar lalu isi lubangnya agar marbling ikut masuk ROI."""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return mask

    largest = max(contours, key=cv2.contourArea)
    filled = np.zeros_like(mask)
    cv2.drawContours(filled, [largest], -1, 255, thickness=cv2.FILLED)
    return filled


def _keep_large_components(mask: np.ndarray, min_area: int) -> np.ndarray:
    """Pertahankan komponen besar (lemak) dan buang bintik highlight kecil."""
    mask_u8 = mask.astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask_u8, connectivity=8)

    kept = np.zeros_like(mask_u8)
    for label in range(1, count):
        if stats[label, cv2.CC_STAT_AREA] >= min_area:
            kept[labels == label] = 255
    return kept.astype(bool)


def segment_meat_roi(bgr_img: np.ndarray) -> np.ndarray:
    """Segmentasi jaringan otot daging dari latar belakang wadah.

    Mask awal hanya mengambil rona merah/pink/cokelat yang tersaturasi. Setelah
    itu kontur terbesar diisi (termasuk marbling putih di dalam steak) supaya
    daging wagyu bermarbling tinggi tetap dianalisis sebagai satu sampel utuh.
    """
    hsv = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)

    # Rentang hue merah/pink/cokelat (OpenCV H: 0-180).
    red_low = cv2.inRange(hsv, np.array([0, 30, 30]), np.array([28, 255, 255]))
    red_high = cv2.inRange(hsv, np.array([155, 30, 30]), np.array([180, 255, 255]))
    mask_valid = cv2.bitwise_or(red_low, red_high)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask_clean = cv2.morphologyEx(mask_valid, cv2.MORPH_OPEN, kernel, iterations=1)

    # Tutup celah antar-serat dan sambungkan area otot yang terpisah marbling.
    bridge = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    mask_clean = cv2.morphologyEx(mask_clean, cv2.MORPH_CLOSE, bridge, iterations=2)
    mask_clean = _fill_largest_contour(mask_clean)

    h, w = bgr_img.shape[:2]
    if np.count_nonzero(mask_clean) < (h * w * 0.10):
        mask_clean = np.zeros((h, w), dtype=np.uint8)
        mask_clean[int(h * 0.1) : int(h * 0.9), int(w * 0.1) : int(w * 0.9)] = 255

    return mask_clean


def _build_pixel_masks(
    bgr_img: np.ndarray, roi_mask: np.ndarray
) -> tuple[
    np.ndarray,
    np.ndarray,
    np.ndarray,
    np.ndarray,
    np.ndarray,
    np.ndarray,
    np.ndarray,
]:
    """Pisahkan piksel otot dari lemak/marbling dan latar yang ikut terambil."""
    lab_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB).astype(np.float32)
    hsv_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)

    l_channel = lab_img[:, :, 0] * (100.0 / 255.0)
    a_channel = lab_img[:, :, 1] - 128.0
    b_channel = lab_img[:, :, 2] - 128.0
    chroma = np.sqrt(a_channel**2 + b_channel**2)
    saturation = hsv_img[:, :, 1].astype(np.float32) * (100.0 / 255.0)

    roi_bool = roi_mask > 0
    if not np.any(roi_bool):
        raise ROINotDetectedError("ROI daging tidak terdeteksi.")

    fat_candidate = (
        roi_bool
        & (l_channel > _FAT_MIN_LIGHTNESS)
        & (a_channel < _FAT_MAX_A_STAR)
        & (chroma < _FAT_MAX_CHROMA)
        & (saturation < _FAT_MAX_SATURATION)
    )
    min_fat_area = max(20, int(np.count_nonzero(roi_bool) * 0.0015))
    fat_mask = _keep_large_components(fat_candidate, min_fat_area)

    # Jika hampir seluruh ROI "lemak", sampel sebenarnya adalah jaringan yang
    # sangat pucat (mis. ikan putih), bukan steak bermarbling. Jangan buang
    # seluruh piksel sebagai lemak.
    if np.count_nonzero(fat_mask) > np.count_nonzero(roi_bool) * 0.90:
        fat_mask = np.zeros_like(fat_mask)

    # Sisa piksel yang terlalu terang dan hampir tanpa warna biasanya latar
    # putih yang ikut masuk saat fallback ROI, bukan jaringan otot.
    background_like = (l_channel > 80.0) & (chroma < 8.0) & (saturation < 20.0)
    muscle_mask = roi_bool & ~fat_mask & ~background_like

    min_muscle = max(50, int(np.count_nonzero(roi_bool) * 0.15))
    if np.count_nonzero(muscle_mask) < min_muscle:
        muscle_mask = roi_bool & ~fat_mask
    if np.count_nonzero(muscle_mask) < 50:
        muscle_mask = roi_bool

    return (
        l_channel,
        a_channel,
        b_channel,
        chroma,
        hsv_img,
        fat_mask,
        muscle_mask,
    )


def extract_cielab_features(
    bgr_img: np.ndarray, roi_mask: np.ndarray
) -> dict[str, float]:
    """Ekstraksi L*, a*, b*, chroma, hue, diskolorasi, oksimioglobin, marbling.

    Statistik warna hanya dihitung pada piksel otot. Lemak marbling (putih)
    dikeluarkan karena a* rendah pada lemak bukan indikator pembusukan.
    """
    (
        l_channel,
        a_channel,
        b_channel,
        _chroma,
        _hsv,
        fat_mask,
        muscle_mask,
    ) = _build_pixel_masks(bgr_img, roi_mask)

    l_roi = l_channel[muscle_mask]
    a_roi = a_channel[muscle_mask]
    b_roi = b_channel[muscle_mask]

    if l_roi.size == 0:
        raise ROINotDetectedError("ROI daging tidak terdeteksi.")

    l_mean = float(np.mean(l_roi))
    a_mean = float(np.mean(a_roi))
    b_mean = float(np.mean(b_roi))

    chroma = float(np.sqrt(a_mean**2 + b_mean**2))
    hue_deg = float(np.degrees(np.arctan2(b_mean, a_mean)) % 360.0)

    # Metmioglobin cenderung cokelat: a* turun, hue bergeser ke > 40 derajat,
    # tetapi chroma masih cukup tinggi. Jaringan putih (ikan/daging sangat
    # pucat) tidak boleh dianggap sebagai diskolorasi.
    hue_pixels = np.degrees(np.arctan2(b_roi, a_roi)) % 360.0
    chroma_pixels = np.sqrt(a_roi**2 + b_roi**2)
    discolored_pixels = (
        (a_roi < _DISCOLOR_MAX_A_STAR)
        & (hue_pixels > _DISCOLOR_MIN_HUE)
        & (l_roi > _DISCOLOR_MIN_LIGHTNESS)
        & (chroma_pixels > _DISCOLOR_MIN_CHROMA)
    )
    discoloration_ratio = float(
        (np.count_nonzero(discolored_pixels) / max(l_roi.size, 1)) * 100.0
    )

    oxymyoglobin_pct = float(
        np.clip(50.0 + (a_mean * 1.65) - (discoloration_ratio * 0.8), 5.0, 98.0)
    )

    roi_pixels = max(np.count_nonzero(roi_mask > 0), 1)
    marbling_ratio = float((np.count_nonzero(fat_mask) / roi_pixels) * 100.0)

    return {
        "L_star": round(l_mean, 2),
        "a_star": round(a_mean, 2),
        "b_star": round(b_mean, 2),
        "chroma": round(chroma, 2),
        "hue_angle": round(hue_deg, 2),
        "discoloration_ratio_pct": round(discoloration_ratio, 2),
        "oxymyoglobin_pct": round(oxymyoglobin_pct, 2),
        "marbling_ratio_pct": round(marbling_ratio, 2),
    }


def compute_glcm_and_moisture(
    bgr_img: np.ndarray, roi_mask: np.ndarray
) -> dict[str, float]:
    """GLCM tervektorisasi (d=1, 0 derajat) dan indeks spesularitas permukaan."""
    (
        _l_channel,
        _a_channel,
        _b_channel,
        _chroma,
        hsv,
        fat_mask,
        muscle_mask,
    ) = _build_pixel_masks(bgr_img, roi_mask)

    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    levels = 32
    quantized = (gray // (256 // levels)).astype(np.int32)

    p1 = quantized[:, :-1].flatten()
    p2 = quantized[:, 1:].flatten()
    mask_flat = muscle_mask[:, :-1].flatten()

    p1_roi = p1[mask_flat]
    p2_roi = p2[mask_flat]

    glcm = np.zeros((levels, levels), dtype=np.float64)
    np.add.at(glcm, (p1_roi, p2_roi), 1)
    glcm = glcm + glcm.T

    total_pairs = np.sum(glcm)
    if total_pairs > 0:
        glcm /= total_pairs

    idx = np.arange(levels)
    i_mat, j_mat = np.meshgrid(idx, idx, indexing="ij")

    contrast = float(np.sum(glcm * ((i_mat - j_mat) ** 2)))
    homogeneity = float(np.sum(glcm / (1.0 + ((i_mat - j_mat) ** 2))))
    energy = float(np.sum(glcm**2))

    mu_i = float(np.sum(i_mat * glcm))
    mu_j = float(np.sum(j_mat * glcm))
    sigma_i = float(np.sqrt(np.sum(((i_mat - mu_i) ** 2) * glcm)))
    sigma_j = float(np.sqrt(np.sum(((j_mat - mu_j) ** 2) * glcm)))

    denominator = sigma_i * sigma_j
    if denominator > 1e-6:
        correlation = float(
            np.sum((i_mat - mu_i) * (j_mat - mu_j) * glcm) / denominator
        )
    else:
        correlation = 1.0

    # Highlight specular hanya dihitung pada ROI dan tidak boleh tertukar
    # dengan lemak marbling yang juga terang tetapi tidak memantulkan cahaya.
    roi_pixels = np.count_nonzero(roi_mask)
    specular_pixels = np.count_nonzero(
        (hsv[:, :, 2] >= _SPECULAR_MIN_VALUE)
        & (hsv[:, :, 1] <= _SPECULAR_MAX_SATURATION)
        & (roi_mask > 0)
        & ~fat_mask
    )
    specularity_pct = float((specular_pixels / max(roi_pixels, 1)) * 100.0)

    return {
        "contrast": round(contrast, 4),
        "homogeneity": round(homogeneity, 4),
        "energy": round(energy, 4),
        "correlation": round(correlation, 4),
        "specularity_wetness_pct": round(min(specularity_pct, 98.0), 2),
    }
