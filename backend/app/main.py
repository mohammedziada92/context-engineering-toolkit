from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.routes.analytics import router as analytics_router
from app.api.routes.billing import router as billing_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.knowledge import router as knowledge_router
from app.api.routes.pipelines import router as pipelines_router
from app.api.routes.playground import router as playground_router
from app.api.routes.settings import router as settings_router
from app.core.config import settings
from app.middleware.ratelimit import limiter

app = FastAPI(
    title="Context Engineering Toolkit",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

_origins = (
    ["*"] if settings.ENVIRONMENT == "development"
    else [settings.FRONTEND_URL]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.include_router(health_router)
app.include_router(knowledge_router)
app.include_router(pipelines_router)
app.include_router(playground_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(settings_router)
app.include_router(billing_router)
