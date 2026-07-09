from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
