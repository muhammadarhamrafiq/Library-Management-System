from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LoanStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    RETURNED = "returned"
    OVERDUE = "overdue"
    REJECTED = "rejected"
    CANCELED = "canceled"


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"), nullable=False)

    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    returned_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    renew_count: Mapped[int] = mapped_column(nullable=False, default=0)
    fine_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )
    fine_paid: Mapped[bool] = mapped_column(nullable=False, default=False)

    status: Mapped[LoanStatus] = mapped_column(
        nullable=False, default=LoanStatus.PENDING
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
