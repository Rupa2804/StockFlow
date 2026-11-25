from pydantic import BaseModel, ConfigDict, Field


class OrganizationSettingsUpdate(BaseModel):
    default_low_stock_threshold: int = Field(ge=0)


class OrganizationSettingsRead(BaseModel):
    id: int
    name: str
    default_low_stock_threshold: int

    model_config = ConfigDict(from_attributes=True)
