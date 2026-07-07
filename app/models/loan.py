from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, func
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

    due_date: Mapped[datetime] = mapped_column(nullable=False)
    returned_date: Mapped[datetime] = mapped_column(nullable=True)

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
