import uuid
from datetime import UTC, datetime

import cv2
import numpy as np

from freshmeat_core.exceptions import InvalidImageError
from freshmeat_core.schemas import InspectionResponse
from freshmeat_core.scoring import apply_safety_rules, build_verdict, evaluate_scores
from freshmeat_core.vision import (
    compute_glcm_and_moisture,
    extract_cielab_features,
    segment_meat_roi,
)


def analyze_sample(
    image_bytes: bytes,
    *,
    commodity: str,
    storage_temp: float,
    exposure_hours: float,
    surface_condition: str,
    aroma_condition: str,
) -> InspectionResponse:
    """Jalankan pipeline computer vision dan decision fusion untuk satu sampel."""
    np_arr = np.frombuffer(image_bytes, np.uint8)
    bgr_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if bgr_img is None:
        raise InvalidImageError("File citra tidak valid atau gagal didekode.")

    bgr_resized = cv2.resize(bgr_img, (480, 360), interpolation=cv2.INTER_AREA)

    roi_mask = segment_meat_roi(bgr_resized)
    cielab = extract_cielab_features(bgr_resized, roi_mask)
    glcm = compute_glcm_and_moisture(bgr_resized, roi_mask)

    scores = evaluate_scores(
        cielab,
        glcm,
        storage_temp,
        exposure_hours,
        surface_condition,
        aroma_condition,
    )
    scores, triggered_rules = apply_safety_rules(
        scores,
        cielab,
        glcm,
        commodity,
        storage_temp,
        exposure_hours,
        surface_condition,
        aroma_condition,
    )

    s_total = scores["total_freshness_score"]
    estimated_tvbn = round(4.5 + ((100.0 - s_total) * 0.38), 2)
    microbial_risk = (
        "Rendah"
        if s_total >= 80
        else ("Sedang" if s_total >= 55 else "Tinggi / Kritis")
    )

    verdict = build_verdict(s_total)

    return InspectionResponse(
        inspection_id=(
            f"FM-{datetime.now(UTC).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        ),
        timestamp=datetime.now(UTC).isoformat(),
        commodity=commodity,
        cielab_features=cielab,
        glcm_features=glcm,
        biomarkers={
            "oxymyoglobin_ratio_pct": cielab["oxymyoglobin_pct"],
            "estimated_tvbn_mg100g": estimated_tvbn,
            "microbial_risk_level": microbial_risk,
        },
        scores=scores,
        classification=verdict["classification"],
        status_label=verdict["status_label"],
        shelf_life=verdict["shelf_life"],
        triggered_rules=triggered_rules,
        recommendation=verdict["recommendation"],
    )
