from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models import Book
from app.schemas import BookCreate, BookUpdate


class BookService:
    def __init__(self, session: AsyncSession):
        """
        Initialize the BookService with an asynchronous database session.

        Arguments:
            session: An instance of AsyncSession for database operations.

        Returns:
            None

        Raises:
            None
        """
        self._session = session

    async def add_book(self, book_data: BookCreate):
        """
        Add a new book to the database.

        Arguments:
            book_data(BookCreate): An instance of BookCreate containing book details.

        Returns:
            book(Book): The newly created Book object.

        Raises:
            ConflictError: If a book with the same ISBN already exists.
        """
        if book_data.isbn:
            existing_book = await self._session.execute(
                select(Book).where(
                    Book.isbn == book_data.isbn, Book.deleted_at.is_(None)
                )
            )

            if existing_book.scalars().first():
                raise ConflictError(f"Book with ISBN {book_data.isbn} already exists.")

        book = Book(**book_data.model_dump(), available_copies=book_data.total_copies)
        self._session.add(book)

        await self._session.commit()
        await self._session.refresh(book)
        return book

    async def get_book(
        self, book_id: int, deleted: bool = False, for_update: bool = False
    ) -> Book:
        """
        Retrieve a book by its ID.

        Arguments:
            book_id(int): The ID of the book to retrieve.
            deleted(bool):
                Whether to include deleted books in the search. Default is False.
            for_update(bool): Whether to lock the book for update. Default is False.

        Returns:
            book(Book): The Book object with the specified ID.

        Raises:
            NotFoundError: If the book with the specified ID does not exist.
        """
        query = select(Book).where(Book.id == book_id)

        if deleted:
            query = query.where(Book.deleted_at.is_not(None))
        else:
            query = query.where(Book.deleted_at.is_(None))

        if for_update:
            query = query.with_for_update()

        result = await self._session.execute(query)
        book = result.scalar_one_or_none()

        if not book:
            raise NotFoundError(f"Book with ID {book_id} not found.")

        return book

    async def list_books(
        self,
        search_query: str | None = None,
        author: str | None = None,
        title: str | None = None,
        publisher: str | None = None,
        published_year: int | None = None,
        isbn: str | None = None,
        available: bool | None = None,
        sortBy: str | None = None,
        sortOrder: str = "asc",
        skip: int = 0,
        limit: int = 10,
        deleted: bool = False,
    ) -> dict[str, Any]:
        """
        List books with optional filtering, sorting, and pagination.

        Arguments:
            search_query(str | None): A search query to filter books.
            author(str | None): Filter books by author.
            title(str | None): Filter books by title.
            publisher(str | None): Filter books by publisher.
            published_year(int | None): Filter books by published year.
            isbn(str | None): Filter books by ISBN.
            available(bool | None): Filter books by availability.
            sortBy(str | None): The field to sort the results by a field.
            sortOrder(str): The order of sorting 'asc' or 'desc'. Default is 'asc'.
            skip(int): The number of records to skip for pagination. Default is 0.
            limit(int): The maximum number of records to return. Default is 10.
            include_deleted(bool): include deleted books in results. Default is False.
            deleted(bool): Filter books by deletion status. Default is False.

        Returns:
            dict[str, any]: A dictionary containing the paginated results and metadata.

        Raises:
            None
        """

        if skip < 0:
            raise BadRequestError("skip must be >= 0")
        if limit < 1 or limit > 100:
            raise BadRequestError("limit must be between 1 and 100")

        query = select(Book)

        # Apply Soft Deleted Search Filter
        if deleted:
            query = query.where(Book.deleted_at.is_not(None))
        else:
            query = query.where(Book.deleted_at.is_(None))

        # Apply Filters
        if author:
            query = query.where(Book.author.ilike(f"%{author}%"))
        if title:
            query = query.where(Book.title.ilike(f"%{title}%"))
        if publisher:
            query = query.where(Book.publisher.ilike(f"%{publisher}%"))
        if published_year is not None:
            query = query.where(Book.published_year == published_year)
        if isbn:
            query = query.where(Book.isbn == isbn)
        if available is not None:
            if available:
                query = query.where(Book.available_copies > 0)
            else:
                query = query.where(Book.available_copies == 0)

        # Apply Search Query Filter
        if search_query:
            query = query.where(
                or_(
                    Book.title.ilike(f"%{search_query}%"),
                    Book.author.ilike(f"%{search_query}%"),
                    Book.description.ilike(f"%{search_query}%"),
                    Book.isbn.ilike(f"%{search_query}%"),
                    Book.publisher.ilike(f"%{search_query}%"),
                )
            )

        # Apply Sorting
        ALLOWED_SORT_FIELDS = {"title", "author", "publisher", "published_year", "isbn"}
        if sortBy:
            if sortBy not in ALLOWED_SORT_FIELDS:
                raise BadRequestError(
                    "Invalid sort field. Allowed fields are: "
                    f"{', '.join(ALLOWED_SORT_FIELDS)}"
                )
            sort_column = getattr(Book, sortBy, None)
            if sort_column:
                if sortOrder.lower() == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())

        result = await self._session.execute(query.offset(skip).limit(limit))
        books = result.scalars().all()

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self._session.execute(count_query)
        total_count = total_result.scalar()

        # Pagination metadata
        return {
            "data": books,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1,
            "has_next": skip + limit < total_count,
            "has_previous": skip > 0,
        }

    async def update_book(self, book_id: int, book_data: BookUpdate) -> Book:
        """
        Update an existing book's details.

        Arguments:
            book_id(int): The ID of the book to update.
            book_data(BookUpdate): Containing updated book details.

        Returns:
            book(Book): The updated Book object.

        Raises:
            BadRequestError:
                If no data is provided for update.
                If the total copies are less than the number of borrowed copies.
            NotFoundError: If the book with the specified ID does not exist.
            ConflictError: If a book with the same ISBN already exists.

        """
        book = await self.get_book(book_id, deleted=False, for_update=True)

        update_data = book_data.model_dump(exclude_unset=True)

        if not update_data:
            raise BadRequestError("No data provided for update.")

        if "isbn" in update_data and update_data["isbn"]:
            existing = await self._session.execute(
                select(Book).where(
                    Book.isbn == update_data["isbn"],
                    Book.id != book_id,
                    Book.deleted_at.is_(None),
                )
            )
            if existing.scalar_one_or_none():
                raise ConflictError(
                    f"Book with ISBN {update_data['isbn']} already exists."
                )

        if "total_copies" in update_data:
            borrowed_copies = book.total_copies - book.available_copies
            new_total_copies = update_data["total_copies"]

            new_available_copies = new_total_copies - borrowed_copies
            if new_available_copies < 0:
                raise BadRequestError(
                    "Total copies cannot be less than the number of borrowed copies."
                )

            update_data["available_copies"] = new_available_copies

        for key, value in update_data.items():
            setattr(book, key, value)

        await self._session.commit()
        await self._session.refresh(book)

        return book

    async def delete_book(self, book_id) -> Book:
        """
        Soft delete a book by its ID.

        Arguments:
            book_id(int): The ID of the book to delete.

        Returns:
            book(Book): The soft-deleted Book object.

        Raises:
            NotFoundError: If the book with the specified ID does not exist.
            BadRequestError: If the book has borrowed copies and cannot be deleted.
        """
        book = await self.get_book(book_id, deleted=False, for_update=True)

        if book.available_copies < book.total_copies:
            raise BadRequestError("Cannot delete a book that has borrowed copies.")

        book.deleted_at = datetime.now(UTC)

        await self._session.commit()
        await self._session.refresh(book)

        return book

    async def restore_book(self, book_id) -> Book:
        """
        Restore a soft-deleted book by its ID.

        Arguments:
            book_id(int): The ID of the book to restore.

        Returns:
            book(Book): The restored Book object.

        Raises:
            NotFoundError: If the book with the specified ID does not exist.
            BadRequestError: If the book is not deleted.
            ConflictError: If a book with the same ISBN already exists.
        """
        book = await self.get_book(book_id, deleted=True, for_update=True)

        if book.isbn:
            existing_book = await self._session.execute(
                select(Book).where(Book.isbn == book.isbn, Book.deleted_at.is_(None))
            )

            if existing_book.scalars().first():
                raise ConflictError(
                    f"Cannot restore book with ISBN {book.isbn} as it already exists."
                )

        book.deleted_at = None
        await self._session.commit()
        await self._session.refresh(book)

        return book
