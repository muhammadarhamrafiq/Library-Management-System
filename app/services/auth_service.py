from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.exceptions import InactiveUserError, InvalidCredentialsError
from app.models import User


class AuthService:
    def __init__(self, session: AsyncSession):
        """
        Initialize the AuthService with an asynchronous database session.

        Arguments:
            session: An instance of AsyncSession for database operations.

        Returns:
            None

        Raises:
            None
        """
        self._session = session

    async def authenticate_user(self, email: str, password: str) -> User:
        """
        Authenticate a user by email and password.

        Arguments:
            email: The user's email address.
            password: The user's password.

        Returns:
            user: The authenticated User object.

        Raises:
            InvalidCredentialsError: If the email or password is incorrect.
            InactiveUserError: If the user account is inactive.
        """
        result = await self._session.execute(select(User).where(User.email == email))
        user: User | None = result.scalar_one_or_none()

        if not user:
            raise InvalidCredentialsError("Invalid credentials")

        if not user.is_active:
            raise InactiveUserError("User account is inactive")

        if not verify_password(password, user.password):
            raise InvalidCredentialsError("Invalid credentials")

        return user
