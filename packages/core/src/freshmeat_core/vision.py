import cv2
import numpy as np

from freshmeat_core.exceptions import ROINotDetectedError


def segment_meat_roi(bgr_img: np.ndarray) -> np.ndarray:
    """Segmentasi jaringan otot daging dari latar belakang wadah."""
    hsv = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)
    mask_valid = cv2.inRange(hsv, np.array([0, 22, 35]), np.array([180, 255, 250]))

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask_clean = cv2.morphologyEx(mask_valid, cv2.MORPH_OPEN, kernel, iterations=1)
    mask_clean = cv2.morphologyEx(mask_clean, cv2.MORPH_CLOSE, kernel, iterations=2)

    h, w = bgr_img.shape[:2]
    if np.count_nonzero(mask_clean) < (h * w * 0.15):
        mask_clean = np.zeros((h, w), dtype=np.uint8)
        mask_clean[int(h * 0.1) : int(h * 0.9), int(w * 0.1) : int(w * 0.9)] = 255

    return mask_clean


def extract_cielab_features(
    bgr_img: np.ndarray, roi_mask: np.ndarray
) -> dict[str, float]:
    """Ekstraksi L*, a*, b*, chroma, hue, diskolorasi, dan oksimioglobin."""
    lab_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB).astype(np.float32)

    l_channel = lab_img[:, :, 0] * (100.0 / 255.0)
    a_channel = lab_img[:, :, 1] - 128.0
    b_channel = lab_img[:, :, 2] - 128.0

    roi_bool = roi_mask > 0
    l_roi = l_channel[roi_bool]
    a_roi = a_channel[roi_bool]
    b_roi = b_channel[roi_bool]

    if l_roi.size == 0:
        raise ROINotDetectedError("ROI daging tidak terdeteksi.")

    l_mean = float(np.mean(l_roi))
    a_mean = float(np.mean(a_roi))
    b_mean = float(np.mean(b_roi))

    chroma = float(np.sqrt(a_mean**2 + b_mean**2))
    hue_deg = float(np.degrees(np.arctan2(b_mean, a_mean)) % 360.0)

    discolored_pixels = np.sum(a_roi <= 4.0)
    discoloration_ratio = float((discolored_pixels / max(len(a_roi), 1)) * 100.0)

    oxymyoglobin_pct = float(
        np.clip(50.0 + (a_mean * 1.65) - (discoloration_ratio * 0.8), 5.0, 98.0)
    )

    return {
        "L_star": round(l_mean, 2),
        "a_star": round(a_mean, 2),
        "b_star": round(b_mean, 2),
        "chroma": round(chroma, 2),
        "hue_angle": round(hue_deg, 2),
        "discoloration_ratio_pct": round(discoloration_ratio, 2),
        "oxymyoglobin_pct": round(oxymyoglobin_pct, 2),
    }


def compute_glcm_and_moisture(
    bgr_img: np.ndarray, roi_mask: np.ndarray
) -> dict[str, float]:
    """GLCM tervektorisasi (d=1, 0 derajat) dan indeks spesularitas permukaan."""
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    levels = 32
    quantized = (gray // (256 // levels)).astype(np.int32)

    p1 = quantized[:, :-1].flatten()
    p2 = quantized[:, 1:].flatten()
    mask_flat = (roi_mask[:, :-1] > 0).flatten()

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

    hsv = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)
    roi_pixels = np.count_nonzero(roi_mask)
    specular_pixels = np.count_nonzero(
        (hsv[:, :, 2] > 210) & (hsv[:, :, 1] < 75) & (roi_mask > 0)
    )
    specularity_pct = float((specular_pixels / max(roi_pixels, 1)) * 100.0)

    return {
        "contrast": round(contrast, 4),
        "homogeneity": round(homogeneity, 4),
        "energy": round(energy, 4),
        "correlation": round(correlation, 4),
        "specularity_wetness_pct": round(min(specularity_pct * 2.0, 98.0), 2),
    }
