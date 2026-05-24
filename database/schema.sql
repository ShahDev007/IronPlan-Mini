-- IronPlan Mini — Schema
-- Correctional facility equipment tracking database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- FACILITIES
-- ─────────────────────────────────────────────
CREATE TABLE facilities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    address     TEXT,
    county      TEXT,
    state       CHAR(2),
    capacity    INTEGER,                        -- rated inmate capacity
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────────
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id     UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,              -- e.g. "Cell Block A", "Control Room"
    room_type       TEXT NOT NULL,              -- cell_block | control | sally_port | intake | medical | visitation | other
    floor           INTEGER NOT NULL DEFAULT 1,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EQUIPMENT
-- ─────────────────────────────────────────────
CREATE TABLE equipment (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,                      -- e.g. "Sliding Cell Door #12"
    type                TEXT NOT NULL,                      -- door | lock | intercom | camera | alarm | other
    last_inspected      DATE,
    condition_score     SMALLINT NOT NULL CHECK (condition_score BETWEEN 1 AND 5),
    replacement_cost    NUMERIC(12, 2),                     -- USD
    notes               TEXT,
    serial_number       TEXT,
    manufacturer        TEXT,
    install_year        SMALLINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INSPECTIONS
-- ─────────────────────────────────────────────
CREATE TABLE inspections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id    UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    inspected_by    TEXT NOT NULL,              -- inspector name or ID
    inspected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    condition_score SMALLINT NOT NULL CHECK (condition_score BETWEEN 1 AND 5),
    findings        TEXT,
    action_required BOOLEAN NOT NULL DEFAULT FALSE,
    action_notes    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_rooms_facility_id         ON rooms(facility_id);
CREATE INDEX idx_equipment_room_id         ON equipment(room_id);
CREATE INDEX idx_equipment_condition_score ON equipment(condition_score);
CREATE INDEX idx_inspections_equipment_id  ON inspections(equipment_id);
CREATE INDEX idx_inspections_inspected_at  ON inspections(inspected_at);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_equipment_updated_at
    BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- VIEWS (convenience for the FastAPI report endpoint)
-- ─────────────────────────────────────────────

-- Flat view: equipment with its room and facility context
CREATE VIEW v_equipment_full AS
SELECT
    e.id                AS equipment_id,
    e.name              AS equipment_name,
    e.type              AS equipment_type,
    e.condition_score,
    e.replacement_cost,
    e.last_inspected,
    e.serial_number,
    e.manufacturer,
    e.install_year,
    e.notes             AS equipment_notes,
    r.id                AS room_id,
    r.name              AS room_name,
    r.room_type,
    f.id                AS facility_id,
    f.name              AS facility_name,
    f.county,
    f.state
FROM equipment e
JOIN rooms r     ON r.id = e.room_id
JOIN facilities f ON f.id = r.facility_id;

-- Capital planning summary per facility
CREATE VIEW v_capital_summary AS
SELECT
    f.id                                                AS facility_id,
    f.name                                              AS facility_name,
    COUNT(e.id)                                         AS total_equipment,
    COUNT(e.id) FILTER (WHERE e.condition_score = 1)    AS critical_count,
    COUNT(e.id) FILTER (WHERE e.condition_score = 2)    AS poor_count,
    COUNT(e.id) FILTER (WHERE e.condition_score = 3)    AS fair_count,
    COUNT(e.id) FILTER (WHERE e.condition_score = 4)    AS good_count,
    COUNT(e.id) FILTER (WHERE e.condition_score = 5)    AS excellent_count,
    COALESCE(SUM(e.replacement_cost) FILTER (WHERE e.condition_score <= 2), 0) AS critical_replacement_cost,
    COALESCE(SUM(e.replacement_cost), 0)                AS total_replacement_cost
FROM facilities f
LEFT JOIN rooms r     ON r.facility_id = f.id
LEFT JOIN equipment e ON e.room_id     = r.id
GROUP BY f.id, f.name;
