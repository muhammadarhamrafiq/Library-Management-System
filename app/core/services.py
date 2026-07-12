from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import AuthService, BookService, LoanService, OTPService, UserService

from .database import get_db
from .redis import get_redis


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


def get_loan_service(session: Annotated[AsyncSession, Depends(get_db)]) -> LoanService:
    loan_service = LoanService(session)
    return loan_service


def get_user_service(session: Annotated[AsyncSession, Depends(get_db)]) -> UserService:
    user_service = UserService(session)
    return user_service


def get_otp_service(
    redis: Annotated[Redis, Depends(get_redis)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    otp_service = OTPService(redis, session)
    return otp_service
