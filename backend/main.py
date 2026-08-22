from imports import FastAPI, CORSMiddleware, os, StaticFiles, FileResponse, load_dotenv
from core.database import engine, AsyncSession, Base
from config import build_frontend, DIST_DIR
from contextlib import asynccontextmanager
import models
from routers import auth


build_frontend()
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application lifecycle events. Executes table creation queries 
    safely using the async connection pool before the server begins listening.
    """
    # Create tables asynchronously if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield

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