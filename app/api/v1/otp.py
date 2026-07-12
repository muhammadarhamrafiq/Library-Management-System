from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.services import get_otp_service
from app.models import User
from app.schemas import ConfirmResetRequest, ResetRequest, UserCreate, VerifyOTPRequest
from app.services import OTPService

router = APIRouter(prefix="", tags=["OTP"])


@router.post("/register/initiate")
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


@router.post("/reset-password/initiate")
async def initiate_reset_password(
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
    reset_request: ResetRequest,
):
    """
    Endpoint to initiate the password reset by request OTP
    """
    otp = await otp_service.initiate_pwreset(reset_request.email)
    return {"message": "OTP sent successfully", "otp": otp}


@router.post("/reset-password/verify")
async def verify_reset(
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
    otp_request: VerifyOTPRequest,
):
    """
    Endpoint to verify the request and OTP and give a token
    """
    token = await otp_service.verify_reset_otp(otp_request)
    return {
        "token": token,
    }


@router.post("/reset-password/confirm")
async def confirm_reset(
    otp_service: Annotated[OTPService, Depends(get_otp_service)],
    confirm_request: ConfirmResetRequest,
):
    """
    Endpoint to confirm and update the password.
    """
    user = await otp_service.reset_password(confirm_request)
    return user
