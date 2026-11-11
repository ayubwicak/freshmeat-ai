import logging
import math
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from freshmeat_core import (
    BatchCreate,
    BatchResponse,
    InspectionResponse,
    InvalidImageError,
    ROINotDetectedError,
    analyze_sample,
)

from app.config import ENGINE_NAME
from app.storage import (
    create_batch,
    get_batch,
    list_batches,
    list_inspections,
    save_inspection,
)

logger = logging.getLogger("freshmeat.api")

router = APIRouter()


@router.post("/api/v1/analyze", response_model=InspectionResponse)
async def analyze_meat_sample(
    file: Annotated[UploadFile, File()],
    commodity: Annotated[str, Form()] = "Sapi (Beef Sirloin/Tenderloin)",
    storage_temp: Annotated[float, Form()] = 4.0,
    exposure_hours: Annotated[float, Form()] = 1.5,
    surface_condition: Annotated[str, Form()] = "normal",
    aroma_condition: Annotated[str, Form()] = "fresh",
    batch_id: Annotated[str | None, Form()] = None,
) -> InspectionResponse:
    commodity = (commodity or "").strip()
    if not commodity:
        raise HTTPException(status_code=422, detail="commodity cannot be empty.")

    normalized_batch_id = (batch_id or "").strip() or None
    batch = get_batch(normalized_batch_id) if normalized_batch_id else None
    if normalized_batch_id and batch is None:
        raise HTTPException(status_code=404, detail="Batch tidak ditemukan.")

    for field_name, value in {
        "storage_temp": storage_temp,
        "exposure_hours": exposure_hours,
    }.items():
        if not math.isfinite(value) or value < 0:
            raise HTTPException(
                status_code=422,
                detail=f"{field_name} must be a finite number greater than or equal to 0.",
            )

    contents = await file.read()

    try:
        result = analyze_sample(
            contents,
            commodity=commodity,
            storage_temp=storage_temp,
            exposure_hours=exposure_hours,
            surface_condition=surface_condition,
            aroma_condition=aroma_condition,
        )
    except ROINotDetectedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if batch is not None:
        result = result.model_copy(
            update={
                "batch_id": batch["batch_id"],
                "batch_name": batch["name"],
            }
        )

    try:
        save_inspection(result.model_dump())
    except Exception:
        logger.exception("Gagal menyimpan hasil inspeksi ke database audit.")

    return result


@router.post("/api/v1/batches", response_model=BatchResponse, status_code=201)
def create_new_batch(payload: BatchCreate) -> BatchResponse:
    commodity = (payload.commodity or "").strip()
    if not commodity:
        raise HTTPException(status_code=422, detail="commodity cannot be empty.")

    return BatchResponse.model_validate(create_batch(payload.name, commodity))


@router.get("/api/v1/batches", response_model=list[BatchResponse])
def get_batch_history(
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
) -> list[BatchResponse]:
    return [BatchResponse.model_validate(item) for item in list_batches(limit)]


@router.get("/api/v1/inspections", response_model=list[InspectionResponse])
def get_inspection_history(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    batch_id: Annotated[str | None, Query()] = None,
) -> list[InspectionResponse]:
    normalized_batch_id = (batch_id or "").strip() or None
    return [
        InspectionResponse.model_validate(item)
        for item in list_inspections(limit, normalized_batch_id)
    ]


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "online", "engine": ENGINE_NAME}
