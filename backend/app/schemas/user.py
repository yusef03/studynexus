from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    preferred_language: str = "de"


class UserCreate(UserBase):
    password: str

    @field_validator("email")
    @classmethod
    def validate_hsh_domain(cls, v: str) -> str:
        if not str(v).endswith("@stud.hs-hannover.de"):
            raise ValueError("Registrierung nur mit @stud.hs-hannover.de E-Mail möglich.")
        return v


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_premium: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
