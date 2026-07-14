from pydantic import BaseModel, EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetRequest(BaseModel):
    email: EmailStr


class ConfirmResetRequest(BaseModel):
    token: str
    new_password: str
