from fastapi import FastAPI

from app.api.v1 import auth_router, books_router

app = FastAPI()

app.include_router(books_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
