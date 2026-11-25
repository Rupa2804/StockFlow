from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    organization_name: str | None = Field(default=None, min_length=1, max_length=160)
    invitation_token: str | None = Field(default=None, min_length=32, max_length=128)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Full name cannot be blank")
        return normalized

    @field_validator("organization_name")
    @classmethod
    def normalize_organization_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Organization name cannot be blank")
        return normalized

    @model_validator(mode="after")
    def require_organization_or_invitation(self):
        if bool(self.organization_name) == bool(self.invitation_token):
            raise ValueError("Provide either an organization name or an invitation token")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class InvitationCreate(BaseModel):
    email: EmailStr


class InvitationResponse(BaseModel):
    invitation_token: str
    expires_at: datetime
