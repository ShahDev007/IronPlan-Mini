# Facility Onboarding Runbook

**System:** IronPlan Mini  
**Audience:** Facility administrators, IT staff, or IronPlan implementation engineers  
**Purpose:** Step-by-step procedure for adding a new correctional facility to the system

---

## Overview

Onboarding a new facility takes three steps:

1. Register the facility and its rooms in the database
2. Upload equipment data via CSV (from S3 or the web UI)
3. Verify the data appears correctly in the dashboard

Estimated time: 30–60 minutes depending on CSV quality.

---

## Prerequisites

Before starting, confirm you have:

- [ ] Supabase project access (SQL Editor or psql)
- [ ] AWS credentials with `s3:GetObject` on the `ironplan-uploads` bucket
- [ ] A completed equipment inventory CSV from the facility (see format below)
- [ ] Python 3.11+ with project dependencies installed (`pip install -r backend/requirements.txt`)
- [ ] `.env` file configured with `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`

---

## Step 1 — Register the Facility

Open the Supabase SQL Editor and run the following, replacing placeholder values:

```sql
INSERT INTO facilities (name, address, county, state, capacity)
VALUES (
  'Riverside County Jail',          -- official facility name
  '1234 Correctional Blvd, CA 92503',
  'Riverside',
  'CA',
  480
)
RETURNING id;
```

**Save the returned UUID** — you will need it for every step that follows.  
Example: `a3f8c1d2-4b5e-6789-abcd-ef0123456789`

---

## Step 2 — Register Rooms

Run one INSERT per room. The `name` value must match the room labels in the SVG floor plan exactly (case-sensitive). The valid `room_type` values are:

| room_type | Description |
|---|---|
| `cell_block` | Inmate housing area |
| `control` | Central control room |
| `sally_port` | Vehicle/pedestrian entry airlock |
| `intake` | Booking and processing |
| `medical` | Medical or infirmary bay |
| `visitation` | Public visitation area |
| `other` | Any other room type |

```sql
INSERT INTO rooms (facility_id, name, room_type, floor)
VALUES
  ('YOUR-FACILITY-UUID', 'Sally Port',   'sally_port', 1),
  ('YOUR-FACILITY-UUID', 'Intake',        'intake',     1),
  ('YOUR-FACILITY-UUID', 'Control Room',  'control',    1),
  ('YOUR-FACILITY-UUID', 'Cell Block A',  'cell_block', 1),
  ('YOUR-FACILITY-UUID', 'Cell Block B',  'cell_block', 1),
  ('YOUR-FACILITY-UUID', 'Medical',       'medical',    1),
  ('YOUR-FACILITY-UUID', 'Visitation',    'visitation', 1);
```

After inserting, retrieve the room UUIDs — you'll need them for the CSV:

```sql
SELECT id, name FROM rooms WHERE facility_id = 'YOUR-FACILITY-UUID';
```

---

## Step 3 — Prepare the Equipment CSV

The facility should provide an inventory spreadsheet. Convert it to a CSV with these columns:

| Column | Required | Notes |
|---|---|---|
| `room_id` | **yes** | UUID from Step 2 — matches the room this item lives in |
| `name` | **yes** | Human-readable name, e.g. `Sliding Cell Door A-01` |
| `type` | **yes** | One of: `door`, `lock`, `intercom`, `camera`, `alarm`, `other` |
| `condition_score` | **yes** | Integer 1–5 (1=Critical, 5=Excellent) |
| `last_inspected` | no | ISO date: `YYYY-MM-DD` |
| `replacement_cost` | no | USD decimal, no currency symbol, e.g. `13500.00` |
| `notes` | no | Free text — inspection findings, known defects |
| `serial_number` | no | Manufacturer serial |
| `manufacturer` | no | e.g. `Folger Adam`, `Bosch`, `Hikvision` |
| `install_year` | no | 4-digit year |

**Common data quality issues to fix before upload:**
- `room_id` must be a UUID — do not use room names in this column
- `condition_score` must be a whole number 1–5, not text like "Fair"
- `replacement_cost` must be numeric only — remove `$` and commas
- Blank cells are fine for optional columns — do not put "N/A" or "—"

Save the file as `{facility_name}_{YYYY-MM-DD}.csv`, e.g. `riverside_county_2025-05-24.csv`.

---

## Step 4 — Upload CSV to S3

Upload the prepared CSV to the S3 bucket used by the system:

```bash
aws s3 cp riverside_county_2025-05-24.csv \
  s3://ironplan-uploads/facilities/riverside_county_2025-05-24.csv
```

Confirm the upload:

```bash
aws s3 ls s3://ironplan-uploads/facilities/
```

---

## Step 5 — Dry Run Validation

Before writing to the database, run a dry run to catch any remaining data issues:

```bash
python onboard_facility.py \
  --facility-id a3f8c1d2-4b5e-6789-abcd-ef0123456789 \
  --s3-key      facilities/riverside_county_2025-05-24.csv \
  --dry-run
```

Expected output:
```
[S3] Downloading s3://ironplan-uploads/facilities/riverside_county_2025-05-24.csv ...
[S3] Downloaded 14,382 bytes.
[Validate] Parsing CSV ...
[Validate] 87 rows found.
[Validate] 87 rows passed validation.
[DryRun] Would insert 87 rows for facility a3f8c1d2-... Skipping DB write.
```

If any rows are dropped, the output will list each row with the reason. Fix the CSV and re-upload to S3 before proceeding.

---

## Step 6 — Live Load

Once the dry run shows zero dropped rows, run without `--dry-run`:

```bash
python onboard_facility.py \
  --facility-id a3f8c1d2-4b5e-6789-abcd-ef0123456789 \
  --s3-key      facilities/riverside_county_2025-05-24.csv
```

Expected output:
```
[S3] Downloading s3://ironplan-uploads/facilities/riverside_county_2025-05-24.csv ...
[S3] Downloaded 14,382 bytes.
[Validate] Parsing CSV ...
[Validate] 87 rows found.
[Validate] 87 rows passed validation.
[DB] Connecting to Supabase ...
[DB] Onboarding facility: Riverside County Jail
[DB] Inserted 87 rows. Done.
```

---

## Step 7 — Verify in the Dashboard

1. Open the IronPlan Mini frontend.
2. Update `VITE_FACILITY_ID` in your environment to the new facility UUID (or switch the facility selector if one is added).
3. Confirm the floor plan rooms appear with correct equipment counts.
4. Open **Capital Planning** and verify the stat cards and bar chart reflect the uploaded data.
5. Spot-check 3–5 items from the CSV against what the equipment panel shows — confirm names, condition scores, and costs match.

---

## Step 8 — Confirm Inspections (Optional)

If the facility has existing inspection records, they can be bulk-inserted directly in SQL:

```sql
INSERT INTO inspections (equipment_id, inspected_by, inspected_at, condition_score, findings, action_required)
VALUES (
  'EQUIPMENT-UUID',
  'Inspector Name',
  '2025-04-15 10:00:00',
  2,
  'Hydraulic seal leaking. Replacement parts ordered.',
  TRUE
);
```

---

## Rollback

If the load produced bad data, remove it without affecting other facilities:

```sql
-- Removes all equipment for the new facility only
DELETE FROM equipment
WHERE room_id IN (
  SELECT id FROM rooms WHERE facility_id = 'YOUR-FACILITY-UUID'
);
```

Re-run Steps 3–6 with a corrected CSV.

---

## Contacts & Escalation

| Issue | Owner |
|---|---|
| Database access / schema errors | Backend engineer |
| S3 bucket permissions | DevOps / AWS admin |
| CSV data quality | Facility coordinator |
| Frontend not showing new facility | Frontend engineer — check `VITE_FACILITY_ID` |
