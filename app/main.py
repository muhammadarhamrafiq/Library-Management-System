from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    auth_router,
    books_router,
    loans_router,
    otp_router,
    stats_router,
    users_router,
)
from app.core.settings import settings

is_dev = settings.environment == "development"
app = FastAPI(
    docs_url="/docs" if is_dev else None,
    redoc_url="/redoc" if is_dev else None,
    openapi_url="/openapi.json" if is_dev else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(books_router, prefix="/api/v1")
app.include_router(loans_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(otp_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")
