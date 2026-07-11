from .base import AppError


class AuthenticationError(AppError):
    """
    Base class for authentication-related exceptions.
    """

    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=401, detail=detail)


class InvalidCredentialsError(AuthenticationError):
    """
    Raised when the provided credentials are invalid.
    """

    def __init__(self, detail: str = "Invalid username or password"):
        super().__init__(detail=detail)


class InactiveUserError(AuthenticationError):
    """
    Raised when the user account is inactive.
    """

    def __init__(self, detail: str = "User account is inactive"):
        super().__init__(detail=detail)
