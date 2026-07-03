from sqlalchemy.orm import Session

from app.models import Book


def seed_books(session: Session):
    """
    Seed books to database
    Arguments:
        session (Session): The SQLAlchemy session to use for database operations.
    Returns:
        None
    """
    # Books to seed
    books = [
        Book(
            title="Clean Code",
            author="Robert C. Martin",
            total_copies=5,
            available_copies=5,
        ),
        Book(
            title="Design Patterns",
            author="Erich Gamma",
            total_copies=3,
            available_copies=3,
        ),
        Book(
            title="Effective Java",
            author="Joshua Bloch",
            total_copies=4,
            available_copies=4,
        ),
        Book(
            title="Head First Design Patterns",
            author="Eric Freeman",
            total_copies=2,
            available_copies=2,
        ),
        Book(
            title="The Pragmatic Programmer",
            author="Andrew Hunt",
            total_copies=4,
            available_copies=4,
        ),
        Book(
            title="Refactoring",
            author="Martin Fowler",
            total_copies=3,
            available_copies=3,
        ),
        Book(
            title="Introduction to Algorithms",
            author="Thomas H. Cormen",
            total_copies=2,
            available_copies=2,
        ),
        Book(
            title="Python Crash Course",
            author="Eric Matthes",
            total_copies=5,
            available_copies=5,
        ),
        Book(
            title="Java: The Complete Reference",
            author="Herbert Schildt",
            total_copies=4,
            available_copies=4,
        ),
        Book(
            title="Artificial Intelligence: A Modern Approach",
            author="Stuart Russell",
            total_copies=2,
            available_copies=2,
        ),
    ]

    session.add_all(books)
    print("Books seeded successfully.")
