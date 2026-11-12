import os
import sqlite3
import tempfile
from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

TEST_DB_PATH = Path(tempfile.mkdtemp(prefix="freshmeat-ai-tests-")) / "audit.db"
os.environ["FRESHMEAT_DB_PATH"] = str(TEST_DB_PATH)


def build_meat_jpeg(
    base_bgr: tuple[int, int, int],
    marbling_bgr: tuple[int, int, int],
    highlight_bgr: tuple[int, int, int],
) -> bytes:
    img = np.full((360, 480, 3), (12, 14, 24), dtype=np.uint8)
    cv2.ellipse(img, (240, 180), (178, 115), 0, 0, 360, base_bgr, -1)
    for i in range(10):
        cv2.line(img, (90, 100 + i * 16), (390, 105 + i * 16), marbling_bgr, 1)
    cv2.ellipse(img, (220, 150), (50, 14), -10, 0, 360, highlight_bgr, -1)

    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    assert ok
    return buf.tobytes()


@pytest.fixture(scope="session")
def client() -> TestClient:
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_database() -> None:
    from app.storage import get_db_path, init_db

    init_db()
    connection = sqlite3.connect(get_db_path())
    try:
        connection.execute("DELETE FROM inspections")
        connection.execute("DELETE FROM batches")
        connection.commit()
    finally:
        connection.close()


@pytest.fixture(scope="session")
def fresh_meat_jpeg() -> bytes:
    return build_meat_jpeg(
        base_bgr=(35, 35, 185),
        marbling_bgr=(120, 120, 210),
        highlight_bgr=(190, 190, 235),
    )


@pytest.fixture(scope="session")
def pale_meat_jpeg() -> bytes:
    return build_meat_jpeg(
        base_bgr=(150, 150, 220),
        marbling_bgr=(110, 110, 190),
        highlight_bgr=(200, 200, 240),
    )


def build_wagyu_jpeg() -> bytes:
    """Wagyu segar: otot merah pekat dengan marbling putih tebal dan kilap."""
    img = np.full((360, 480, 3), (245, 245, 245), dtype=np.uint8)
    cv2.ellipse(img, (240, 180), (185, 120), 0, 0, 360, (40, 40, 150), -1)

    offsets = [
        -4,
        6,
        -8,
        3,
        -2,
        7,
        -5,
        2,
        -7,
        5,
        -3,
        4,
        -6,
        1,
        -2,
        6,
        -4,
        3,
        -5,
        2,
        -1,
        4,
        -3,
        5,
    ]
    for index, dy in enumerate(offsets):
        y = 72 + index * 9 + dy
        points = np.array(
            [[70, y], [150, y + dy], [250, y - dy], [330, y + dy], [415, y]],
            dtype=np.int32,
        )
        cv2.polylines(
            img,
            [points],
            False,
            (225, 235, 245),
            2 + (index % 3),
            cv2.LINE_AA,
        )

    cv2.ellipse(img, (205, 140), (70, 22), -12, 0, 360, (255, 255, 255), -1)
    cv2.ellipse(img, (300, 215), (48, 15), 15, 0, 360, (255, 255, 255), -1)

    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    assert ok
    return buf.tobytes()


@pytest.fixture(scope="session")
def fresh_wagyu_jpeg() -> bytes:
    return build_wagyu_jpeg()


def analyze(
    client: TestClient,
    image_bytes: bytes,
    **overrides: str,
) -> dict:
    data = {
        "commodity": "Sapi (Beef Sirloin/Tenderloin)",
        "storage_temp": "4",
        "exposure_hours": "1.5",
        "surface_condition": "normal",
        "aroma_condition": "fresh",
    }
    data.update(overrides)
    response = client.post(
        "/api/v1/analyze",
        files={"file": ("specimen.jpg", image_bytes, "image/jpeg")},
        data=data,
    )
    assert response.status_code == 200, response.text
    return response.json()
