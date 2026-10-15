import uvicorn
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    from app.core.config import settings
    print(f"Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} [{settings.ENVIRONMENT}]")
    print(f"API Base: http://{settings.HOST}:{settings.PORT}{settings.API_V1_STR}")
    print(f"Swagger Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"Database Target: {settings.DATABASE_URL.split('://')[0]}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
