from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.core.logging import logger

class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: list = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)

class DatabaseConnectionError(AppException):
    def __init__(self, message: str = "Database service unreachable"):
        super().__init__(
            code="DATABASE_UNAVAILABLE",
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.warning(f"Domain Exception [{exc.code}] at {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []))
        details.append({
            "field": field,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error")
        })

    logger.info(f"Validation failure at {request.url.path}: {details}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request payload failed schema validation",
                "details": details
            }
        }
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error(f"SQLAlchemy Database Error at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database operation failed while processing your request",
                "details": []
            }
        }
    )

async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.critical(f"Unhandled Exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please contact system support.",
                "details": []
            }
        }
    )
