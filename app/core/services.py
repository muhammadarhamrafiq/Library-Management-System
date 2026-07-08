from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import AuthService, BookService

from .database import get_db


def get_auth_service(session: Annotated[AsyncSession, Depends(get_db)]) -> AuthService:
    """
    Dependency function to get an instance of AuthService.

    Arguments:
        session: The database session dependency.

    Returns:
        An instance of AuthService.
    """
    return AuthService(session)


def get_book_service(session: Annotated[AsyncSession, Depends(get_db)]) -> BookService:
    book_service = BookService(session)
    return book_service
