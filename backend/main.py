# from imports import FastAPI, CORSMiddleware, os, StaticFiles, FileResponse, load_dotenv
# from database import engine, AsyncSession, Base
# from config import build_frontend, DIST_DIR
# from contextlib import asynccontextmanager
# import models
# from routers import auth, events


# build_frontend()
# load_dotenv()



# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """
#     Handles startup and shutdown lifecycle:
#     1. Runs database schema migrations/table creation.
#     2. Registers and starts the background aggregator scheduler.
#     3. Runs an immediate ingestion cycle on boot.
#     4. Shuts down background workers on exit.
#     """
#     # 1. Ensure database tables exist
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)

#     yield



# app = FastAPI(
#     title="EventDek API Engine",
#     description="Backend API for EventDek: 1-swipe RSVP event discovery deck across Nigerian hubs.",
#     version="1.0.0",
#     docs_url="/docs",      # Swagger UI URL
#     redoc_url="/redoc",    # ReDoc UI URL
#     openapi_url="/openapi.json",
#     lifespan=lifespan,
#     swagger_ui_parameters={"persistAuthorization": True},
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(auth.router)
# app.include_router(events.router)

# # app.include_router(targets.router)


# @app.get("/health")
# def health_check():
#     """
#     Health check endpoint returning status ok.
#     """
#     return {"status": "ok"}



# # ------------------------------
# # Static Files & React Routing
# # ------------------------------
# # Safety check: Ensure the folder exists before mounting, or Uvicorn crashes.
# assets_path = os.path.join(DIST_DIR, "assets")
# if os.path.exists(assets_path):
#     app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
# else:
#     print(f"⚠️ Warning: Assets folder not found at {assets_path}. Frontend might look broken.")

# @app.get("/favicon.ico", include_in_schema=False)
# async def favicon():
#     file_path = os.path.join(DIST_DIR, "favicon.ico")
#     if os.path.exists(file_path):
#         return FileResponse(file_path)
#     return {"error": "Favicon not found"}

# @app.get("/{full_path:path}", include_in_schema=False)
# async def serve_react(full_path: str):
#     index_path = os.path.join(DIST_DIR, "index.html")
#     if os.path.exists(index_path):
#         return FileResponse(index_path)
#     return {
#         "error": "Frontend build not found.", 
#         "detail": "Please check console logs to see if 'npm run build' failed."
#     }


# # uvicorn main:app --host 0.0.0.0 --port 8000 --reload


import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import DIST_DIR, build_frontend
from database import Base, engine
import models
from routers import auth, events
from services.scraper import run_event_scraper_job

load_dotenv()

# Only trigger frontend build locally if not running on Render
if os.getenv("RENDER", "false").lower() != "true":
    build_frontend()

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    1. Create database schema tables on startup.
    2. Start background event scraper worker.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    scheduler.add_job(
        run_event_scraper_job,
        trigger="interval",
        hours=6,
        id="event_scraper_worker",
        replace_existing=True,
    )
    scheduler.start()

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="EventDek API Engine",
    description="Backend API for EventDek: 1-swipe RSVP event discovery deck across Nigerian hubs.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    swagger_ui_parameters={"persistAuthorization": True},
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(events.router)


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}


# ------------------------------
# Static Files & React SPA Fallback
# ------------------------------
assets_path = os.path.join(DIST_DIR, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
else:
    print(f"⚠️ Warning: Assets folder not found at {assets_path}.")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    file_path = os.path.join(DIST_DIR, "favicon.ico")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(DIST_DIR, "index.html")) if os.path.exists(os.path.join(DIST_DIR, "index.html")) else {"error": "Favicon not found"}


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react(full_path: str):
    # Check if a static file directly matches (e.g. manifest.json, robots.txt, vite.svg)
    potential_file = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(potential_file):
        return FileResponse(potential_file)

    # Fallback to index.html for React SPA client-side routes
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    return {
        "error": "Frontend build not found.",
        "detail": "Please verify 'npm run build' generated dist/index.html before running Uvicorn.",
    }