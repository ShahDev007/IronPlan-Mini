# IronPlan Mini

A production-deployed facility equipment tracker built for correctional facilities. Designed for capital planning — tracking condition scores, replacement costs, and inspection history across every room in a detention center.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│   React + Tailwind CSS                   Vercel (CDN)              │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  Sidebar  │  SVG Floor Plan  │  Equipment Panel         │      │
│   │           │  (clickable rooms│  (condition badges,      │      │
│   │  nav +    │   critical dots) │   costs, dates)          │      │
│   │  summary  ├──────────────────┤                          │      │
│   │  stats    │  Capital Planning Dashboard                  │      │
│   │           │  (stat cards + Recharts bar chart)          │      │
│   └─────────────────────────────────────────────────────────┘      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS (REST JSON)
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                    FastAPI  (Railway)                             │
│                                                                   │
│  POST /equipment/upload      ← pandas CSV validation             │
│  GET  /facilities/{id}/equipment                                 │
│  GET  /facilities/{id}/report   ← capital planning summary       │
│  GET  /rooms/{id}/equipment                                      │
│                                                                   │
│  psycopg2 ThreadedConnectionPool  (maxconn=10)                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │ PostgreSQL wire protocol
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL 15)                        │
│                                                                   │
│   facilities  →  rooms  →  equipment  →  inspections             │
│                                                                   │
│   Views:  v_equipment_full     (flat join for API reads)         │
│           v_capital_summary    (aggregated report per facility)  │
└───────────────────────────────────────────────────────────────────┘
                                ▲
                    boto3       │
┌───────────────────────────────┴───────────────────────────────────┐
│   onboard_facility.py  (CLI script)                              │
│                                                                   │
│   S3 Bucket  →  pandas validate  →  psycopg2 bulk insert         │
│   (facility CSV drop zone)                                       │
└───────────────────────────────────────────────────────────────────┘
         ▲
         │
    AWS S3  (ironplan-uploads bucket)
```

---

## Project Structure

```
IronPlan_Mini/
├── database/
│   ├── schema.sql            # All tables, indexes, views, triggers
│   └── seed.sql              # Lincoln County Detention Center demo data
│
├── backend/
│   ├── main.py               # FastAPI app + CORS
│   ├── config.py             # pydantic-settings env loader
│   ├── db.py                 # psycopg2 connection pool
│   ├── models.py             # Pydantic response models
│   ├── requirements.txt
│   ├── Procfile              # Railway deploy command
│   ├── .env.example
│   └── routers/
│       ├── equipment.py      # POST /equipment/upload
│       ├── facilities.py     # GET /facilities/{id}/equipment + /report
│       └── rooms.py          # GET /rooms/{id}/equipment
│
├── frontend/
│   ├── index.html
│   ├── package.json          # React 18, Recharts, Tailwind, Vite
│   ├── vite.config.js
│   ├── .env.example          # VITE_API_URL + VITE_FACILITY_ID
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── FloorPlan.jsx        # SVG jail wing — 7 rooms
│       │   ├── EquipmentPanel.jsx
│       │   ├── ConditionBadge.jsx
│       │   ├── Dashboard.jsx        # Stat cards + Recharts bar chart
│       │   ├── FilterBar.jsx
│       │   └── CsvUpload.jsx
│       └── pages/
│           ├── FloorPlanPage.jsx
│           └── DashboardPage.jsx
│
├── onboard_facility.py       # S3 → pandas → psycopg2 CLI onboarding script
└── docs/
    ├── onboarding_runbook.md
    └── user_story.md
```

---

## Setup & Deployment

### 1. Supabase (Database)

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `database/schema.sql`.
3. Run `database/seed.sql` to load Lincoln County demo data.
4. Note your **connection string** from Project Settings → Database → Connection string (Session mode, port 5432).

### 2. Backend (Railway)

1. Push the repo to GitHub.
2. Create a new Railway project → Deploy from GitHub repo.
3. Set the **root directory** to `backend/` in Railway settings.
4. Add environment variables in Railway:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   S3_BUCKET=ironplan-uploads
   ```
5. Railway auto-detects `Procfile` and starts `uvicorn`.
6. Note the generated Railway domain (e.g. `https://ironplan-mini.up.railway.app`).

### 3. Frontend (Vercel)

1. In Vercel, import the GitHub repo.
2. Set **root directory** to `frontend/`.
3. Add environment variables in Vercel:
   ```
   VITE_API_URL=https://ironplan-mini.up.railway.app
   VITE_FACILITY_ID=11111111-1111-1111-1111-111111111111
   ```
4. Deploy. Vercel detects Vite automatically.

### 4. Local Development

```bash
# Backend
cd backend
cp .env.example .env          # fill in DATABASE_URL
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local    # fill in VITE_API_URL + VITE_FACILITY_ID
npm install
npm run dev
```

---

## CSV Upload Format

The `/equipment/upload` endpoint and `onboard_facility.py` both accept CSVs with this schema:

| Column | Required | Type | Notes |
|---|---|---|---|
| `room_id` | yes | UUID | Must match a room in the DB |
| `name` | yes | string | Equipment display name |
| `type` | yes | string | door, lock, intercom, camera, alarm, other |
| `condition_score` | yes | integer | 1–5 (1=Critical, 5=Excellent) |
| `last_inspected` | no | YYYY-MM-DD | |
| `replacement_cost` | no | decimal | USD |
| `notes` | no | string | |
| `serial_number` | no | string | |
| `manufacturer` | no | string | |
| `install_year` | no | integer | |

---

## Design Decisions

### Why psycopg2 over SQLAlchemy?

This app has a narrow, well-defined query surface — four endpoints, all straightforward reads and one bulk insert. SQLAlchemy's abstraction layer would add ~300 lines of ORM model boilerplate that buys nothing here. Raw psycopg2 with a connection pool keeps the data layer transparent and fast. The SQL lives in the queries themselves, not hidden behind `session.query()` chains.

### Why a flat `v_equipment_full` view instead of nested joins in the router?

Moving the join logic into a database view means the API router stays simple (`SELECT * FROM v_equipment_full WHERE facility_id = %s`) and the view can be optimized at the DB layer without touching Python. Supabase runs PostgreSQL 15 which handles this well. The view is also reusable — both the floor plan and the equipment panel read from the same projection.

### Why SVG floor plan instead of a mapping library (Leaflet, Mapbox)?

Jail wing layouts are fixed and known at build time. A general mapping library designed for dynamic geographic data is oversized for a static 7-room layout. Hand-authored SVG gives pixel-perfect control, zero tile dependencies, ships as part of the React bundle, and loads instantly. Room positions are defined as a plain array in `FloorPlan.jsx` and matched to DB data by `room_name` — no extra API calls needed.

### Why condition scores 1–5 instead of free-text labels?

Numeric scores are sortable, aggregatable, and filterable with a simple `WHERE condition_score <= 2`. The capital planning report's `FILTER` clauses in `v_capital_summary` depend on this. Text labels like "Critical" require either an `ENUM` (schema migration on every label change) or case-insensitive string comparisons — both more brittle. Labels are applied in the UI layer (`ConditionBadge.jsx`) where they belong.

### Why a separate `onboard_facility.py` instead of just using the upload API?

The upload endpoint is designed for browser-initiated single-file uploads over HTTPS. The onboarding script is a server-side batch operation: it pulls from a private S3 bucket using IAM credentials, handles large files without browser memory limits, supports `--dry-run` for pre-flight validation, and can be scheduled in CI. Keeping these two paths separate avoids adding S3 credentials to the FastAPI process unnecessarily.

### Why fixed UUIDs in seed.sql?

Deterministic IDs mean `VITE_FACILITY_ID` and the SVG room name mapping can be documented with concrete values rather than "run the seed and look up the IDs." It also makes the seed idempotent-friendly — re-running it with `INSERT ... ON CONFLICT DO NOTHING` would be safe to add later.
