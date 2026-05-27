import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .auth import router as auth_router
from .config import load_settings
from .db import reset_database

log = logging.getLogger("prelegal")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = app.state.settings
    reset_database(settings.db_path)
    log.info("Initialized fresh SQLite at %s", settings.db_path)
    yield


def create_app() -> FastAPI:
    settings = load_settings()
    app = FastAPI(title="Prelegal", lifespan=lifespan)
    app.state.settings = settings

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok"}

    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

    if settings.static_dir and Path(settings.static_dir).is_dir():
        app.mount(
            "/",
            StaticFiles(directory=settings.static_dir, html=True),
            name="static",
        )
    else:
        log.info("No static directory mounted (PRELEGAL_STATIC_DIR not set)")

    return app
