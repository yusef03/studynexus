from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, health, universities, study_plan, stats, me

app = FastAPI(
    title="StudyNexus API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(universities.router, prefix="/api/v1")
app.include_router(study_plan.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
