from fastapi import FastAPI

from app.routes import book_router

app = FastAPI()

app.include_router(book_router)
