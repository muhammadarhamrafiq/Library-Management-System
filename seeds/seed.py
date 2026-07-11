from asyncio import run

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.settings import settings

from .seed_books import seed_books
from .seed_users import seed_users


async def seed_database():
    """Seed the database with initial data."""
    database_url = f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}/{settings.postgres_db}"
    engine = create_async_engine(url=database_url)
    LocalSession = async_sessionmaker(bind=engine)

    if settings.environment == "production":
        raise RuntimeError(
            "Seeding the database is not allowed in production environment."
        )

    async with LocalSession() as session:
        # Truncate the tables before seeding to avoid duplicate entries
        await session.execute(text("TRUNCATE TABLE books RESTART IDENTITY CASCADE;"))
        await session.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))

        seed_users(session)
        seed_books(session)
        await session.commit()

    print("Database seeded successfully.")


if __name__ == "__main__":
    run(seed_database())
