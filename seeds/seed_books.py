# app/seeders/book_seeder.py
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Book


def seed_books(session: AsyncSession):
    """
    Seed books to database
    Arguments:
        session (AsyncSession): The SQLAlchemy session to use for database operations.
    Returns:
        None
    """

    books_data = [
        {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "isbn": "9780547928227",
            "description": "A hobbit goes on an unexpected adventure "
            "with dwarves and a wizard.",
            "publisher": "Houghton Mifflin Harcourt",
            "published_year": 1937,
            "total_copies": 5,
            "available_copies": 5,
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "9780451524935",
            "description": "A dystopian novel about totalitarian "
            "government surveillance.",
            "publisher": "Signet Classic",
            "published_year": 1949,
            "total_copies": 8,
            "available_copies": 8,
        },
        {
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "isbn": "9780061120084",
            "description": "A story of racial injustice and moral "
            "growth in the American South.",
            "publisher": "Harper Perennial",
            "published_year": 1960,
            "total_copies": 6,
            "available_copies": 6,
        },
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "9780743273565",
            "description": "A tale of wealth, love, and the "
            "American Dream in the Jazz Age.",
            "publisher": "Scribner",
            "published_year": 1925,
            "total_copies": 4,
            "available_copies": 4,
        },
        {
            "title": "Dune",
            "author": "Frank Herbert",
            "isbn": "9780441172719",
            "description": "A science fiction epic about politics, "
            "religion, and ecology on a desert planet.",
            "publisher": "Ace Books",
            "published_year": 1965,
            "total_copies": 7,
            "available_copies": 7,
        },
    ]

    for book_data in books_data:
        book = Book(**book_data)
        session.add(book)

    print("Books seeded successfully.")
