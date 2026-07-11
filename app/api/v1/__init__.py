from .auth import router as auth_router
from .books import router as books_router
from .loans import router as loans_router
from .users import router as users_router

__all__ = ["auth_router", "books_router", "loans_router", "users_router"]
