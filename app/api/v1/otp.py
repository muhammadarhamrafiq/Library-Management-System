from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.services import get_otp_service
from app.models import User
from app.schemas import UserCreate, VerifyOTPRequest
from app.services import OTPService

router = APIRouter(prefix="", tags=["OTP"])


@router.post("/registerd/initiate")
async def send_otp(
    otp_service: Annotated[OTPService, Depends(get_otp_service)], user: UserCreate
):
    """
    Endpoint to send an OTP (One-Time Password) for user registration.
    """
    otp = await otp_service.initiate_register(user)
    return {"message": "OTP sent successfully", "otp": otp}


@router.post("/register/verify", status_code=201)
async def register_user(
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
    otp_request: VerifyOTPRequest,
):
    """
    Endpoint to register a new user after verifying the OTP.
    """
    user: User = await otp_service.verify_register(otp_request)
    return user
