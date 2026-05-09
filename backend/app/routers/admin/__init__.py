from fastapi import APIRouter
from app.routers.admin import auth as admin_auth
from app.routers.admin import users as admin_users

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(admin_auth.router)
router.include_router(admin_users.router)
