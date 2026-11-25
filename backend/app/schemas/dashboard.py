from pydantic import BaseModel


class LowStockItem(BaseModel):
    id: int
    name: str
    sku: str
    stock_quantity: int
    low_stock_threshold: int


class DashboardSummary(BaseModel):
    total_products: int
    total_quantity_on_hand: int
    low_stock_items: list[LowStockItem]
