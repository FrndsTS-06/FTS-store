from typing import Generator
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG and not settings.DATABASE_URL.startswith("sqlite")
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Managed PostgreSQL production pooling parameters
    engine_kwargs.update({
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_timeout": settings.DATABASE_POOL_TIMEOUT,
        "pool_recycle": settings.DATABASE_POOL_RECYCLE,
    })
    if settings.DATABASE_SSL_MODE:
        connect_args["sslmode"] = settings.DATABASE_SSL_MODE

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

# Enable foreign keys and check constraints on SQLite connections
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-safe database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_readiness() -> dict:
    """
    Executes a lightweight query (SELECT 1) to verify database connectivity.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            is_ready = result == 1
            return {
                "status": "ready" if is_ready else "error",
                "database": engine.dialect.name,
                "readiness": is_ready
            }
    except Exception as e:
        logger.error(f"Database readiness check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": engine.dialect.name,
            "readiness": False,
            "error": str(e)
        }
