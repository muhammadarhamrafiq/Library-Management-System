from datetime import datetime

from sqlalchemy import DateTime, Index, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str]
    author: Mapped[str] = mapped_column(index=True)
    isbn: Mapped[str | None] = mapped_column(index=True, nullable=True)
    description: Mapped[str | None] = mapped_column(nullable=True)

    publisher: Mapped[str | None] = mapped_column(nullable=True)
    published_year: Mapped[int | None] = mapped_column(nullable=True)

    total_copies: Mapped[int] = mapped_column(default=1)
    available_copies: Mapped[int] = mapped_column(default=1)

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    __table_args__ = (
        Index(
            "ix_books_isbn_unique_active",
            "isbn",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )
