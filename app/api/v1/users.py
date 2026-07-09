from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_user_from_token
from app.core.services import get_user_service
from app.schemas import ChangePasswordRequest, UserCreate, UserUpdate
from app.services import UserService

router = APIRouter(prefix="/user", tags=["User"])


@router.post("/register")
async def register_user(
    user_data: UserCreate,
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    """
    Endpoint to register a new user.
    """
    user = await user_service.register_user(user_data)
    return user


@router.get("/")
async def get_current_user(
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to get the current authenticated user's information.
    """
    user = await user_service.get_user(user["sub"])
    return user


@router.put("/")
async def update_current_user(
    user_data: UserUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to update the current authenticated user's information.
    """
    user = await user_service.update_user(user["sub"], user_data)
    return user


@router.put("/password")
async def update_password(
    password_data: ChangePasswordRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to update the current authenticated user's password.
    """
    user = await user_service.update_password(
        user["sub"],
        current_password=password_data.current_password,
        new_password=password_data.new_password,
    )
    return user


@router.delete("/")
async def delete_current_user(
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to delete the current authenticated user's account.
    """
    user = await user_service.deactivate_user(user["sub"])
    return user
