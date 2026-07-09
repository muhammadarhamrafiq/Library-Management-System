from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_user_from_token
from app.core.services import get_loan_service
from app.models import LoanStatus
from app.schemas import LoanRequest
from app.services import LoanService

router = APIRouter(
    prefix="/loans",
    tags=["Loans"],
)


@router.post("/")
async def borrow_book(
    user: Annotated[dict, Depends(get_user_from_token)],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_data: LoanRequest,
):
    """
    Create a new loan.
    """
    loan = await loan_service.borrow_book(
        user_id=user["sub"], book_id=loan_data.book_id
    )

    return loan


@router.get("/")
async def list_loans(
    user: Annotated[dict, Depends(get_user_from_token)],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    status: LoanStatus | None = None,
    book_id: int | None = None,
):
    """
    List loans based on filters.
    """
    loans = await loan_service.list_loans(
        status=status, book_id=book_id, user_id=user["sub"]
    )
    return loans


@router.get("/{loan_id}")
async def get_loan(
    user: Annotated[dict, Depends(get_user_from_token)],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Retrieve a loan by its ID.
    """
    loan = await loan_service.get_loan(loan_id=loan_id, user_id=user["sub"])
    return loan


@router.put("/{loan_id}/return")
async def return_book(
    user: Annotated[dict, Depends(get_user_from_token)],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Return a borrowed book.
    """
    loan = await loan_service.update_loan_status(
        loan_id=loan_id, new_status=LoanStatus.RETURNED, user_id=user["sub"]
    )
    return loan


@router.put("/{loan_id}/cancel")
async def cancel_loan(
    user: Annotated[dict, Depends(get_user_from_token)],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Cancel a pending loan.
    """
    loan = await loan_service.update_loan_status(
        loan_id=loan_id, new_status=LoanStatus.CANCELED, user_id=user["sub"]
    )
    return loan
