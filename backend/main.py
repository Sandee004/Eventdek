import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import DIST_DIR, build_frontend
from database import Base, engine
import models
from routers import auth, events
from services.scraper import run_event_scraper_job

load_dotenv()

if os.getenv("RENDER", "false").lower() != "true":
    build_frontend()

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
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

from monitoring.metrics import EVENTS_INGESTED, SCRAPE_RUNS

@app.get("/trigger-test-metric", tags=["system"])
async def trigger_test():
    # 1. Fire sample data into the live server memory
    EVENTS_INGESTED.labels(source_platform="eventbrite", state_id="lagos").inc(12)
    SCRAPE_RUNS.labels(source_platform="eventbrite", status="success").inc()
    return {"status": "metrics updated in uvicorn process"}

@app.post("/trigger-scraper", tags=["system"])
async def trigger_full_scrape():
    # 2. Or run the actual full scraper inside Uvicorn
    import asyncio
    asyncio.create_task(run_event_scraper_job())
    return {"status": "scraper started in background"}

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}


# Explicit Prometheus Exporter Endpoint (Prioritized over SPA fallback)
@app.get("/metrics", tags=["system"])
def get_prometheus_metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ------------------------------
# Static Files & React SPA Fallback (Must remain at bottom)
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
    return (
        FileResponse(os.path.join(DIST_DIR, "index.html"))
        if os.path.exists(os.path.join(DIST_DIR, "index.html"))
        else {"error": "Favicon not found"}
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react(full_path: str):
    potential_file = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(potential_file):
        return FileResponse(potential_file)

    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    return {
        "error": "Frontend build not found.",
        "detail": "Please verify 'npm run build' generated dist/index.html before running Uvicorn.",
    }

# uvicorn main:app --host 0.0.0.0 --port 8000 --reload