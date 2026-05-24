from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, UUID4


# ── Equipment ────────────────────────────────────────────────────────────────

class EquipmentBase(BaseModel):
    name: str
    type: str
    last_inspected: Optional[date] = None
    condition_score: int = Field(..., ge=1, le=5)
    replacement_cost: Optional[Decimal] = None
    notes: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    install_year: Optional[int] = None


class EquipmentOut(EquipmentBase):
    id: UUID4
    room_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EquipmentFull(EquipmentOut):
    """Includes denormalized room + facility context (from v_equipment_full)."""
    room_name: str
    room_type: str
    facility_id: UUID4
    facility_name: str
    county: Optional[str] = None
    state: Optional[str] = None


# ── Capital Planning Report ───────────────────────────────────────────────────

class CapitalReport(BaseModel):
    facility_id: UUID4
    facility_name: str
    total_equipment: int
    critical_count: int        # score 1
    poor_count: int            # score 2
    fair_count: int            # score 3
    good_count: int            # score 4
    excellent_count: int       # score 5
    critical_replacement_cost: Decimal
    total_replacement_cost: Decimal
    by_room: list[RoomSummary]


class RoomSummary(BaseModel):
    room_id: UUID4
    room_name: str
    room_type: str
    equipment_count: int
    critical_count: int
    replacement_cost: Decimal


# ── CSV Upload Response ───────────────────────────────────────────────────────

class UploadResult(BaseModel):
    rows_received: int
    rows_inserted: int
    rows_skipped: int
    errors: list[str]


# Required for forward references (RoomSummary used inside CapitalReport)
CapitalReport.model_rebuild()
