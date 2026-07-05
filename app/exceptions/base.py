class AppError(Exception):
    """
    Base class for all application-specific exceptions.
    """

    pass


class NotFoundError(AppError):
    """
    Exception raised when a requested resource is not found.
    """

    pass


class ConflictError(AppError):
    """
    Exception raised when there is a conflict with the current state of the resource.
    """

    pass


class BadRequestError(AppError):
    """
    Exception raised when the request is malformed or contains invalid data.
    """

    pass


class ForbiddenError(AppError):
    """
    Exception raised when a user attempts to access a resource or perform an action
    they are not authorized to perform.
    """

    pass


class ValidationError(AppError):
    """
    Exception raised when data validation fails.
    """

    pass
