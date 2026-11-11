from typing import Any

import numpy as np


def _normalize_condition(
    value: str | None,
    *,
    default: str,
    aliases: dict[str, str],
) -> str:
    """Normalisasi input kondisi agar sensitif terhadap casing dan whitespace."""
    if value is None:
        return default

    normalized = value.strip().lower()
    if not normalized:
        return default
    return aliases.get(normalized, normalized)


def evaluate_scores(
    cielab: dict[str, float],
    glcm: dict[str, float],
    storage_temp: float,
    exposure_hours: float,
    surface_condition: str,
    aroma_condition: str,
) -> dict[str, float]:
    """Hitung empat komponen skor dan skor total berbobot sesuai SDD."""
    surface = _normalize_condition(
        surface_condition,
        default="normal",
        aliases={
            "normal": "normal",
            "dry": "normal",
            "moist": "normal",
            "wet": "wet",
            "slimy": "slimy",
            "gelatinous": "slimy",
        },
    )
    aroma = _normalize_condition(
        aroma_condition,
        default="fresh",
        aliases={
            "fresh": "fresh",
            "neutral": "neutral",
            "ammonia": "ammonia",
            "ammoniac": "ammonia",
            "ammonia-like": "ammonia",
        },
    )

    s_warna = float(
        np.clip(cielab["oxymyoglobin_pct"] + (cielab["a_star"] * 0.4), 10.0, 99.0)
    )

    base_texture = 92.0 - (glcm["specularity_wetness_pct"] * 0.45)
    if surface == "wet":
        base_texture = min(base_texture, 54.0)
    elif surface == "slimy":
        base_texture = min(base_texture, 15.0)
    s_tekstur = float(np.clip(base_texture, 8.0, 98.0))

    thermal_penalty = 0.0
    if storage_temp > 4.0:
        multiplier = 4.2 if storage_temp > 20.0 else 1.5
        thermal_penalty = ((storage_temp - 4.0) * 1.35) + (exposure_hours * multiplier)
    elif storage_temp >= 0.0:
        thermal_penalty = exposure_hours * 0.4
    s_suhu = float(np.clip(100.0 - thermal_penalty, 5.0, 100.0))

    aroma_map = {"fresh": 98.0, "neutral": 60.0, "ammonia": 5.0}
    s_aroma = aroma_map.get(aroma, 90.0)

    s_total = round(
        (0.45 * s_warna) + (0.25 * s_tekstur) + (0.20 * s_suhu) + (0.10 * s_aroma),
        1,
    )

    return {
        "color_score": round(s_warna, 1),
        "texture_score": round(s_tekstur, 1),
        "thermal_score": round(s_suhu, 1),
        "aroma_score": round(s_aroma, 1),
        "total_freshness_score": s_total,
    }


def apply_safety_rules(
    scores: dict[str, float],
    cielab: dict[str, float],
    glcm: dict[str, float],
    commodity: str,
    storage_temp: float,
    exposure_hours: float,
    surface_condition: str,
    aroma_condition: str,
) -> tuple[dict[str, float], list[str]]:
    """Terapkan hard override rules (RULE-01..03) pada skor total."""
    triggered: list[str] = []
    total = scores["total_freshness_score"]
    surface = _normalize_condition(
        surface_condition,
        default="normal",
        aliases={
            "normal": "normal",
            "dry": "normal",
            "moist": "normal",
            "wet": "wet",
            "slimy": "slimy",
            "gelatinous": "slimy",
        },
    )
    aroma = _normalize_condition(
        aroma_condition,
        default="fresh",
        aliases={
            "fresh": "fresh",
            "neutral": "neutral",
            "ammonia": "ammonia",
            "ammoniac": "ammonia",
            "ammonia-like": "ammonia",
        },
    )
    commodity_name = (commodity or "").strip().lower()

    if (
        surface == "slimy"
        or aroma == "ammonia"
        or cielab["discoloration_ratio_pct"] > 18.0
    ):
        total = min(total, 20.0)
        triggered.append(
            "RULE-01: Deteksi Pembusukan Lanjut (Oksidasi Metmioglobin > 18% "
            "atau Biofilm Lendir/Amonia Aktif)."
        )

    if storage_temp >= 25.0 and exposure_hours > 8.0:
        total = min(total, 58.0)
        triggered.append(
            "RULE-02: Batas Zona Bahaya Termal Terlampaui (Paparan suhu ruang "
            "> 25C selama lebih dari 8 jam)."
        )

    if (
        "sapi" in commodity_name
        and (surface == "wet" or glcm["specularity_wetness_pct"] > 38.0)
        and cielab["L_star"] > 48.0
    ):
        total = min(total, 48.0)
        triggered.append(
            "RULE-03: Indikasi Anomali Daging Gelonggongan (Luminansi L* pucat "
            "disertai indeks air permukaan tinggi)."
        )

    scores["total_freshness_score"] = round(total, 1)
    return scores, triggered


def build_verdict(score: float) -> dict[str, Any]:
    """Petakan skor total ke klasifikasi, label, shelf-life, dan rekomendasi."""
    if score >= 80.0:
        return {
            "classification": "GRADE_A_FRESH",
            "status_label": "SEGAR OPTIMAL (GRADE A)",
            "shelf_life": {
                "room_temp_28c": "6.0 Jam",
                "chiller_4c": "3 - 4 Hari",
                "freezer_minus18c": "5 - 6 Bulan",
            },
            "recommendation": (
                "Layak untuk konsumsi utama dan distribusi ritel. Pertahankan rantai "
                "dingin pada suhu chiller (0-4C) atau bekukan pada suhu -18C."
            ),
        }
    if score >= 55.0:
        return {
            "classification": "GRADE_B_SUBFRESH",
            "status_label": "MULAI MENURUN (GRADE B)",
            "shelf_life": {
                "room_temp_28c": "Kurang dari 1.5 Jam",
                "chiller_4c": "18 Jam",
                "freezer_minus18c": "Tidak Disarankan",
            },
            "recommendation": (
                "Wajib segera diolah hingga matang sempurna (suhu internal minimal "
                "75C). Jangan dibekukan ulang untuk menghindari kerusakan struktur sel."
            ),
        }
    return {
        "classification": "REJECT_SPOILED",
        "status_label": "TIDAK LAYAK KONSUMSI (REJECT)",
        "shelf_life": {
            "room_temp_28c": "0 Jam (Kedaluwarsa)",
            "chiller_4c": "0 Jam (Kedaluwarsa)",
            "freezer_minus18c": "0 Bulan",
        },
        "recommendation": (
            "DILARANG DIKONSUMSI. Nilai estimasi TVB-N melampaui ambang batas aman. "
            "Pisahkan segera dari bahan pangan lain untuk mencegah kontaminasi silang."
        ),
    }
