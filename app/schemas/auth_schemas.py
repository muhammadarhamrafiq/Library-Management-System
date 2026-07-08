from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="The user's email address.")
    password: str = Field(..., description="The user's password.")


class LoginResponse(BaseModel):
    access_token: str = Field(..., description="The JWT access token.")
    token_type: str = Field(
        ..., description="The type of the token, typically 'bearer'."
    )
