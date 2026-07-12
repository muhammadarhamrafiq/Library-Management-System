from fastapi import FastAPI

from app.api.v1 import auth_router, books_router, loans_router, otp_router, users_router
from app.core.settings import settings

is_dev = settings.environment == "development"
app = FastAPI(
    docs_url="/docs" if is_dev else None,
    redoc_url="/redoc" if is_dev else None,
    openapi_url="/openapi.json" if is_dev else None,
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(books_router, prefix="/api/v1")
app.include_router(loans_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(otp_router, prefix="/api/v1")
