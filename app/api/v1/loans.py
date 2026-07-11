from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.security import get_user_from_token, require_role
from app.core.services import get_loan_service
from app.models import LoanStatus, Role
from app.schemas import LoanRequest
from app.services import LoanService

router = APIRouter(
    prefix="/loans",
    tags=["Loans"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
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
    user_id: int | None = None,
    outstanding_fine: bool | None = None,
    skip: int = 0,
    limit: int = 10,
):
    """
    List loans based on filters.
    """
    if user["role"] in (Role.LIBRARIAN.value, Role.ADMIN.value):
        loans = await loan_service.list_loans(
            status=status,
            book_id=book_id,
            user_id=user_id,
            outstanding_fine=outstanding_fine,
            skip=skip,
            limit=limit,
        )
    else:
        loans = await loan_service.list_loans(
            status=status,
            book_id=book_id,
            user_id=user["sub"],
            outstanding_fine=outstanding_fine,
            skip=skip,
            limit=limit,
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
    if user["role"] == Role.LIBRARIAN.value or user["role"] == Role.ADMIN.value:
        loan = await loan_service.get_loan(loan_id=loan_id)
    else:
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
    Cancel a pending loan request.
    """
    loan = await loan_service.update_loan_status(
        loan_id=loan_id, new_status=LoanStatus.CANCELED, user_id=user["sub"]
    )
    return loan


@router.put("/{loan_id}/renew")
async def renew_loan(
    user: Annotated[dict, Depends(get_user_from_token)],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Renew an active loan, extending its due date.
    """
    loan = await loan_service.renew_loan(loan_id=loan_id, user_id=user["sub"])
    return loan


@router.put("/{loan_id}/approve")
async def approve_loan(
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Approve a loan request.
    Requires user admin or librarian role to access this endpoint.
    """
    loan = await loan_service.update_loan_status(
        loan_id=loan_id, new_status=LoanStatus.APPROVED
    )
    return loan


@router.put("/{loan_id}/reject")
async def reject_loan(
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Reject a loan request
    Requires user admin or librarian role to access this endpoint.
    """
    loan = await loan_service.update_loan_status(
        loan_id=loan_id, new_status=LoanStatus.REJECTED
    )
    return loan


@router.put("/{loan_id}/pay-fine")
async def pay_fine(
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
    loan_service: Annotated[LoanService, Depends(get_loan_service)],
    loan_id: int,
):
    """
    Mark a loan's outstanding fine as paid.
    Librarian/admin only, since payment is collected and recorded by staff.
    """
    loan = await loan_service.pay_fine(loan_id=loan_id)
    return loan
