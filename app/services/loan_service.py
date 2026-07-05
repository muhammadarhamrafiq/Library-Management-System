from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models import Loan, LoanStatus

from .book_service import BookService
from .user_service import UserService

LOAN_DURATION_DAYS = 14


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
        book = await book_service.get_book(book_id)

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
            due_date=datetime.now(UTC).replace(tzinfo=None)
            + timedelta(days=LOAN_DURATION_DAYS),
            status=LoanStatus.PENDING,
        )
        self._session.add(loan)
        await self._session.commit()
        await self._session.refresh(loan)
        return loan

    async def get_loan(self, loan_id: int) -> Loan:
        """
        Retrieve a loan by its ID.

        Arguments:
            loan_id(int): ID of the loan to retrieve.

        Returns:
            Loan: The retrieved Loan object.

        Raises:
            NotFoundError: If the loan doesn't exist.
        """
        loan = await self._session.get(Loan, loan_id)
        if not loan:
            raise NotFoundError(f"Loan with ID {loan_id} not found.")
        return loan

    async def update_loan_status(self, loan_id: int, new_status: LoanStatus) -> Loan:
        """
        Update loan status with proper validation and side effects.

        Arguments:
            loan_id(int): ID of the loan to update.
            new_status(LoanStatus): The new status to set.

        Returns:
            loan(Loan): The updated Loan object.

        Raises:
            NotFoundError: If the loan doesn't exist.
            BadRequestError: If the status transition is invalid.
        """

        loan = await self.get_loan(loan_id)
        book_service = BookService(self._session)
        book = await book_service.get_book(loan.book_id, include_deleted=True)

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

        elif new_status == LoanStatus.OVERDUE:
            if loan.status != LoanStatus.APPROVED:
                raise BadRequestError(
                    f"Cannot mark as overdue: current status is '{loan.status.value}'."
                )

            now_naive = datetime.now(UTC).replace(tzinfo=None)
            due_date_naive = (
                loan.due_date.replace(tzinfo=None)
                if loan.due_date.tzinfo
                else loan.due_date
            )
            if due_date_naive >= now_naive:
                raise BadRequestError("Loan is not yet overdue.")

        else:
            raise BadRequestError(f"Invalid status transition to '{new_status.value}'.")

        loan.status = new_status
        await self._session.commit()
        await self._session.refresh(loan)

        return loan

    async def cancel_loan(self, loan_id: int) -> Loan:
        """
        Cancel a loan if it's still pending.

        Arguments:
            loan_id(int): ID of the loan to cancel.

        Returns:
            Loan: The updated Loan object with status set to 'rejected'.

        Raises:
            NotFoundError: If the loan doesn't exist.
            BadRequestError: If the loan is not in a pending state.
        """
        loan = await self.get_loan(loan_id)

        if loan.status != LoanStatus.PENDING:
            raise BadRequestError(
                f"Cannot cancel loan: current status is '{loan.status.value}'."
            )

        loan.status = LoanStatus.CANCELED
        await self._session.commit()
        await self._session.refresh(loan)
        return loan

    async def list_loans(
        self,
        user_id: int | None = None,
        status: LoanStatus | None = None,
        book_id: int | None = None,
    ) -> list[Loan]:
        """
        List loans based on filters.

        Arguments:
            user_id(int | None): Filter by user ID.
            status(LoanStatus | None): Filter by loan status.
            book_id(int | None): Filter by book ID.

        Returns:
            list[Loan]: List of Loan objects matching the filters.

        Raises:
            None
        """
        query = select(Loan)

        if user_id is not None:
            query = query.where(Loan.user_id == user_id)
        if status is not None:
            query = query.where(Loan.status == status)
        if book_id is not None:
            query = query.where(Loan.book_id == book_id)

        result = await self._session.execute(query)
        return result.scalars().all()
