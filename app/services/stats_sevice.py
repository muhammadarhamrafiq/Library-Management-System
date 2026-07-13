from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyStatistics, Loan, LoanStatus, User


class StatisticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def update_daily_statistics(self) -> None:
        """
        Calculates the current day's library statistics and updates
        today's DailyStatistics record.
        """

        today = datetime.now(UTC).date()

        active_loans = (
            await self.session.scalar(
                select(func.count())
                .select_from(Loan)
                .where(Loan.status == LoanStatus.APPROVED)
            )
            or 0
        )

        overdue_loans = (
            await self.session.scalar(
                select(func.count())
                .select_from(Loan)
                .where(Loan.status == LoanStatus.OVERDUE)
            )
            or 0
        )

        active_members = (
            await self.session.scalar(
                select(func.count()).select_from(User).where(User.is_active.is_(True))
            )
            or 0
        )

        books_borrowed = (
            await self.session.scalar(
                select(func.count())
                .select_from(Loan)
                .where(func.date(Loan.created_at) == today)
            )
            or 0
        )

        books_returned = (
            await self.session.scalar(
                select(func.count())
                .select_from(Loan)
                .where(func.date(Loan.returned_date) == today)
            )
            or 0
        )

        stats = await self.session.get(DailyStatistics, today)

        if stats is None:
            stats = DailyStatistics(stat_date=today)
            self.session.add(stats)

        stats.books_borrowed = books_borrowed or 0
        stats.books_returned = books_returned or 0

        stats.active_loans = active_loans or 0
        stats.overdue_loans = overdue_loans or 0

        stats.active_members = active_members or 0

        await self.session.commit()
