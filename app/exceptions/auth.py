from .base import AppError


class AuthenticationError(AppError):
    """
    Base class for authentication-related exceptions.
    """


class InvalidCredentialsError(AuthenticationError):
    """
    Raised when the provided credentials are invalid.
    """


class InactiveUserError(AuthenticationError):
    """
    Raised when the user account is inactive.
    """
