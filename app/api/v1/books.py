from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.services import get_book_service
from app.services import BookService

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("/")
async def list_books(
    book_service: Annotated[BookService, Depends(get_book_service)],
    search_query: str | None = None,
    author: str | None = None,
    title: str | None = None,
    publisher: str | None = None,
    published_year: int | None = None,
    isbn: str | None = None,
    available: bool | None = None,
    sortBy: str | None = None,
    sortOrder: str = "asc",
    skip: int = 0,
    limit: int = 10,
    include_deleted: bool = False,
):
    books = await book_service.list_books(
        search_query=search_query,
        author=author,
        title=title,
        publisher=publisher,
        published_year=published_year,
        isbn=isbn,
        available=available,
        sortBy=sortBy,
        sortOrder=sortOrder,
        skip=skip,
        limit=limit,
        include_deleted=include_deleted,
    )
    return books


@router.get("/{book_id}")
async def get_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_id: int,
    include_deleted: bool = False,
):
    book = await book_service.get_book(book_id, include_deleted=include_deleted)
    return book
