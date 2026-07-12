import json
import random

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.exceptions import ConflictError, InvalidCredentialsError, NotFoundError
from app.models import User
from app.schemas import UserCreate, VerifyOTPRequest


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
        existing_user = await self._session.execute(
            select(User).where(User.email == user_data.email)
        )

        if existing_user.scalar_one_or_none():
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
            dict: A dictionary containing the OTP.

        Raises:
            ConflictError: If the user already exists in the database.
        """

        existing_user = await self._session.execute(
            select(User).where(User.email == user.email)
        )

        if existing_user.scalar_one_or_none():
            raise ConflictError("User already exists")

        otp_key = f"reg:otp:{user.email}"
        print(otp_key)
        otp = random.randint(100000, 999999)

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
        print(otp_key)
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
