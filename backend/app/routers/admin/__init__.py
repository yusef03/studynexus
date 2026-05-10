from fastapi import APIRouter
from app.routers.admin import auth as admin_auth
from app.routers.admin import users as admin_users
from app.routers.admin import universities as admin_universities
from app.routers.admin import faculties as admin_faculties
from app.routers.admin import programs as admin_programs
from app.routers.admin import exam_regulations as admin_exam_regulations
from app.routers.admin import modules as admin_modules
from app.routers.admin import prerequisites as admin_prerequisites
from app.routers.admin import analytics as admin_analytics
from app.routers.admin import system as admin_system
from app.routers.admin import audit_log as admin_audit_log

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(admin_auth.router)
router.include_router(admin_users.router)
router.include_router(admin_universities.router)
router.include_router(admin_faculties.router)
router.include_router(admin_programs.router)
router.include_router(admin_exam_regulations.router)
router.include_router(admin_modules.router)
router.include_router(admin_prerequisites.router)
router.include_router(admin_analytics.router)
router.include_router(admin_system.router)
router.include_router(admin_audit_log.router)
