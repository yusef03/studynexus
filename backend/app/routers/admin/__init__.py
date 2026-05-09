from fastapi import APIRouter
from app.routers.admin import auth as admin_auth

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(admin_auth.router)
