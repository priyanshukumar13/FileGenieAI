from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import cors_origins_list, get_settings
from routes.ai_routes import router as ai_router
from routes.download_routes import router as download_router
from routes.security_routes import router as security_router
from routes.contact_routes import router as contact_router
from routes.upload_routes import router as upload_router
from routes.tools_routes import router as tools_router
from routes.auth_routes import router as auth_router
from utils.temp_storage import cleanup_old_downloads
from utils.database import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    async def _periodic() -> None:
        while True:
            await asyncio.sleep(600)
            await cleanup_old_downloads()

    task = asyncio.create_task(_periodic())
    await connect_to_mongo()
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await close_mongo_connection()


app = FastAPI(title="AI PDF Toolkit", version="1.0.0", lifespan=lifespan)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contact_router)
app.include_router(upload_router)
app.include_router(ai_router)
app.include_router(tools_router)
app.include_router(download_router)
app.include_router(security_router)
app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok", "max_upload_mb": settings.max_upload_mb}
