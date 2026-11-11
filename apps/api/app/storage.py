import json
import os
import sqlite3
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "freshmeat.db"


def get_db_path() -> Path:
    return Path(os.getenv("FRESHMEAT_DB_PATH", str(DEFAULT_DB_PATH)))


def init_db() -> None:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(db_path)
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS inspections (
                inspection_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                commodity TEXT NOT NULL,
                classification TEXT NOT NULL,
                status_label TEXT NOT NULL,
                score REAL NOT NULL,
                tvbn REAL NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS batches (
                batch_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                commodity TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(inspections)").fetchall()
        }
        if "batch_id" not in columns:
            connection.execute("ALTER TABLE inspections ADD COLUMN batch_id TEXT")
        if "batch_name" not in columns:
            connection.execute("ALTER TABLE inspections ADD COLUMN batch_name TEXT")

        connection.commit()
    finally:
        connection.close()


def create_batch(name: str | None, commodity: str) -> dict[str, Any]:
    now = datetime.now(UTC)
    batch_id = f"BT-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    short_commodity = commodity.split(" (")[0]
    default_name = f"Batch {short_commodity} · {now.strftime('%d-%m-%Y')}"
    record = {
        "batch_id": batch_id,
        "name": (name or "").strip() or default_name,
        "commodity": commodity,
        "created_at": now.isoformat(),
    }

    connection = sqlite3.connect(get_db_path())
    try:
        connection.execute(
            """
            INSERT INTO batches (batch_id, name, commodity, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                record["batch_id"],
                record["name"],
                record["commodity"],
                record["created_at"],
            ),
        )
        connection.commit()
    finally:
        connection.close()

    return {**record, "sample_count": 0, "average_score": None}


def get_batch(batch_id: str) -> dict[str, Any] | None:
    connection = sqlite3.connect(get_db_path())
    try:
        row = connection.execute(
            """
            SELECT batch_id, name, commodity, created_at
            FROM batches
            WHERE batch_id = ?
            """,
            (batch_id,),
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        return None
    return {
        "batch_id": row[0],
        "name": row[1],
        "commodity": row[2],
        "created_at": row[3],
    }


def list_batches(limit: int = 30) -> list[dict[str, Any]]:
    connection = sqlite3.connect(get_db_path())
    try:
        rows = connection.execute(
            """
            SELECT b.batch_id, b.name, b.commodity, b.created_at,
                   COUNT(i.inspection_id) AS sample_count,
                   ROUND(AVG(i.score), 1) AS average_score
            FROM batches b
            LEFT JOIN inspections i ON i.batch_id = b.batch_id
            GROUP BY b.batch_id
            ORDER BY b.created_at DESC, b.rowid DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    finally:
        connection.close()

    return [
        {
            "batch_id": row[0],
            "name": row[1],
            "commodity": row[2],
            "created_at": row[3],
            "sample_count": row[4],
            "average_score": row[5],
        }
        for row in rows
    ]


def save_inspection(record: dict[str, Any]) -> None:
    connection = sqlite3.connect(get_db_path())
    try:
        connection.execute(
            """
            INSERT OR REPLACE INTO inspections
                (inspection_id, timestamp, commodity, classification,
                 status_label, score, tvbn, payload, batch_id, batch_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["inspection_id"],
                record["timestamp"],
                record["commodity"],
                record["classification"],
                record["status_label"],
                record["scores"]["total_freshness_score"],
                record["biomarkers"]["estimated_tvbn_mg100g"],
                json.dumps(record, ensure_ascii=False),
                record.get("batch_id"),
                record.get("batch_name"),
            ),
        )
        connection.commit()
    finally:
        connection.close()


def list_inspections(
    limit: int = 20, batch_id: str | None = None
) -> list[dict[str, Any]]:
    connection = sqlite3.connect(get_db_path())
    try:
        if batch_id:
            rows = connection.execute(
                """
                SELECT payload FROM inspections
                WHERE batch_id = ?
                ORDER BY timestamp DESC, rowid DESC
                LIMIT ?
                """,
                (batch_id, limit),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT payload FROM inspections ORDER BY timestamp DESC, rowid DESC LIMIT ?",
                (limit,),
            ).fetchall()
    finally:
        connection.close()

    return [json.loads(row[0]) for row in rows]
