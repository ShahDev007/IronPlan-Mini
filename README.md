# IronPlan Mini

A production-deployed facility equipment tracker for correctional facilities. Facility managers use it to monitor equipment condition, prioritize replacements, and plan capital budgets.

**Live demo:** https://ironplan-mini.vercel.app

---

## What it does

- **Floor plan view** — Visual map of a jail wing. Each room shows equipment count and a critical-item indicator. Click any room to see its full equipment list, color-coded by condition score (1 = critical → 5 = excellent).
- **Capital planning dashboard** — Condition breakdown charts and total replacement cost across the facility. The view a director brings to a budget meeting.
- **CSV upload** — Drop a CSV directly in the browser to bulk-insert equipment records.
- **S3 ingest** — Enter an S3 object key; the backend pulls the file from the bucket, validates every row with pandas, and loads clean records into the database. Bad rows are reported back without blocking the good ones.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts |
| Backend | FastAPI (Python 3.12), psycopg2, pandas, boto3 |
| Database | Supabase (PostgreSQL) — views, triggers, indexes |
| File storage | AWS S3 |
| Deployment | Vercel (frontend + backend as serverless functions) |

---

## Architecture

```
Browser (React)
    │
    │  HTTPS  /_/backend/api/*
    ▼
Vercel Serverless (FastAPI)
    │                    │
    │ psycopg2           │ boto3
    ▼                    ▼
Supabase (PostgreSQL)   AWS S3
```

The frontend and backend are co-deployed on Vercel using `experimentalServices`. Vercel routes `/` to the Vite build and `/_/backend/*` to the Python ASGI app. The backend connects to Supabase via the Transaction Pooler (port 6543, IPv4) — required because Vercel Hobby doesn't support outbound IPv6.

---

## Database schema

```
facilities
    └── rooms           (facility_id → facilities.id)
            └── equipment       (room_id → rooms.id)
                    └── inspections     (equipment_id → equipment.id)
```

Key columns on `equipment`: `condition_score SMALLINT CHECK (1–5)`, `replacement_cost NUMERIC(12,2)`, `last_inspected DATE`.

Two views power the API:
- `v_equipment_full` — flat join of equipment + room + facility
- `v_capital_summary` — aggregated condition counts and replacement costs per facility

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/facilities/{id}/equipment` | All equipment for a facility |
| GET | `/api/facilities/{id}/report` | Capital planning summary + per-room breakdown |
| GET | `/api/rooms/{id}/equipment` | Equipment in a single room, ordered by condition |
| POST | `/api/equipment/upload` | Bulk-insert from a direct CSV upload |
| POST | `/api/equipment/ingest-s3` | Pull a CSV from S3 and bulk-insert |
| GET | `/api/health` | Health check |

---

## S3 ingest pipeline

```
S3 bucket
    │  boto3 download
    ▼
pandas validation
    │  drop bad rows, report them
    ▼
psycopg2 bulk insert → Supabase
    │
    ▼
JSON response  { rows_received, rows_inserted, rows_skipped, errors }
```

A sample CSV is included at `sample_s3_upload.csv`. Upload it to your bucket under `uploads/` and use the key `uploads/sample_s3_upload.csv` in the UI to test the full pipeline.

The same logic is also available as a CLI script (`onboard_facility.py`) for batch onboarding jobs.

---

## Project structure

```
IronPlan_Mini/
├── api/
│   └── index.py              # Vercel entrypoint — adds backend/ to sys.path
├── backend/
│   ├── main.py               # FastAPI app, CORS, router registration
│   ├── config.py             # pydantic-settings env var loading
│   ├── db.py                 # psycopg2 connection pool
│   ├── models.py             # Pydantic response models
│   └── routers/
│       ├── equipment.py      # /upload and /ingest-s3 endpoints
│       ├── facilities.py     # /equipment and /report endpoints
│       └── rooms.py          # room equipment endpoint
├── database/
│   ├── schema.sql            # Tables, views, triggers, indexes
│   └── seed.sql              # Lincoln County Detention Center demo data
├── frontend/
│   └── src/
│       ├── api.js            # Fetch wrappers for all endpoints
│       ├── App.jsx           # Root — data fetching and state
│       ├── pages/
│       │   ├── FloorPlanPage.jsx
│       │   └── DashboardPage.jsx
│       └── components/
│           ├── FloorPlan.jsx       # SVG floor plan with room selection
│           ├── EquipmentPanel.jsx
│           ├── Dashboard.jsx
│           ├── CsvUpload.jsx
│           ├── S3Ingest.jsx
│           ├── FilterBar.jsx
│           ├── ConditionBadge.jsx
│           └── Sidebar.jsx
├── onboard_facility.py       # CLI: S3 → pandas → Supabase ingestion
├── sample_s3_upload.csv      # Sample equipment CSV for S3 demo
└── vercel.json               # experimentalServices multi-service config
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Transaction Pooler connection string |
| `AWS_ACCESS_KEY_ID` | IAM user access key (S3 read access) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | S3 bucket region (default: `us-east-1`) |
| `S3_BUCKET` | S3 bucket name |
| `VITE_FACILITY_ID` | UUID of the demo facility (frontend) |
| `VITE_API_URL` | API base URL (leave unset on Vercel — same-domain routing) |

---

## CSV format

Both the upload endpoint and the S3 pipeline accept CSVs with this schema:

| Column | Required | Type | Notes |
|--------|----------|------|-------|
| `room_id` | yes | UUID | Must match an existing room |
| `name` | yes | string | Equipment display name |
| `type` | yes | string | Category label |
| `condition_score` | yes | integer | 1–5 (1 = Critical, 5 = Excellent) |
| `last_inspected` | no | YYYY-MM-DD | |
| `replacement_cost` | no | decimal | USD |
| `notes` | no | string | |
| `serial_number` | no | string | |
| `manufacturer` | no | string | |
| `install_year` | no | integer | |

---

## Design decisions

**psycopg2 over SQLAlchemy** — The query surface is narrow: four read endpoints and one bulk insert. SQLAlchemy's ORM would add boilerplate with no benefit. Raw psycopg2 with a connection pool keeps the data layer transparent.

**Database views over in-router joins** — Moving join logic into `v_equipment_full` keeps each router to a single `SELECT *` and lets the database optimizer handle it. The view is also reusable across endpoints.

**SVG floor plan over a mapping library** — The wing layout is static and known at build time. A geographic mapping library (Leaflet, Mapbox) is oversized for a fixed 7-room layout. Hand-authored SVG loads instantly with no tile dependencies.

**Condition scores 1–5 as integers** — Numeric scores are sortable, aggregatable, and filterable with simple range checks. The capital planning report's `FILTER (WHERE condition_score <= 2)` clauses depend on this. Text labels are applied in the UI layer where they belong.

**Fixed UUIDs in seed data** — Deterministic IDs mean `VITE_FACILITY_ID` can be documented with a concrete value. It also makes the seed idempotent-friendly for re-runs.

**Transaction Pooler over Direct connection** — Vercel's serverless functions don't support persistent TCP connections, and Vercel Hobby doesn't have outbound IPv6. Supabase's Transaction Pooler (PgBouncer, port 6543, IPv4) handles both constraints.
