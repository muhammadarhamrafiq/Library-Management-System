from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_user_from_token, require_role
from app.core.services import get_user_service
from app.models import Role
from app.schemas import ChangePasswordRequest, ChangeRoleRequest, UserCreate, UserUpdate
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


@router.get("")
async def get_all_users(
    user_service: Annotated[UserService, Depends(get_user_service)],
    _: Annotated[dict, Depends(require_role(Role.ADMIN.value))],
    search_query: str | None = None,
    full_name: str | None = None,
    email: str | None = None,
    role: Role | None = None,
    is_active: bool | None = None,
    sortBy: str | None = None,
    sortOrder: str = "asc",
    skip: int = 0,
    limit: int = 10,
):
    """
    Endpoint to get a list of all users.
    Requires admin role.
    """
    users = await user_service.list_users(
        search_query=search_query,
        full_name=full_name,
        email=email,
        role=role,
        is_active=is_active,
        sortBy=sortBy,
        sortOrder=sortOrder,
        skip=skip,
        limit=limit,
    )
    return users


@router.get("/me")
async def get_current_user(
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to get the current authenticated user's information.
    """
    current_user = await user_service.get_user(user["sub"])
    return current_user


@router.get("/{user_id}")
async def get_user_by_id(
    user_id: int,
    user_service: Annotated[UserService, Depends(get_user_service)],
    _: Annotated[dict, Depends(require_role(Role.ADMIN.value))],
    include_inactive: bool = False,
):
    """
    Endpoint to get a user's information by ID.
    Requires admin role.
    """
    user = await user_service.get_user(user_id, include_inactive=include_inactive)
    return user


@router.put("")
async def update_current_user(
    user_data: UserUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to update the current authenticated user's information.
    """
    updated_user = await user_service.update_user(user["sub"], user_data)
    return updated_user


@router.put("/password")
async def update_password(
    password_data: ChangePasswordRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to update the current authenticated user's password.
    """
    updated_user = await user_service.update_password(
        user["sub"],
        current_password=password_data.current_password,
        new_password=password_data.new_password,
    )
    return updated_user


@router.delete("")
async def deactivate_current_user(
    user_service: Annotated[UserService, Depends(get_user_service)],
    user: Annotated[dict, Depends(get_user_from_token)],
):
    """
    Endpoint to deactivate the current authenticated user's account.
    """
    deactivated_user = await user_service.deactivate_user(user["sub"])
    return deactivated_user


@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    user_service: Annotated[UserService, Depends(get_user_service)],
    _: Annotated[dict, Depends(require_role(Role.ADMIN.value))],
):
    """
    Endpoint to deactivate a user's account by ID.
    Requires admin role.
    """
    deactivated_user = await user_service.deactivate_user(user_id)
    return deactivated_user


@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    user_service: Annotated[UserService, Depends(get_user_service)],
    _: Annotated[dict, Depends(require_role(Role.ADMIN.value))],
):
    """
    Endpoint to activate a user's account by ID.
    Requires admin role.
    """
    activated_user = await user_service.activate_user(user_id)
    return activated_user


@router.put("/{user_id}/role")
async def change_role(
    user_id: int,
    role_data: ChangeRoleRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
    _: Annotated[dict, Depends(require_role(Role.ADMIN.value))],
):
    """
    Endpoint to change a user's role by ID.
    Requires admin role.
    """
    updated_user = await user_service.change_role(user_id, role_data.role)
    return updated_user
