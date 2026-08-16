# backend/config.py
import os
import subprocess
from dotenv import load_dotenv

load_dotenv()


# ------------------------------
# Frontend build configuration
# ------------------------------

BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")
SRC_DIR = os.path.join(FRONTEND_DIR, "src")
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")


def latest_modified_time(path: str) -> float:
    """Recursively find the latest modification time in a directory."""
    latest_time = 0.0
    for root, _, files in os.walk(path):
        for f in files:
            try:
                latest_time = max(latest_time, os.path.getmtime(os.path.join(root, f)))
            except FileNotFoundError:
                continue
    return latest_time


def frontend_needs_rebuild() -> bool:
    """Return True if src files are newer than dist files or dist is missing."""
    if not os.path.exists(DIST_DIR) or not os.listdir(DIST_DIR):
        return True  # dist missing or empty

    src_time = latest_modified_time(SRC_DIR)
    dist_time = latest_modified_time(DIST_DIR)
    return src_time > dist_time


def build_frontend():
    """Build frontend if it’s outdated."""
    try:
        if frontend_needs_rebuild():
            print("⚙️  Detected frontend changes — rebuilding...")
            subprocess.run("npm run build", cwd=FRONTEND_DIR, shell=True, check=True)
            print("✅ Frontend rebuilt successfully.")
        else:
            print("✅ Frontend is up to date.")
    except subprocess.CalledProcessError as e:
        print("❌ Frontend build failed:", e)


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "hii")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

### To run: uvicorn main:app --host 0.0.0.0 --port 8080 --reload