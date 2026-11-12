import cv2
import numpy as np
from freshmeat_core.vision import (
    extract_cielab_features,
    segment_meat_roi,
)


def build_steak(
    base_bgr: tuple[int, int, int],
    marbling_bgr: tuple[int, int, int] | None = None,
) -> np.ndarray:
    img = np.full((360, 480, 3), (245, 245, 245), dtype=np.uint8)
    cv2.ellipse(img, (240, 180), (185, 120), 0, 0, 360, base_bgr, -1)

    if marbling_bgr is not None:
        for index in range(20):
            y = 75 + index * 11
            cv2.line(
                img,
                (70, y),
                (410, y + ((index % 3) - 1) * 8),
                marbling_bgr,
                3,
                cv2.LINE_AA,
            )

    cv2.ellipse(img, (205, 140), (70, 22), -12, 0, 360, (255, 255, 255), -1)
    return img


def test_wagyu_marbling_is_not_counted_as_discoloration():
    bgr = build_steak((40, 40, 150), (225, 235, 245))
    roi = segment_meat_roi(bgr)

    features = extract_cielab_features(bgr, roi)

    assert features["marbling_ratio_pct"] > 10
    assert features["a_star"] > 25
    assert features["discoloration_ratio_pct"] < 18


def test_brown_meat_is_counted_as_discolored_muscle():
    bgr = build_steak((30, 60, 110))
    roi = segment_meat_roi(bgr)

    features = extract_cielab_features(bgr, roi)

    assert features["a_star"] < 30
    assert features["discoloration_ratio_pct"] > 50


def test_very_pale_white_tissue_is_not_discoloration():
    bgr = build_steak((210, 225, 235), (190, 210, 225))
    roi = segment_meat_roi(bgr)

    features = extract_cielab_features(bgr, roi)

    assert features["marbling_ratio_pct"] < 90
    assert features["discoloration_ratio_pct"] < 18
