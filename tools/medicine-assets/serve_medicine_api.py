from __future__ import annotations

import os
import re
from contextlib import contextmanager
from itertools import combinations
from pathlib import Path
from typing import Iterator

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool


BASE_DIR = Path(__file__).resolve().parent
BOOTSTRAP_SQL_PATH = BASE_DIR / "sql" / "openfda_search_optimizations.sql"

DETAIL_SQL = """
SELECT
    id,
    set_id,
    label_id,
    name,
    generic_name,
    manufacturer,
    product_ndc,
    package_ndc,
    rxcui,
    product_type,
    route,
    indications,
    dosage,
    description,
    warnings,
    contraindications,
    created_at,
    updated_at
FROM medicines
WHERE id = %s
"""

SIDE_EFFECT_SQL = """
SELECT effect
FROM side_effects
WHERE drug_id = %s
ORDER BY effect
LIMIT %s
"""

SIDE_EFFECT_COUNT_SQL = """
SELECT COUNT(*) AS count
FROM side_effects
WHERE drug_id = %s
"""

INTERACTION_SQL = """
SELECT interacting_drug, description
FROM interactions
WHERE drug_id = %s
ORDER BY id
LIMIT %s
"""

INTERACTION_COUNT_SQL = """
SELECT COUNT(*) AS count
FROM interactions
WHERE drug_id = %s
"""

HIGH_SEVERITY_RE = re.compile(
    r"\b(avoid|contraindicat|life[- ]threatening|fatal|serious|severe|black box|do not use)\b",
    re.IGNORECASE,
)
MEDIUM_SEVERITY_RE = re.compile(
    r"\b(caution|monitor|dose adjustment|increase|decrease|reduce|risk|potentiate|elevat)\b",
    re.IGNORECASE,
)
ALIAS_SPLIT_RE = re.compile(r"[,/;()]|\band\b", re.IGNORECASE)

pool: SimpleConnectionPool | None = None

app = FastAPI(
    title="Bee.dr Medicine Intelligence API",
    version="1.0.0",
    summary="Local API over imported openFDA PostgreSQL medicine data.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InteractionCheckRequest(BaseModel):
    medicines: list[str] = Field(min_length=2, max_length=10)


def db_settings() -> dict[str, str]:
    return {
        "dbname": os.getenv("MEDICINE_DB_NAME", os.getenv("PGDATABASE", "med_saas")),
        "user": os.getenv("MEDICINE_DB_USER", os.getenv("PGUSER", "postgres")),
        "password": os.getenv("MEDICINE_DB_PASSWORD", os.getenv("PGPASSWORD", "")),
        "host": os.getenv("MEDICINE_DB_HOST", os.getenv("PGHOST", "localhost")),
        "port": os.getenv("MEDICINE_DB_PORT", os.getenv("PGPORT", "5432")),
    }


def ensure_pool() -> SimpleConnectionPool:
    global pool
    if pool is None:
        settings = db_settings()
        if not settings["password"]:
            raise RuntimeError("Database password missing. Set MEDICINE_DB_PASSWORD or PGPASSWORD.")
        pool = SimpleConnectionPool(1, 8, **settings)
    return pool


@contextmanager
def db_cursor() -> Iterator[RealDictCursor]:
    conn = ensure_pool().getconn()
    try:
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
        finally:
            cursor.close()
    finally:
        ensure_pool().putconn(conn)


def apply_bootstrap_sql() -> None:
    sql = BOOTSTRAP_SQL_PATH.read_text(encoding="utf-8")
    with db_cursor() as cursor:
        cursor.execute(sql)


def classify_interaction_severity(text: str) -> str:
    if HIGH_SEVERITY_RE.search(text):
        return "high"
    if MEDIUM_SEVERITY_RE.search(text):
        return "medium"
    return "low"


def split_aliases(value: str | None) -> list[str]:
    if not value:
        return []
    aliases: list[str] = []
    seen: set[str] = set()
    for part in ALIAS_SPLIT_RE.split(value):
        alias = re.sub(r"\s+", " ", part).strip().lower()
        if len(alias) < 3 or alias in seen:
            continue
        seen.add(alias)
        aliases.append(alias)
    return aliases


def search_medicine_records(query_text: str, limit: int, min_score: float = 60) -> list[dict]:
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, generic_name, manufacturer, product_type, route, score
            FROM search_medicines(%s, %s)
            """,
            (query_text, limit),
        )
        rows = [dict(row) for row in cursor.fetchall()]
    return [row for row in rows if float(row["score"]) >= min_score]


def get_medicine_by_id(medicine_id: int) -> dict | None:
    with db_cursor() as cursor:
        cursor.execute(DETAIL_SQL, (medicine_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_side_effects(medicine_id: int, limit: int = 50) -> tuple[int, list[str]]:
    with db_cursor() as cursor:
        cursor.execute(SIDE_EFFECT_COUNT_SQL, (medicine_id,))
        count_row = cursor.fetchone()
        cursor.execute(SIDE_EFFECT_SQL, (medicine_id, limit))
        effects = [str(row["effect"]) for row in cursor.fetchall()]
    return int(count_row["count"]), effects


def get_interactions(medicine_id: int, limit: int = 50) -> tuple[int, list[dict]]:
    with db_cursor() as cursor:
        cursor.execute(INTERACTION_COUNT_SQL, (medicine_id,))
        count_row = cursor.fetchone()
        cursor.execute(INTERACTION_SQL, (medicine_id, limit))
        rows = [dict(row) for row in cursor.fetchall()]

    interactions = [
        {
            "interacting_drug": row["interacting_drug"],
            "description": row["description"],
            "severity": classify_interaction_severity(str(row["description"])),
        }
        for row in rows
    ]
    return int(count_row["count"]), interactions


def resolve_medicine(name: str) -> dict | None:
    matches = search_medicine_records(name, 1, min_score=60)
    return matches[0] if matches else None


def alias_set(record: dict) -> set[str]:
    aliases = set(split_aliases(record.get("name")))
    aliases.update(split_aliases(record.get("generic_name")))
    return aliases


def find_pairwise_interaction(source: dict, target: dict) -> list[dict]:
    source_id = int(source["id"])
    target_aliases = alias_set(target)
    if not target_aliases:
        return []

    clauses: list[str] = []
    params: list[object] = [source_id]
    for alias in sorted(target_aliases, key=len, reverse=True)[:8]:
        pattern = f"%{alias}%"
        clauses.append("lower(coalesce(interacting_drug, '')) LIKE %s")
        params.append(pattern)
        clauses.append("lower(description) LIKE %s")
        params.append(pattern)

    sql = f"""
    SELECT interacting_drug, description
    FROM interactions
    WHERE drug_id = %s
      AND ({' OR '.join(clauses)})
    ORDER BY id
    LIMIT 10
    """

    with db_cursor() as cursor:
        cursor.execute(sql, params)
        rows = [dict(row) for row in cursor.fetchall()]

    return [
        {
            "interacting_drug": row["interacting_drug"] or target["name"],
            "description": row["description"],
            "severity": classify_interaction_severity(str(row["description"])),
        }
        for row in rows
    ]


@app.on_event("startup")
def startup() -> None:
    ensure_pool()
    apply_bootstrap_sql()


@app.on_event("shutdown")
def shutdown() -> None:
    global pool
    if pool is not None:
        pool.closeall()
        pool = None


@app.get("/health")
def health() -> dict:
    with db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS medicines FROM medicines")
        row = cursor.fetchone()
    return {"status": "ok", "database": db_settings()["dbname"], "medicines": int(row["medicines"])}


@app.get("/api/v1/medicines/search")
def search_medicines(
    q: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(60, ge=0, le=200),
) -> dict:
    results = search_medicine_records(q, limit, min_score=min_score)
    return {"query": q, "count": len(results), "results": results}


@app.get("/api/v1/medicines/{medicine_id}")
def medicine_detail(
    medicine_id: int,
    side_effect_limit: int = Query(30, ge=1, le=200),
    interaction_limit: int = Query(30, ge=1, le=200),
) -> dict:
    record = get_medicine_by_id(medicine_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medicine not found")

    side_effect_count, side_effects = get_side_effects(medicine_id, side_effect_limit)
    interaction_count, interactions = get_interactions(medicine_id, interaction_limit)

    return {
        **record,
        "side_effect_count": side_effect_count,
        "side_effects": side_effects,
        "interaction_count": interaction_count,
        "interactions": interactions,
    }


@app.get("/api/v1/medicines/resolve/by-name")
def resolve_by_name(name: str = Query(..., min_length=2, max_length=120)) -> dict:
    record = resolve_medicine(name)
    if not record:
        raise HTTPException(status_code=404, detail="No medicine match found")
    return record


@app.post("/api/v1/interactions/check")
def check_interactions(payload: InteractionCheckRequest) -> dict:
    resolved: list[dict] = []
    for original in payload.medicines:
        match = resolve_medicine(original)
        if not match:
            raise HTTPException(status_code=404, detail=f"No medicine match found for '{original}'")
        resolved.append({"input": original, "match": match})

    pair_checks: list[dict] = []
    for left, right in combinations(resolved, 2):
        forward_hits = find_pairwise_interaction(left["match"], right["match"])
        reverse_hits = find_pairwise_interaction(right["match"], left["match"])
        evidence = forward_hits + reverse_hits
        severity_order = {"high": 3, "medium": 2, "low": 1}
        severity = "none"
        if evidence:
            severity = max(evidence, key=lambda item: severity_order[item["severity"]])["severity"]

        pair_checks.append(
            {
                "drug_a": left["match"]["name"],
                "drug_b": right["match"]["name"],
                "severity": severity,
                "evidence_count": len(evidence),
                "evidence": evidence[:10],
                "status": "warnings_found" if evidence else "no_direct_warning_found_in_openfda_labels",
            }
        )

    return {"resolved_medicines": resolved, "pair_checks": pair_checks}
