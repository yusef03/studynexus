from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    preferred_language: str = "de"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    matrikelnummer: Optional[str] = None
    birth_date: Optional[datetime] = None
    university: Optional[str] = None
    profile_picture_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UserCreate(UserBase):
    full_name: str
    password: str
    matrikelnummer: str
    birth_date: datetime
    university: str

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
    matrikelnummer: Optional[str] = None
    birth_date: Optional[datetime] = None
    university: Optional[str] = None
    profile_picture_url: Optional[str] = None
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
