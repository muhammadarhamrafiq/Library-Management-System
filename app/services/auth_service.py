from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.exceptions import InactiveUserError, InvalidCredentialsError, UserNotFoundError
from app.models import User


class AuthService:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def authenticate_user(self, email: str, password: str) -> User:
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
        result = await self._session.execute(select(User).where(User.id == user_id))
        user: User | None = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError("User not found")

        if not user.is_active:
            raise InactiveUserError("User account is inactive")

        if not verify_password(current_password, user.password):
            raise InvalidCredentialsError("Invalid credentials")

        hashed_new_password = hash_password(new_password)
        user.password = hashed_new_password

        await self._session.commit()
        await self._session.refresh(user)

        return user
