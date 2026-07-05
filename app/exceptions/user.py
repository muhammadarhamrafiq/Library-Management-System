from .base import AppError


class UserNotFoundError(AppError):
    """Exception raised when a user is not found in the database."""
