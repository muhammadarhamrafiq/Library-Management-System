from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.settings import settings
from app.models import Book, User

from .seed_books import seed_books
from .seed_users import seed_users


def seed_database():
    """Seed the database with initial data."""
    database_url = f"postgresql://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}/{settings.postgres_db}"
    engine = create_engine(url=database_url)
    LocalSession = sessionmaker(bind=engine)

    with LocalSession() as session:
        # Check if the database is already seeded
        if session.query(User).first() or session.query(Book).first():
            raise RuntimeError("Database is already seeded. Aborting seeding process.")

        seed_users(session)
        seed_books(session)
        session.commit()

    print("Database seeded successfully.")


if __name__ == "__main__":
    seed_database()
