from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.exceptions import InactiveUserError, InvalidCredentialsError, NotFoundError
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

    async def update_password(
        self, user_id: int, current_password: str, new_password: str
    ) -> User:
        """
        Update a user's password.

        Arguments:
            user_id: The ID of the user whose password is to be updated.
            current_password: The user's current password.
            new_password: The new password to set.

        Returns:
            user: The updated User object.

        Raises:
            NotFoundError: If the user with the given ID does not exist.
            InactiveUserError: If the user account is inactive.
            InvalidCredentialsError: If the current password is incorrect.
        """
        result = await self._session.execute(select(User).where(User.id == user_id))
        user: User | None = result.scalar_one_or_none()

        if not user:
            raise NotFoundError("User not found")

        if not user.is_active:
            raise InactiveUserError("User account is inactive")

        if not verify_password(current_password, user.password):
            raise InvalidCredentialsError("Invalid credentials")

        hashed_new_password = hash_password(new_password)
        user.password = hashed_new_password

        await self._session.commit()
        await self._session.refresh(user)

        return user
