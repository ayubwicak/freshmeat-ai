import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
WEB_DIST = Path(
    os.getenv("FRESHMEAT_WEB_DIST", str(REPO_ROOT / "apps" / "web" / "dist"))
)

APP_TITLE = "FreshMeat AI - Vision & Biomarker Engine"
APP_DESCRIPTION = (
    "Backend API untuk ekstraksi fitur warna CIELAB, tekstur GLCM, "
    "dan estimasi masa simpan daging."
)
APP_VERSION = "1.0.0"
ENGINE_NAME = "OpenCV-CIELAB-GLCM v1.0"


def cors_origins() -> list[str]:
    raw = os.getenv("FRESHMEAT_CORS_ORIGINS", "*")
    return [item.strip() for item in raw.split(",") if item.strip()]
