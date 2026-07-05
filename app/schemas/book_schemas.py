from datetime import datetime

from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    isbn: str | None = Field(default=None, pattern=r"^\d{13}$")
    description: str | None = Field(default=None, max_length=2000)
    publisher: str | None = Field(default=None, max_length=255)
    published_year: int | None = Field(
        default=None,
        le=datetime.now().year,
    )
    total_copies: int = Field(default=1, gt=0)


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    isbn: str | None = Field(default=None, pattern=r"^\d{13}$")
    description: str | None = Field(default=None, max_length=2000)
    publisher: str | None = Field(default=None, max_length=255)
    published_year: int | None = Field(
        default=None,
        le=datetime.now().year,
    )
    total_copies: int | None = Field(default=None, gt=0)
