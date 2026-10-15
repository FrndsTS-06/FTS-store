from fastapi import APIRouter, status, Response
from app.core.config import settings
from app.db.session import check_db_readiness

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health", status_code=status.HTTP_200_OK)
def get_service_health():
    """
    Service liveness check verifying the application process is operational.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT
    }

@router.get("/health/ready")
@router.get("/health/db")
def get_database_readiness(response: Response):
    """
    Service readiness check actively testing database connectivity.
    """
    db_status = check_db_readiness()
    if not db_status.get("readiness"):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    else:
        response.status_code = status.HTTP_200_OK

    return {
        "service": settings.PROJECT_NAME,
        "database": db_status
    }
