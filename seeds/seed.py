from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.settings import settings

from .seed_books import seed_books
from .seed_users import seed_users


def seed_database():
    """Seed the database with initial data."""
    database_url = f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}/{settings.postgres_db}"
    engine = create_engine(url=database_url)
    LocalSession = sessionmaker(bind=engine)

    if settings.environment == "production":
        raise RuntimeError(
            "Seeding the database is not allowed in production environment."
        )

    with LocalSession() as session:
        # Truncate the tables before seeding to avoid duplicate entries
        session.execute(text("TRUNCATE TABLE books RESTART IDENTITY CASCADE;"))
        session.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))

        seed_users(session)
        seed_books(session)
        session.commit()

    print("Database seeded successfully.")


if __name__ == "__main__":
    seed_database()
