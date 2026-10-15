import os
from typing import List, Union, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

# Compute absolute path to repository root for deterministic SQLite file location
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_SQLITE_PATH = os.path.join(_BASE_DIR, "fts_store.db").replace("\\", "/")
_DEFAULT_DB_URL = f"sqlite:///{_DEFAULT_SQLITE_PATH}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "FTS Store API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server Binding & Proxy Headers
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FORWARDED_ALLOW_IPS: str = "*"

    # Host Security
    ALLOWED_HOSTS: Union[str, List[str]] = "*"

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_allowed_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [h.strip() for h in v.split(",") if h.strip()]
        return v

    # Security Keys
    SECRET_KEY: str = "supersecret_fts_store_jwt_key_2026"
    ADMIN_API_KEY: str = "fts_admin_secret_key_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SECURE_COOKIES: bool = False

    # Administrator Initial Bootstrap
    INITIAL_ADMIN_EMAIL: str = "admin@frndstech.com"
    INITIAL_ADMIN_PASSWORD: Optional[str] = None

    # Database Configuration (PostgreSQL with SQLite local dev fallback)
    DATABASE_URL: str = Field(
        default=_DEFAULT_DB_URL,
        description="Database connection URL. Defaults to local SQLite if PostgreSQL is not specified."
    )
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 1800
    DATABASE_SSL_MODE: Optional[str] = None

    # Object / Asset Storage
    MEDIA_STORAGE_BACKEND: str = "local"  # "local", "s3", "cloudinary"
    S3_BUCKET_NAME: Optional[str] = None
    S3_REGION: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    CDN_BASE_URL: Optional[str] = None

    # Monitoring & Telemetry
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "text"  # "text" in dev, "json" in prod

    # Documentation Toggle
    DOCS_ENABLED: bool = True

    # CORS Whitelist (comma-separated or wildcard)
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ["production", "prod"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Enforce production security invariants
if settings.is_production():
    settings.DEBUG = False
    settings.SECURE_COOKIES = True
    if settings.LOG_FORMAT == "text":
        settings.LOG_FORMAT = "json"
    if settings.SECRET_KEY in ["supersecret_fts_store_jwt_key_2026", "secret", "changeme", ""]:
        import warnings
        warnings.warn(
            "CRITICAL SECURITY WARNING: Insecure or default SECRET_KEY is active in production environment! "
            "Configure a strong 64-character secret key via SECRET_KEY environment variable.",
            RuntimeWarning
        )
    if settings.BACKEND_CORS_ORIGINS == ["*"]:
        import warnings
        warnings.warn(
            "SECURITY WARNING: Wildcard CORS origin ('*') is configured in production with allow_credentials=True. "
            "Configure explicit production domain origins in BACKEND_CORS_ORIGINS (e.g. 'https://ftsstore.com').",
            RuntimeWarning
        )

