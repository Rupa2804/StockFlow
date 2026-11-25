from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.dashboard import router as dashboard_router
from app.api.organizations import router as organizations_router
from app.api.products import router as products_router
from app.api.settings import router as settings_router
from app.api.stock_movements import router as stock_movements_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(dashboard_router)
api_router.include_router(organizations_router)
api_router.include_router(products_router)
api_router.include_router(settings_router)
api_router.include_router(stock_movements_router)
