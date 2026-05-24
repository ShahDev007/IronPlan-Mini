import psycopg2
from psycopg2 import pool as pg_pool
from contextlib import contextmanager
from config import settings

# Module-level connection pool — created once on first import, reused across requests.
# minconn=1 keeps a warm connection; maxconn=10 matches Railway's free-tier concurrency.
_pool: pg_pool.ThreadedConnectionPool | None = None


def get_pool() -> pg_pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = pg_pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.database_url,
        )
    return _pool


@contextmanager
def get_conn():
    """Yield a connection from the pool and return it when the block exits."""
    conn = get_pool().getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        get_pool().putconn(conn)
