import psycopg2
from psycopg2 import pool as pg_pool
from contextlib import contextmanager
from urllib.parse import urlparse, unquote
from config import settings

_pool: pg_pool.ThreadedConnectionPool | None = None


def get_pool() -> pg_pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        url = urlparse(settings.database_url)
        _pool = pg_pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            host=url.hostname,
            port=url.port or 5432,
            user=unquote(url.username or ""),
            password=unquote(url.password or ""),
            dbname=(url.path or "/postgres").lstrip("/"),
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
