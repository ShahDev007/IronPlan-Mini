from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from psycopg2.extras import RealDictCursor

from ..db import get_conn
from ..models import CapitalReport, EquipmentFull, RoomSummary

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("/{facility_id}/equipment", response_model=list[EquipmentFull])
def get_facility_equipment(facility_id: UUID):
    """Return all equipment for a facility, including room context."""
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT * FROM v_equipment_full WHERE facility_id = %s ORDER BY room_name, equipment_name",
            (str(facility_id),),
        )
        rows = cur.fetchall()

    if not rows:
        # Distinguish "facility not found" from "facility has no equipment"
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM facilities WHERE id = %s", (str(facility_id),))
            if cur.fetchone() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Facility {facility_id} not found.",
                )
        return []

    return [_row_to_equipment_full(r) for r in rows]


@router.get("/{facility_id}/report", response_model=CapitalReport)
def get_facility_report(facility_id: UUID):
    """
    Capital planning summary: condition breakdown + replacement costs,
    with a per-room drill-down.
    """
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Top-level summary from the view
        cur.execute(
            "SELECT * FROM v_capital_summary WHERE facility_id = %s",
            (str(facility_id),),
        )
        summary = cur.fetchone()
        if summary is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Facility {facility_id} not found.",
            )

        # Per-room breakdown
        cur.execute(
            """
            SELECT
                r.id                                                        AS room_id,
                r.name                                                      AS room_name,
                r.room_type,
                COUNT(e.id)                                                 AS equipment_count,
                COUNT(e.id) FILTER (WHERE e.condition_score <= 2)           AS critical_count,
                COALESCE(SUM(e.replacement_cost), 0)                        AS replacement_cost
            FROM rooms r
            LEFT JOIN equipment e ON e.room_id = r.id
            WHERE r.facility_id = %s
            GROUP BY r.id, r.name, r.room_type
            ORDER BY r.name
            """,
            (str(facility_id),),
        )
        room_rows = cur.fetchall()

    by_room = [
        RoomSummary(
            room_id=r["room_id"],
            room_name=r["room_name"],
            room_type=r["room_type"],
            equipment_count=r["equipment_count"],
            critical_count=r["critical_count"],
            replacement_cost=Decimal(str(r["replacement_cost"])),
        )
        for r in room_rows
    ]

    return CapitalReport(
        facility_id=summary["facility_id"],
        facility_name=summary["facility_name"],
        total_equipment=summary["total_equipment"],
        critical_count=summary["critical_count"],
        poor_count=summary["poor_count"],
        fair_count=summary["fair_count"],
        good_count=summary["good_count"],
        excellent_count=summary["excellent_count"],
        critical_replacement_cost=Decimal(str(summary["critical_replacement_cost"])),
        total_replacement_cost=Decimal(str(summary["total_replacement_cost"])),
        by_room=by_room,
    )


def _row_to_equipment_full(r: dict) -> EquipmentFull:
    return EquipmentFull(
        id=r["equipment_id"],
        room_id=r["room_id"],
        name=r["equipment_name"],
        type=r["equipment_type"],
        condition_score=r["condition_score"],
        replacement_cost=r["replacement_cost"],
        last_inspected=r["last_inspected"],
        serial_number=r["serial_number"],
        manufacturer=r["manufacturer"],
        install_year=r["install_year"],
        notes=r["equipment_notes"],
        created_at=r.get("created_at"),
        updated_at=r.get("updated_at"),
        room_name=r["room_name"],
        room_type=r["room_type"],
        facility_id=r["facility_id"],
        facility_name=r["facility_name"],
        county=r["county"],
        state=r["state"],
    )
