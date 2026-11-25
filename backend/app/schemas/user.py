from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    organization_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
