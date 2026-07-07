from pydantic import BaseModel, EmailStr, Field

from app.models import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: Role = Role.MEMBER


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
