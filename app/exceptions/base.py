from fastapi.exceptions import HTTPException


class AppError(HTTPException):
    """
    Base class for all application-specific exceptions.
    """

    def __init__(
        self, status_code: int = 500, detail: str = "An unexpected error occurred"
    ):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppError):
    """
    Exception raised when a requested resource is not found.
    """

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)


class ConflictError(AppError):
    """
    Exception raised when there is a conflict with the current state of the resource.
    """

    def __init__(self, detail: str = "Conflict with the current state of the resource"):
        super().__init__(status_code=409, detail=detail)


class BadRequestError(AppError):
    """
    Exception raised when the request is malformed or contains invalid data.
    """

    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=400, detail=detail)


class ForbiddenError(AppError):
    """
    Exception raised when a user attempts to access a resource or perform an action
    they are not authorized to perform.
    """

    def __init__(
        self, detail: str = "You do not have permission to access this resource"
    ):
        super().__init__(status_code=403, detail=detail)


class ValidationError(AppError):
    """
    Exception raised when data validation fails.
    """

    def __init__(self, detail: str = "Data validation failed"):
        super().__init__(status_code=422, detail=detail)
