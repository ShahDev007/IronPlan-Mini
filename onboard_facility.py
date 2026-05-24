"""
onboard_facility.py
-------------------
Pull a facility equipment CSV from S3, validate it, and load it into Supabase.

Usage:
    python onboard_facility.py \
        --facility-id  <UUID>   \
        --s3-key       path/to/facility.csv \
        [--dry-run]

Required env vars (or .env file):
    DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
"""

import argparse
import io
import os
import sys
import uuid
from decimal import Decimal, InvalidOperation

import boto3
import pandas as pd
import psycopg2
from dotenv import load_dotenv

# ── Load environment ──────────────────────────────────────────────────────────
# Reads .env from the project root so the script works both locally and on CI.
load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_BUCKET = os.environ["S3_BUCKET"]

# ── Column spec ───────────────────────────────────────────────────────────────
# These must be present in the CSV; all others are treated as optional metadata.
REQUIRED_COLS = {"room_id", "name", "type", "condition_score"}

# condition_score must fall within this inclusive range (matches DB CHECK constraint).
SCORE_MIN, SCORE_MAX = 1, 5


# ── Step 1: Download CSV from S3 ─────────────────────────────────────────────

def download_from_s3(s3_key: str) -> bytes:
    """
    Connect to S3 using explicit credentials from env, download the object at
    s3_key, and return the raw bytes.  Raises SystemExit on any AWS error so
    the caller gets a clean error message instead of a raw boto3 traceback.
    """
    print(f"[S3] Downloading s3://{S3_BUCKET}/{s3_key} ...")

    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )

    try:
        response = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
        raw = response["Body"].read()
    except s3.exceptions.NoSuchKey:
        sys.exit(f"[ERROR] Object not found: s3://{S3_BUCKET}/{s3_key}")
    except Exception as exc:
        sys.exit(f"[ERROR] S3 download failed: {exc}")

    print(f"[S3] Downloaded {len(raw):,} bytes.")
    return raw


# ── Step 2: Parse and validate with pandas ───────────────────────────────────

def validate(raw: bytes) -> pd.DataFrame:
    """
    Parse the CSV bytes into a DataFrame, enforce required columns, coerce
    types, and filter out unrecoverable rows.  Returns a clean DataFrame
    ready for insertion.  Prints a summary of any rows that were dropped.
    """
    print("[Validate] Parsing CSV ...")

    try:
        # Read everything as strings first so we control coercion ourselves.
        df = pd.read_csv(io.BytesIO(raw), dtype=str)
    except Exception as exc:
        sys.exit(f"[ERROR] Cannot parse CSV: {exc}")

    # ── Check required columns ────────────────────────────────────────────────
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        sys.exit(f"[ERROR] CSV is missing required columns: {sorted(missing)}")

    print(f"[Validate] {len(df)} rows found.")

    # ── Coerce condition_score to integer ─────────────────────────────────────
    df["condition_score"] = pd.to_numeric(df["condition_score"], errors="coerce")

    # ── Coerce optional numeric columns ──────────────────────────────────────
    for col in ("replacement_cost", "install_year"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # ── Identify and drop invalid rows ────────────────────────────────────────
    bad_score = df["condition_score"].isna() | ~df["condition_score"].between(SCORE_MIN, SCORE_MAX)

    # Validate room_id is a well-formed UUID (must reference an existing room).
    def is_valid_uuid(val) -> bool:
        try:
            uuid.UUID(str(val))
            return True
        except (ValueError, AttributeError):
            return False

    bad_uuid = ~df["room_id"].apply(is_valid_uuid)

    invalid_mask = bad_score | bad_uuid
    bad_rows = df[invalid_mask]

    if not bad_rows.empty:
        print(f"[Validate] Dropping {len(bad_rows)} invalid row(s):")
        for idx, row in bad_rows.iterrows():
            reasons = []
            if bad_score[idx]:
                reasons.append(f"condition_score={row['condition_score']!r}")
            if bad_uuid[idx]:
                reasons.append(f"room_id={row['room_id']!r}")
            print(f"  Row {idx}: {', '.join(reasons)}")

    clean = df[~invalid_mask].copy()
    print(f"[Validate] {len(clean)} rows passed validation.")
    return clean


# ── Step 3: Load into Supabase PostgreSQL via psycopg2 ────────────────────────

def load_into_db(df: pd.DataFrame, facility_id: str, dry_run: bool) -> None:
    """
    Insert each validated row into the equipment table.  Uses a single
    transaction — if anything fails mid-way the whole batch is rolled back
    so the DB stays consistent.

    dry_run=True prints what would be inserted without touching the DB.
    """
    if dry_run:
        print(f"[DryRun] Would insert {len(df)} rows for facility {facility_id}. Skipping DB write.")
        print(df[["room_id", "name", "type", "condition_score"]].to_string(index=False))
        return

    print(f"[DB] Connecting to Supabase ...")
    conn = psycopg2.connect(DATABASE_URL)

    try:
        cur = conn.cursor()

        # Verify the facility exists before inserting — avoids orphaned equipment.
        cur.execute("SELECT name FROM facilities WHERE id = %s", (facility_id,))
        facility = cur.fetchone()
        if facility is None:
            sys.exit(f"[ERROR] Facility {facility_id} not found in database.")
        print(f"[DB] Onboarding facility: {facility[0]}")

        inserted = 0
        for _, row in df.iterrows():
            # Safely coerce replacement_cost to Decimal or None
            try:
                cost = Decimal(str(row["replacement_cost"])) if pd.notna(row.get("replacement_cost")) else None
            except InvalidOperation:
                cost = None

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
                    "room_id":          str(row["room_id"]),
                    "name":             str(row["name"]),
                    "type":             str(row["type"]),
                    "condition_score":  int(row["condition_score"]),
                    "last_inspected":   row.get("last_inspected") or None,
                    "replacement_cost": cost,
                    "notes":            row.get("notes") or None,
                    "serial_number":    row.get("serial_number") or None,
                    "manufacturer":     row.get("manufacturer") or None,
                    "install_year":     int(row["install_year"]) if pd.notna(row.get("install_year")) else None,
                },
            )
            inserted += 1

        # Commit only after all rows succeed — keeps the table consistent.
        conn.commit()
        print(f"[DB] Inserted {inserted} rows. Done.")

    except Exception as exc:
        conn.rollback()
        sys.exit(f"[ERROR] DB insert failed, transaction rolled back: {exc}")
    finally:
        conn.close()


# ── CLI entry point ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Onboard a facility from S3 CSV into IronPlan Mini.")
    parser.add_argument("--facility-id", required=True, help="UUID of the target facility in the DB")
    parser.add_argument("--s3-key",      required=True, help="S3 object key, e.g. uploads/lincoln_county.csv")
    parser.add_argument("--dry-run",     action="store_true", help="Validate only — do not write to DB")
    args = parser.parse_args()

    # Validate facility-id is a proper UUID before making any network calls.
    try:
        uuid.UUID(args.facility_id)
    except ValueError:
        sys.exit(f"[ERROR] --facility-id must be a valid UUID, got: {args.facility_id!r}")

    raw  = download_from_s3(args.s3_key)
    df   = validate(raw)
    load_into_db(df, args.facility_id, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
