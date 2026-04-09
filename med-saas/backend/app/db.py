from __future__ import annotations

import re
from contextlib import contextmanager
from typing import Iterator

from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

from .settings import settings


HIGH_SEVERITY_RE = re.compile(
    r"\b(avoid|contraindicat|life[- ]threatening|fatal|serious|severe|black box|do not use)\b",
    re.IGNORECASE,
)
MEDIUM_SEVERITY_RE = re.compile(
    r"\b(caution|monitor|dose adjustment|increase|decrease|reduce|risk|potentiate|elevat)\b",
    re.IGNORECASE,
)
OCR_TOKEN_RE = re.compile(r"[A-Z][A-Z0-9+\-/.]{2,}")

pool: SimpleConnectionPool | None = None


def get_pool() -> SimpleConnectionPool:
    global pool
    if pool is None:
        if not settings.db_password:
            raise RuntimeError("Database password missing. Set MEDICINE_API_DB_PASSWORD.")
        pool = SimpleConnectionPool(
            1,
            6,
            dbname=settings.db_name,
            user=settings.db_user,
            password=settings.db_password,
            host=settings.db_host,
            port=settings.db_port,
        )
    return pool


@contextmanager
def db_cursor() -> Iterator[RealDictCursor]:
    conn = get_pool().getconn()
    try:
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
        finally:
            cursor.close()
    finally:
        get_pool().putconn(conn)


def classify_interaction_severity(text: str) -> str:
    if HIGH_SEVERITY_RE.search(text):
        return "high"
    if MEDIUM_SEVERITY_RE.search(text):
        return "medium"
    return "low"


def search_function_available() -> bool:
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM pg_proc
                WHERE proname = 'search_medicines'
            ) AS available
            """
        )
        row = cursor.fetchone()
    return bool(row["available"])


def database_health() -> dict:
    with db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS count FROM medicines")
        row = cursor.fetchone()
    return {"database_connected": True, "medicine_count": int(row["count"])}


def _exact_match(name: str) -> dict | None:
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, generic_name, manufacturer, product_type, route, 200::float AS match_score
            FROM medicines
            WHERE lower(name) = lower(%s)
               OR lower(coalesce(generic_name, '')) = lower(%s)
            ORDER BY id
            LIMIT 1
            """,
            (name, name),
        )
        row = cursor.fetchone()
    if not row:
        return None
    data = dict(row)
    data["match_strategy"] = "exact"
    return data


def _fuzzy_match(name: str) -> dict | None:
    if not search_function_available():
        return None

    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, generic_name, manufacturer, product_type, route, score AS match_score
            FROM public.search_medicines(%s::text, %s::integer)
            LIMIT 1
            """,
            (name, 1),
        )
        row = cursor.fetchone()

    if not row:
        return None

    data = dict(row)
    if float(data["match_score"]) < 60:
        return None
    data["match_strategy"] = "fuzzy"
    return data


def search_medicine_candidates(name: str, limit: int = 5) -> list[dict]:
    query = name.strip()
    if not query or not search_function_available():
        return []

    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, generic_name, manufacturer, product_type, route, score AS match_score
            FROM public.search_medicines(%s::text, %s::integer)
            """,
            (query, limit),
        )
        rows = [dict(row) for row in cursor.fetchall()]

    return [row for row in rows if float(row["match_score"]) >= 55]


def resolve_medicine(name: str) -> dict | None:
    query = name.strip()
    if not query:
        return None
    return _exact_match(query) or _fuzzy_match(query)


def _ocr_queries(text: str) -> list[str]:
    normalized = re.sub(r"[^A-Za-z0-9+\-/. ]+", " ", text.upper())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if not normalized:
        return []

    queries: list[str] = []
    seen: set[str] = set()

    def push(value: str) -> None:
        candidate = re.sub(r"\s+", " ", value).strip()
        alpha_count = sum(1 for char in candidate if char.isalpha())
        if len(candidate) < 3 or alpha_count < 2 or candidate in seen:
            return
        seen.add(candidate)
        queries.append(candidate)

    push(normalized)

    alpha_only = re.sub(r"[^A-Za-z ]+", " ", normalized)
    alpha_only = re.sub(r"\s+", " ", alpha_only).strip()
    if alpha_only and alpha_only != normalized:
        push(alpha_only)

    tokens = OCR_TOKEN_RE.findall(normalized)
    for token in tokens:
        if sum(1 for char in token if char.isalpha()) >= 2:
            push(token)

    return queries


def lookup_medicine_from_ocr(ocr_candidates: list[dict]) -> tuple[dict | None, dict | None]:
    ranked_hits: list[dict] = []

    for candidate in ocr_candidates:
        for query in _ocr_queries(str(candidate.get("text", ""))):
            for match in search_medicine_candidates(query, limit=5):
                ranked_hits.append(
                    {
                        "query": query,
                        "ocr_text": candidate["text"],
                        "ocr_confidence": float(candidate.get("confidence", 0)),
                        "match": match,
                        "combined_score": float(match["match_score"]) + (float(candidate.get("confidence", 0)) * 100),
                    }
                )

    if not ranked_hits:
        return None, None

    best = max(
        ranked_hits,
        key=lambda item: (item["combined_score"], item["match"]["match_score"], item["ocr_confidence"]),
    )
    if float(best["match"]["match_score"]) < settings.ocr_min_match_score:
        return None, None

    details = get_medicine_details(int(best["match"]["id"]))
    if not details:
        return None, None

    details["match_strategy"] = "ocr_db_match"
    details["match_score"] = float(best["match"]["match_score"])
    return details, best


def get_medicine_details(medicine_id: int) -> dict | None:
    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                m.id,
                m.name,
                m.generic_name,
                m.manufacturer,
                m.product_type,
                m.route,
                m.indications,
                m.dosage,
                m.description,
                m.warnings,
                m.contraindications,
                (SELECT COUNT(*)::int FROM side_effects s WHERE s.drug_id = m.id) AS side_effect_count,
                (SELECT COUNT(*)::int FROM interactions i WHERE i.drug_id = m.id) AS interaction_count
            FROM medicines m
            WHERE m.id = %s
            """,
            (medicine_id,),
        )
        detail = cursor.fetchone()
        if not detail:
            return None

        cursor.execute(
            """
            SELECT effect
            FROM side_effects
            WHERE drug_id = %s
            ORDER BY effect
            LIMIT 15
            """,
            (medicine_id,),
        )
        side_effects = [str(row["effect"]) for row in cursor.fetchall()]

        cursor.execute(
            """
            SELECT interacting_drug, description
            FROM interactions
            WHERE drug_id = %s
            ORDER BY id
            LIMIT 10
            """,
            (medicine_id,),
        )
        interactions = [
            {
                "interacting_drug": row["interacting_drug"],
                "description": row["description"],
                "severity": classify_interaction_severity(str(row["description"])),
            }
            for row in cursor.fetchall()
        ]

    return {**dict(detail), "side_effects": side_effects, "interactions": interactions}


def lookup_medicine(name: str) -> dict | None:
    resolved = resolve_medicine(name)
    if not resolved:
        return None

    details = get_medicine_details(int(resolved["id"]))
    if not details:
        return None

    details["match_strategy"] = resolved.get("match_strategy")
    details["match_score"] = float(resolved.get("match_score", 0))
    return details
