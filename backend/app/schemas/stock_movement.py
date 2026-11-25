from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StockMovementCreate(BaseModel):
    movement_type: Literal["in", "out"]
    quantity: int = Field(gt=0)
    note: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(str_strip_whitespace=True)


class StockMovementRead(BaseModel):
    id: int
    product_id: int
    user_id: int
    movement_type: Literal["in", "out"]
    quantity: int
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
