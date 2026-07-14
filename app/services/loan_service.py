from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models import Loan, LoanStatus

from .book_service import BookService
from .user_service import UserService

LOAN_DURATION_DAYS = 14
MAX_RENEWALS = 2
FINE_PER_DAY_LATE = Decimal("0.50")


class LoanService:
    def __init__(self, session: AsyncSession):
        """
        Initialize the LoanService with a database session.

        Arguments:
            session(AsyncSession): async session for database operations.

        Returns:
            None

        Raises:
            None
        """
        self._session = session

    async def borrow_book(self, user_id: int, book_id: int) -> Loan:
        """
        Borrow a book for a user.

        Arguments:
            user_id(int): ID of the user borrowing the book.
            book_id(int): ID of the book to be borrowed.

        Returns:
            Loan: The created Loan object.

        Raises:
            NotFoundError: If user or book doesn't exist.
            BadRequestError: If user is inactive or book has no available copies.
            ConflictError: If user already has a pending/active loan for this book.
        """
        user_service = UserService(self._session)
        await user_service.get_user(user_id)

        book_service = BookService(self._session)
        book = await book_service.get_book(book_id, for_update=True)

        if book.available_copies <= 0:
            raise BadRequestError("No available copies of the book.")

        existing = await self._session.execute(
            select(Loan).where(
                Loan.user_id == user_id,
                Loan.book_id == book_id,
                Loan.status.in_(
                    [LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.OVERDUE]
                ),
            )
        )

        if existing.scalars().first():
            raise ConflictError(
                "User already has a pending or active loan for this book."
            )

        loan = Loan(
            user_id=user_id,
            book_id=book_id,
            due_date=datetime.now(UTC) + timedelta(days=LOAN_DURATION_DAYS),
            status=LoanStatus.PENDING,
        )
        self._session.add(loan)
        await self._session.commit()
        await self._session.refresh(loan)
        return loan

    async def get_loan(self, loan_id: int, user_id: int | None = None) -> Loan:
        """
        Retrieve a loan by its ID.

        Arguments:
            loan_id(int): ID of the loan to retrieve.
            user_id(int | None): ID of the user requesting the loan.

        Returns:
            Loan: The retrieved Loan object.

        Raises:
            NotFoundError: If the loan doesn't exist.
        """
        query = select(Loan).where(Loan.id == loan_id)

        if user_id is not None:
            query = query.where(Loan.user_id == user_id)

        result = await self._session.execute(query)
        loan = result.scalars().first()

        if not loan:
            raise NotFoundError(f"Loan with ID {loan_id} not found.")
        return loan

    async def update_loan_status(
        self, loan_id: int, new_status: LoanStatus, user_id: int | None = None
    ) -> Loan:
        """
        Update loan status with proper validation and side effects.

        Arguments:
            loan_id(int): ID of the loan to update.
            new_status(LoanStatus): The new status to set.
            user_id(int | None): ID of the user updating the loan.
        Returns:
            loan(Loan): The updated Loan object.

        Raises:
            NotFoundError: If the loan doesn't exist.
            BadRequestError: If the status transition is invalid.
        """

        loan = await self.get_loan(loan_id, user_id=user_id)
        book_service = BookService(self._session)
        book = await book_service.get_book(loan.book_id, for_update=True)

        if new_status == LoanStatus.APPROVED:
            if loan.status != LoanStatus.PENDING:
                raise BadRequestError(
                    f"Cannot approve loan: current status is '{loan.status.value}'."
                )
            if book.available_copies < 1:
                raise BadRequestError(f"Book '{book.title}' has no available copies.")
            book.available_copies -= 1

        elif new_status == LoanStatus.RETURNED:
            if loan.status not in [LoanStatus.APPROVED, LoanStatus.OVERDUE]:
                raise BadRequestError(
                    f"Cannot return loan: current status is '{loan.status.value}'."
                )
            book.available_copies += 1
            loan.returned_date = datetime.now(UTC)

            if loan.returned_date > loan.due_date:
                days_late = (loan.returned_date - loan.due_date).days
                loan.fine_amount = Decimal(days_late) * FINE_PER_DAY_LATE

        elif new_status == LoanStatus.OVERDUE:
            if loan.status != LoanStatus.APPROVED:
                raise BadRequestError(
                    f"Cannot mark as overdue: current status is '{loan.status.value}'."
                )
            if loan.due_date >= datetime.now(UTC):
                raise BadRequestError("Loan is not yet overdue.")

        elif new_status == LoanStatus.CANCELED:
            if loan.status != LoanStatus.PENDING:
                raise BadRequestError(
                    f"Cannot cancel loan: current status is '{loan.status.value}'."
                )

        elif new_status == LoanStatus.REJECTED:
            if loan.status != LoanStatus.PENDING:
                raise BadRequestError(
                    f"Cannot reject loan: current status is '{loan.status.value}'."
                )

        else:
            raise BadRequestError(f"Invalid status transition to '{new_status.value}'.")

        loan.status = new_status
        await self._session.commit()
        await self._session.refresh(loan)

        return loan

    async def renew_loan(self, loan_id: int, user_id: int | None = None) -> Loan:
        """
        Renew an active loan, extending its due date.

        Arguments:
            loan_id(int): ID of the loan to renew.
            user_id(int | None): ID of the user renewing the loan.

        Returns:
            Loan: The renewed Loan object.

        Raises:
            NotFoundError: If the loan doesn't exist.
            BadRequestError:
                If the loan isn't currently approved.
                If the loan has already hit the renewal limit.
                If another user has a pending request for this book.
        """
        loan = await self.get_loan(loan_id, user_id=user_id)

        if loan.status != LoanStatus.APPROVED:
            raise BadRequestError(
                f"Cannot renew loan: current status is '{loan.status.value}'."
            )

        if loan.renew_count >= MAX_RENEWALS:
            raise BadRequestError(
                f"Cannot renew loan: maximum of {MAX_RENEWALS} renewals reached."
            )

        waiting = await self._session.execute(
            select(Loan).where(
                Loan.book_id == loan.book_id,
                Loan.status == LoanStatus.PENDING,
            )
        )
        if waiting.scalars().first():
            raise BadRequestError(
                "Cannot renew loan: another user is waiting for this book."
            )

        loan.due_date = loan.due_date + timedelta(days=LOAN_DURATION_DAYS)
        loan.renew_count += 1

        await self._session.commit()
        await self._session.refresh(loan)

        return loan

    async def pay_fine(self, loan_id: int) -> Loan:
        """
        Mark a loan's outstanding fine as paid.

        Arguments:
            loan_id(int): ID of the loan whose fine is being paid.

        Returns:
            Loan: The updated Loan object.

        Raises:
            NotFoundError: If the loan doesn't exist.
            BadRequestError:
                If there is no outstanding fine.
                If the fine has already been paid.
        """
        loan = await self.get_loan(loan_id)

        if loan.fine_amount <= 0:
            raise BadRequestError("This loan has no outstanding fine.")

        if loan.fine_paid:
            raise BadRequestError("This loan's fine has already been paid.")

        loan.fine_paid = True

        await self._session.commit()
        await self._session.refresh(loan)

        return loan

    async def list_loans(
        self,
        user_id: int | None = None,
        status: LoanStatus | None = None,
        book_id: int | None = None,
        outstanding_fine: bool | None = None,
        skip: int = 0,
        limit: int = 10,
    ) -> dict[str, Any]:
        """
        List loans based on filters.

        Arguments:
            user_id(int | None): Filter by user ID.
            status(LoanStatus | None): Filter by loan status.
            book_id(int | None): Filter by book ID.
            outstanding_fine(bool | None): Filter by outstanding fine.
            skip(int): Number of records to skip for pagination.
            limit(int): Maximum number of records to return for pagination.
        Returns:
            dict[str, Any]: A dictionary containing the list of Loan objects
            and pagination information.

        Raises:
            None
        """

        if skip < 0:
            raise BadRequestError("skip must be >= 0")
        if limit < 1 or limit > 100:
            raise BadRequestError("limit must be between 1 and 100")

        query = select(Loan)

        if user_id is not None:
            query = query.where(Loan.user_id == user_id)
        if status is not None:
            query = query.where(Loan.status == status)
        if book_id is not None:
            query = query.where(Loan.book_id == book_id)
        if outstanding_fine is not None:
            if outstanding_fine:
                query = query.where(Loan.fine_amount > 0, Loan.fine_paid.is_(False))
            else:
                query = query.where(
                    (Loan.fine_amount == 0) | (Loan.fine_paid.is_(True))
                )

        result = await self._session.execute(query.offset(skip).limit(limit))
        loans = result.scalars().all()

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self._session.execute(count_query)
        total_count = total_result.scalar()

        return {
            "data": loans,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1,
            "has_next": skip + limit < total_count,
            "has_previous": skip > 0,
        }

    async def process_overdue_loans(self) -> list[Loan]:
        """
        Process overdue loans by updating their status and calculating fines.

        This method checks for loans that are overdue and updates their status
        to 'OVERDUE'. It also calculates the fine amount based on the number of
        days late and the defined fine rate.

        Returns:
            None
        """

        result = await self._session.execute(
            select(Loan).where(
                Loan.status == LoanStatus.APPROVED,
                Loan.due_date < datetime.now(UTC),
            )
        )
        overdue_loans = result.scalars().all()

        for loan in overdue_loans:
            loan.status = LoanStatus.OVERDUE
            days_late = (datetime.now(UTC) - loan.due_date).days
            loan.fine_amount = Decimal(days_late) * FINE_PER_DAY_LATE

        await self._session.commit()

        return overdue_loans
