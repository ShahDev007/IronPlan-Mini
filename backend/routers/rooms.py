from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from psycopg2.extras import RealDictCursor

from db import get_conn
from models import EquipmentOut

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/{room_id}/equipment", response_model=list[EquipmentOut])
def get_room_equipment(room_id: UUID):
    """Return all equipment in a single room, ordered by condition (worst first)."""
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Verify room exists
        cur.execute("SELECT 1 FROM rooms WHERE id = %s", (str(room_id),))
        if cur.fetchone() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Room {room_id} not found.",
            )

        cur.execute(
            """
            SELECT id, room_id, name, type, last_inspected, condition_score,
                   replacement_cost, notes, serial_number, manufacturer,
                   install_year, created_at, updated_at
            FROM equipment
            WHERE room_id = %s
            ORDER BY condition_score ASC, name ASC
            """,
            (str(room_id),),
        )
        rows = cur.fetchall()

    return [dict(r) for r in rows]
