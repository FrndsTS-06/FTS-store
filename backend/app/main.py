from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.errors import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler
)
from app.api.v1.api import api_router

# Initialize structured logging
setup_logging()

def create_app() -> FastAPI:
    docs_url = "/docs" if settings.DOCS_ENABLED else None
    redoc_url = "/redoc" if settings.DOCS_ENABLED else None
    openapi_url = f"{settings.API_V1_STR}/openapi.json" if settings.DOCS_ENABLED else None

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        description="FTS Store enterprise RESTful API for Frnds Tech Solution.",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url
    )

    # Trusted Host Protection
    if settings.ALLOWED_HOSTS and settings.ALLOWED_HOSTS != ["*"]:
        from fastapi.middleware.trustedhost import TrustedHostMiddleware
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security Headers Middleware
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.is_production():
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    # Centralized Error Handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # Mount API Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Mount legacy prototype routers under /api for backward compatibility with existing tests
    from app.routers import products, categories, cart, orders
    app.include_router(products.router, prefix="/api")
    app.include_router(categories.router, prefix="/api")
    app.include_router(cart.router, prefix="/api")
    app.include_router(orders.router, prefix="/api")

    # Root System Info Endpoint
    @app.get("/", tags=["System"])
    def root_info():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.PROJECT_VERSION,
            "status": "online",
            "docs": "/docs",
            "redoc": "/redoc",
            "health": f"{settings.API_V1_STR}/health",
            "database_readiness": f"{settings.API_V1_STR}/health/db"
        }

    # Top-Level Health Check Alias (Liveness)
    @app.get("/health", tags=["System"])
    def top_health_alias():
        return {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.PROJECT_VERSION
        }

    # Top-Level Readiness Check (Database & Dependencies)
    @app.get("/ready", tags=["System"])
    def top_ready_alias(response: Response):
        from app.db.session import check_db_readiness
        db_status = check_db_readiness()
        is_ready = bool(db_status.get("readiness"))
        if not is_ready:
            response.status_code = 503
        return {
            "status": "ready" if is_ready else "unready",
            "service": settings.PROJECT_NAME,
            "database": db_status
        }

    logger.info(f"{settings.PROJECT_NAME} v{settings.PROJECT_VERSION} initialized [{settings.ENVIRONMENT}]")
    return app

app = create_app()
