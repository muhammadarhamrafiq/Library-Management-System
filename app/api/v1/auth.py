from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import generate_access_token, get_user_from_token
from app.core.services import get_auth_service
from app.models import User
from app.schemas import LoginRequest, LoginResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login/form", include_in_schema=False)
async def login_form(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """
    Login endpoint for user authentication.
    username(email) and password are provided in the form data.
    """

    user: User = await auth_service.authenticate_user(
        email=form_data.username,
        password=form_data.password,
    )

    access_token = generate_access_token(user_id=str(user.id), role=user.role)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    """
    Login endpoint for user authentication.
    email and password are provided in the request body.
    """

    user: User = await auth_service.authenticate_user(
        email=login_data.email,
        password=login_data.password,
    )

    access_token = generate_access_token(user_id=str(user.id), role=user.role)

    return LoginResponse(access_token=access_token, token_type="bearer")


@router.post("/me")
async def get_current_user(user: Annotated[dict, Depends(get_user_from_token)]):
    """
    Endpoint to get the current authenticated user's information.
    """
    return {"user": user}
