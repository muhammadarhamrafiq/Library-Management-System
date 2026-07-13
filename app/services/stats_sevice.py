from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyStatistics, Loan, LoanStatus, User
from app.schemas import MonthlyReportData


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

    async def generate_monthly_report(self, year: int, month: int) -> MonthlyReportData:
        """
        Aggregates daily_statistics rows for the given year/month into a
        monthly summary. Sums are used for flow metrics (borrowed/returned),
        averages for point-in-time metrics (active_loans/overdue_loans/active_members).
        """
        start_date = date(year, month, 1)
        end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

        result = await self.session.execute(
            select(
                func.coalesce(func.sum(DailyStatistics.books_borrowed), 0),
                func.coalesce(func.sum(DailyStatistics.books_returned), 0),
                func.coalesce(func.avg(DailyStatistics.active_loans), 0),
                func.coalesce(func.avg(DailyStatistics.overdue_loans), 0),
                func.coalesce(func.avg(DailyStatistics.active_members), 0),
                func.count(DailyStatistics.stat_date),
            ).where(
                DailyStatistics.stat_date >= start_date,
                DailyStatistics.stat_date < end_date,
            )
        )
        (
            total_borrowed,
            total_returned,
            avg_active_loans,
            avg_overdue_loans,
            avg_active_members,
            days_included,
        ) = result.one()

        return MonthlyReportData(
            year=year,
            month=month,
            total_books_borrowed=total_borrowed,
            total_books_returned=total_returned,
            avg_active_loans=round(float(avg_active_loans), 2),
            avg_overdue_loans=round(float(avg_overdue_loans), 2),
            avg_active_members=round(float(avg_active_members), 2),
            days_included=days_included,
        )
