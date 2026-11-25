from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    unit_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    cost_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    selling_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    category_id: int | None = None

    model_config = ConfigDict(str_strip_whitespace=True)


class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    unit_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    cost_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    selling_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    stock_quantity: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    category_id: int | None = None
    is_active: bool | None = None

    model_config = ConfigDict(str_strip_whitespace=True)

    @field_validator("sku", "name", "stock_quantity")
    @classmethod
    def reject_null_for_required_fields(
        cls,
        value: str | int | None,
    ) -> str | int:
        if value is None:
            raise ValueError("This field cannot be null")
        return value


class ProductRead(BaseModel):
    id: int
    sku: str
    name: str
    description: str | None
    unit_price: Decimal | None
    cost_price: Decimal | None
    selling_price: Decimal | None
    stock_quantity: int
    low_stock_threshold: int | None
    is_active: bool
    category_id: int | None
    organization_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
