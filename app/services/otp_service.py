import json
import secrets

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.exceptions import (
    ConflictError,
    InactiveUserError,
    InvalidCredentialsError,
    NotFoundError,
)
from app.models import User
from app.schemas import ConfirmResetRequest, UserCreate, VerifyOTPRequest


class OTPService:
    def __init__(self, redis: Redis, session: AsyncSession):
        self._redis = redis
        self._session = session

    async def _register_user(self, user_data: UserCreate):
        """
        Register a new user in the database.

        Arguments:
            user_data (UserCreate): The user data to be registered.

        Returns:
            User: The registered user object.

        Raises:
            ConflictError: If the user already exists in the database.
        """
        result = await self._session.execute(
            select(User).where(User.email == user_data.email)
        )
        user: User = result.scalar_one_or_none()

        if user:
            if not user.is_active:
                user.is_active = True
                user.full_name = user_data.full_name
                user.password = user_data.password
                self._session.add(user)
                await self._session.commit()
                await self._session.refresh(user)
                return user
            else:
                raise ConflictError("A user with this email already exists.")

        user = User(**user_data.model_dump())
        self._session.add(user)

        await self._session.commit()
        await self._session.refresh(user)

        return user

    async def initiate_register(self, user: UserCreate):
        """
        Sends an OTP for user registration and stores
        it in Redis

        Arguments:
            user(UserCreate): The user for whom the OTP is being sent.

        Returns:
            None

        Raises:
            ConflictError: If the user already exists in the database.
        """

        result = await self._session.execute(
            select(User).where(User.email == user.email)
        )
        existing_user: User = result.scalar_one_or_none()

        if existing_user and existing_user.is_active:
            raise ConflictError("User already exists")

        otp_key = f"reg:otp:{user.email}"
        otp = secrets.randbelow(900000) + 100000

        hashed_otp = hash_password(str(otp))
        hashed_password = hash_password(user.password)

        otp_payload = {
            "otp": hashed_otp,
            "email": user.email,
            "full_name": user.full_name,
            "password": hashed_password,
        }

        await self._redis.set(
            otp_key,
            json.dumps(otp_payload),
            ex=1200,
        )
        return otp

    async def verify_register(self, otp_request: VerifyOTPRequest):
        """
        Verifies the OTP for user registration.

        Arguments:
            otp_request (VerifyOTPRequest): The request containing the email
                and OTP to be verified.

        Returns:
            user(UserCreate): The user data if the OTP is verified successfully.

        Raises:
            NotFoundError: If the OTP does not exist for the given email.
            InvalidCredentialsError: If the provided OTP does not match the stored OTP.
        """

        otp_key = f"reg:otp:{otp_request.email}"
        raw = await self._redis.get(otp_key)

        if not raw:
            raise NotFoundError("OTP not found or expired")

        otp = json.loads(raw)

        if not verify_password(otp_request.otp, otp["otp"]):
            raise InvalidCredentialsError("Invalid OTP")

        await self._redis.delete(otp_key)

        user = await self._register_user(
            UserCreate(
                full_name=otp["full_name"],
                email=otp["email"],
                password=otp["password"],
            )
        )

        return user

    async def initiate_pwreset(self, email: str):
        """
        Generate and send OTP to initiate the password
        reseting process.

        Arguments:
            email(str): The email of the user.

        Returns:
            None

        Raises:
            None
        """

        result = await self._session.execute(select(User).where(User.email == email))
        user: User = result.scalar_one_or_none()

        if not user or not user.is_active:
            return None

        otp_key = f"pwreset:otp:{email}"
        otp = secrets.randbelow(900000) + 100000
        hashed_otp = hash_password(str(otp))

        otp_payload = {"otp": hashed_otp, "email": email}

        await self._redis.set(otp_key, json.dumps(otp_payload), ex=1200)
        return otp

    async def verify_reset_otp(self, otp_request: VerifyOTPRequest):
        """
        Verify Provided OTP and return the token to
        reset the password

        Arguments:
            otp_request (VerifyOTPRequest): The request containing
            the email and OTP to be verified.

        Returns:
            token(str): Token use to reset the password

        Raises:
            NotFoundError: If the OTP does not exist for the given email.
            InvalidCredentialsError: If the provided OTP does not match the stored OTP.
        """
        otp_key = f"pwreset:otp:{otp_request.email}"
        raw = await self._redis.get(otp_key)

        if not raw:
            raise NotFoundError("OTP not found or expired")

        otp_data = json.loads(raw)

        if not verify_password(otp_request.otp, otp_data["otp"]):
            raise InvalidCredentialsError("Invalid OTP")

        await self._redis.delete(otp_key)
        reset_token = secrets.token_urlsafe(32)

        reset_token_key = f"pwreset:token:{reset_token}"
        await self._redis.set(reset_token_key, otp_request.email, ex=600)

        return reset_token

    async def reset_password(self, confirm_request: ConfirmResetRequest):
        """
        Confirm the password reset using the provided token and new password.

        Arguments:
            confirm_request (ConfirmResetRequest): The request containing the token
                and new password.

        Raises:
            NotFoundError: If the token does not exist or has expired
                or user with email not found.
            InactiverUserError: If the user is not active.
        """

        reset_token_key = f"pwreset:token:{confirm_request.token}"
        email = await self._redis.get(reset_token_key)

        await self._redis.delete(reset_token_key)

        if not email:
            raise NotFoundError("Token not Found")

        email = email.decode()
        result = await self._session.execute(select(User).where(User.email == email))
        user: User = result.scalar_one_or_none()

        if not user:
            raise NotFoundError("User not Found")

        if not user.is_active:
            raise InactiveUserError("User account is deactivated")

        hashed_password = hash_password(confirm_request.new_password)
        user.password = hashed_password

        await self._session.commit()
        await self._session.refresh(user)
        return user
