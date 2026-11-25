from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(str_strip_whitespace=True)


class CategoryRead(BaseModel):
    id: int
    name: str
    description: str | None
    organization_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
