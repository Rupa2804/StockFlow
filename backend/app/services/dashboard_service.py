from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.product import Product
from app.schemas.dashboard import DashboardSummary, LowStockItem


def get_dashboard_summary(db: Session, organization_id: int) -> DashboardSummary:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise LookupError("Organization not found")

    total_products = db.scalar(
        select(func.count(Product.id)).where(
            Product.organization_id == organization_id
        )
    )
    total_quantity = db.scalar(
        select(func.coalesce(func.sum(Product.stock_quantity), 0)).where(
            Product.organization_id == organization_id
        )
    )
    effective_threshold = func.coalesce(
        Product.low_stock_threshold,
        organization.default_low_stock_threshold,
    )
    low_stock_rows = db.execute(
        select(
            Product.id,
            Product.name,
            Product.sku,
            Product.stock_quantity,
            effective_threshold.label("low_stock_threshold"),
        )
        .where(
            Product.organization_id == organization_id,
            Product.stock_quantity <= effective_threshold,
        )
        .order_by(Product.stock_quantity, Product.name)
    ).all()

    return DashboardSummary(
        total_products=total_products or 0,
        total_quantity_on_hand=total_quantity or 0,
        low_stock_items=[
            LowStockItem(
                id=row.id,
                name=row.name,
                sku=row.sku,
                stock_quantity=row.stock_quantity,
                low_stock_threshold=row.low_stock_threshold,
            )
            for row in low_stock_rows
        ],
    )
