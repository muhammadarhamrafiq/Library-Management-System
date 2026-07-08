from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

from app.core.settings import settings
from app.exceptions import AuthenticationError, ForbiddenError

password_hasher = PasswordHash.recommended()
auth_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login/form")


def hash_password(password: str) -> str:
    """
    Hashes a password using the PasswordHasher from pwdlib.

    Arguments:
        password (str): The plain text password to be hashed.

    Returns:
        str: The hashed password.
    """
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a password against a hashed password.

    Arguments:
        password (str): The plain text password to verify.
        hashed_password (str): The hashed password to compare against.

    Returns:
        bool: True if the password matches the hashed password, False otherwise.
    """
    return password_hasher.verify(password, hashed_password)


def generate_access_token(user_id: str, role: str) -> str:
    """
    Generates an access token for a user.

    Arguments:
        user_id (str): The unique identifier of the user.
        role (str): The role of the user.

    Returns:
        str: The generated access token.

    Raises:
        jwt.PyJWTError: If there is an error encoding the tokens.
    """
    access_token_payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(UTC) + timedelta(hours=1),
    }

    access_token = jwt.encode(
        payload=access_token_payload, key=settings.jwt_secret, algorithm="HS256"
    )

    return access_token


def get_user_from_token(token: Annotated[str, Depends(auth_scheme)]) -> dict:
    """
    Decode a JWT token and return the user
    information contained within it.

    Arguments:
        token (str): Dependency-injected JWT token from the request header.

    Returns:
        dict: A dictionary containing the user information extracted from the token.

    Raises:
        jwt.PyJWTError: If there is an error decoding the token.
    """
    try:
        payload = jwt.decode(jwt=token, key=settings.jwt_secret, algorithms=["HS256"])

        return payload

    except jwt.ExpiredSignatureError as e:
        raise AuthenticationError("Token has expired") from e

    except jwt.InvalidTokenError as e:
        raise AuthenticationError("Invalid token") from e


def require_role(required_role: str):
    """
    Dependency function to enforce role-based access control.

    Arguments:
        required_role (str): The role required to access the endpoint.

    Returns:
        function: A dependency function that checks the user's role.
    """

    def role_checker(user: Annotated[dict, Depends(get_user_from_token)]) -> dict:
        user_role = user.get("role")
        if user_role != required_role:
            raise ForbiddenError("You do not have permission to access this resource.")
        return user

    return role_checker
