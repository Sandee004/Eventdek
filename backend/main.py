from imports import FastAPI, CORSMiddleware, os, StaticFiles, FileResponse, load_dotenv
from database import engine, AsyncSession, Base
from config import build_frontend, DIST_DIR
from contextlib import asynccontextmanager
import models
from routers import auth, events


build_frontend()
load_dotenv()

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown lifecycle:
    1. Runs database schema migrations/table creation.
    2. Registers and starts the background aggregator scheduler.
    3. Runs an immediate ingestion cycle on boot.
    4. Shuts down background workers on exit.
    """
    # 1. Ensure database tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Schedule recurring event aggregation job (every 6 hours)
    scheduler.add_job(
        run_event_aggregator_job,
        trigger="interval",
        hours=6,
        id="event_aggregation_worker",
        replace_existing=True,
    )
    scheduler.start()

    # 3. Queue an initial immediate ingestion run
    scheduler.add_job(run_event_aggregator_job, "date")

    yield

    # 4. Clean shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="EventDek API Engine",
    description="Custom FastAPI server supporting auth and event discovery.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)

# app.include_router(targets.router)


@app.get("/health")
def health_check():
    """
    Health check endpoint returning status ok.
    """
    return {"status": "ok"}



# ------------------------------
# Static Files & React Routing
# ------------------------------
# Safety check: Ensure the folder exists before mounting, or Uvicorn crashes.
assets_path = os.path.join(DIST_DIR, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
else:
    print(f"⚠️ Warning: Assets folder not found at {assets_path}. Frontend might look broken.")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    file_path = os.path.join(DIST_DIR, "favicon.ico")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Favicon not found"}

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react(full_path: str):
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "error": "Frontend build not found.", 
        "detail": "Please check console logs to see if 'npm run build' failed."
    }


# uvicorn main:app --host 0.0.0.0 --port 8000 --reload