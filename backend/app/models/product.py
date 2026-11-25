from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index(
            "uq_products_org_sku",
            "organization_id",
            "sku",
            unique=True,
        ),
        CheckConstraint("unit_price >= 0", name="ck_products_unit_price_nonnegative"),
        CheckConstraint(
            "cost_price IS NULL OR cost_price >= 0",
            name="ck_products_cost_price_nonnegative",
        ),
        CheckConstraint(
            "selling_price IS NULL OR selling_price >= 0",
            name="ck_products_selling_price_nonnegative",
        ),
        CheckConstraint("stock_quantity >= 0", name="ck_products_stock_nonnegative"),
        CheckConstraint(
            "low_stock_threshold IS NULL OR low_stock_threshold >= 0",
            name="ck_products_low_stock_threshold_nonnegative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    selling_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    stock_quantity: Mapped[int] = mapped_column(default=0, nullable=False)
    low_stock_threshold: Mapped[int | None] = mapped_column()
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        index=True,
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
