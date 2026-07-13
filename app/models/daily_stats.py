from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DailyStatistics(Base):
    __tablename__ = "daily_statistics"

    stat_date: Mapped[date] = mapped_column(Date, primary_key=True)

    books_borrowed: Mapped[int] = mapped_column(Integer, default=0)
    books_returned: Mapped[int] = mapped_column(Integer, default=0)

    active_loans: Mapped[int] = mapped_column(Integer, default=0)
    overdue_loans: Mapped[int] = mapped_column(Integer, default=0)

    active_members: Mapped[int] = mapped_column(Integer, default=0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
