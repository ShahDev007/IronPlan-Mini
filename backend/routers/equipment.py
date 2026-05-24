import io
import uuid
from typing import Annotated

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from ..db import get_conn
from ..models import UploadResult

router = APIRouter(prefix="/equipment", tags=["equipment"])

# Expected CSV columns — any extras are ignored, any missing required ones raise an error.
REQUIRED_COLS = {"room_id", "name", "type", "condition_score"}
OPTIONAL_COLS = {
    "last_inspected", "replacement_cost", "notes",
    "serial_number", "manufacturer", "install_year",
}


def _validate_df(df: pd.DataFrame) -> list[str]:
    """Return a list of validation error messages (empty = all good)."""
    errors: list[str] = []
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        errors.append(f"Missing required columns: {sorted(missing)}")
        return errors  # can't validate rows without required columns

    bad_score = df[~df["condition_score"].between(1, 5)]
    if not bad_score.empty:
        errors.append(
            f"condition_score out of range (1–5) on rows: {bad_score.index.tolist()}"
        )

    bad_uuid = df[df["room_id"].apply(lambda v: not _is_valid_uuid(str(v)))]
    if not bad_uuid.empty:
        errors.append(
            f"Invalid room_id UUID on rows: {bad_uuid.index.tolist()}"
        )

    return errors


def _is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


@router.post("/upload", response_model=UploadResult, status_code=status.HTTP_200_OK)
async def upload_equipment_csv(file: UploadFile = File(...)):
    """
    Accept a CSV file, validate it with pandas, and bulk-insert valid rows into
    the equipment table.  Returns a summary of inserted / skipped rows.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .csv files are accepted.",
        )

    raw = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(raw), dtype=str)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse CSV: {exc}",
        )

    # Coerce numeric columns now that we have a clean dtype=str read
    df["condition_score"] = pd.to_numeric(df.get("condition_score", pd.Series(dtype=str)), errors="coerce")
    if "replacement_cost" in df.columns:
        df["replacement_cost"] = pd.to_numeric(df["replacement_cost"], errors="coerce")
    if "install_year" in df.columns:
        df["install_year"] = pd.to_numeric(df["install_year"], errors="coerce")

    validation_errors = _validate_df(df)
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"validation_errors": validation_errors},
        )

    rows_received = len(df)
    inserted = 0
    skipped = 0
    row_errors: list[str] = []

    with get_conn() as conn:
        cur = conn.cursor()

        for idx, row in df.iterrows():
            try:
                cur.execute(
                    """
                    INSERT INTO equipment (
                        room_id, name, type, condition_score,
                        last_inspected, replacement_cost, notes,
                        serial_number, manufacturer, install_year
                    ) VALUES (
                        %(room_id)s, %(name)s, %(type)s, %(condition_score)s,
                        %(last_inspected)s, %(replacement_cost)s, %(notes)s,
                        %(serial_number)s, %(manufacturer)s, %(install_year)s
                    )
                    """,
                    {
                        "room_id": str(row["room_id"]),
                        "name": str(row["name"]),
                        "type": str(row["type"]),
                        "condition_score": int(row["condition_score"]),
                        "last_inspected": row.get("last_inspected") or None,
                        "replacement_cost": row.get("replacement_cost") or None,
                        "notes": row.get("notes") or None,
                        "serial_number": row.get("serial_number") or None,
                        "manufacturer": row.get("manufacturer") or None,
                        "install_year": int(row["install_year"]) if pd.notna(row.get("install_year")) else None,
                    },
                )
                inserted += 1
            except Exception as exc:
                conn.rollback()
                skipped += 1
                row_errors.append(f"Row {idx}: {exc}")

    return UploadResult(
        rows_received=rows_received,
        rows_inserted=inserted,
        rows_skipped=skipped,
        errors=row_errors,
    )
