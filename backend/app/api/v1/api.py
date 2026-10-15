from fastapi import APIRouter
from app.api.v1.endpoints import health, categories, products, cart, auth, orders, admin, newsletter

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(orders.payment_router)
api_router.include_router(admin.router)
api_router.include_router(newsletter.router)

