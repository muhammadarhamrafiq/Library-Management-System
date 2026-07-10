from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import require_role
from app.core.services import get_book_service
from app.models import Role
from app.schemas import BookCreate, BookUpdate
from app.services import BookService

router = APIRouter(prefix="/books", tags=["Books"])


@router.post("")
async def create_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_data: BookCreate,
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
):
    """
    Endpoint to create a new book in the library.
    Requires user to have the librarian role to access this endpoint.
    """
    book = await book_service.add_book(book_data)
    return book


@router.get("")
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
    )
    return books


@router.get("/deleted")
async def list_deleted_books(
    book_service: Annotated[BookService, Depends(get_book_service)],
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
    search_query: str | None = None,
):
    """
    Endpoint to list deleted books in the library.
    Requires user to have the librarian or admin role to access this endpoint.
    """
    deleted_books = await book_service.list_books(
        search_query=search_query, deleted=True
    )
    return deleted_books


@router.get("/deleted/{book_id}")
async def get_deleted_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_id: int,
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
):
    """
    Endpoint to retrieve a deleted book by its ID.
    Requires user to have the librarian or admin role to access this endpoint.
    """
    deleted_book = await book_service.get_book(book_id, deleted=True)
    return deleted_book


@router.get("/{book_id}")
async def get_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_id: int,
):
    book = await book_service.get_book(book_id)
    return book


@router.put("/{book_id}")
async def update_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_id: int,
    book_data: BookUpdate,
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
):
    """
    Endpoint to update an existing book in the library.
    Requires user to have the librarian or admin role to access this endpoint.
    """
    updated_book = await book_service.update_book(book_id, book_data)
    return updated_book


@router.delete("/{book_id}")
async def delete_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_id: int,
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
):
    """
    Endpoint to delete a book from the library.
    Requires user to have the librarian or admin role to access this endpoint.
    """
    await book_service.delete_book(book_id)
    return {"message": "Book deleted successfully"}


@router.post("/{book_id}/restore")
async def restore_book(
    book_service: Annotated[BookService, Depends(get_book_service)],
    book_id: int,
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
):
    """
    Endpoint to restore a deleted book.
    Requires user to have the librarian or admin role to access this endpoint.
    """
    restored_book = await book_service.restore_book(book_id)
    return restored_book
