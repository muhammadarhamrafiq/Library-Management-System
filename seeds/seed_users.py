from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import Role, User


def seed_users(session: AsyncSession):
    """
    Seed users to database
    Arguments:
        session (AsyncSession): The SQLAlchemy session to use for database operations.
    Returns:
        None
    """

    # Users to seed
    users = [
        {
            "email": "admin@example.com",
            "full_name": "System Admin",
            "role": Role.ADMIN,
        },
        {
            "email": "librarian@example.com",
            "full_name": "Library Staff",
            "role": Role.LIBRARIAN,
        },
        {
            "email": "alice@example.com",
            "full_name": "Alice Johnson",
            "role": Role.MEMBER,
        },
        {"email": "bob@example.com", "full_name": "Bob Smith", "role": Role.MEMBER},
        {
            "email": "charlie@example.com",
            "full_name": "Charlie Brown",
            "role": Role.MEMBER,
        },
    ]
    password = hash_password("password123")  # Default password for all users

    # Seed users to the database
    for user_data in users:
        user = User(
            email=user_data["email"],
            password=password,
            full_name=user_data["full_name"],
            role=user_data["role"],
        )
        session.add(user)

    print("Users seeded successfully.")
