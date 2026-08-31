# import os
# from pathlib import Path
# from dotenv import load_dotenv
# from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
# from sqlalchemy.orm import declarative_base

# # Load .env directly from the backend folder where database.py lives
# BACKEND_DIR = Path(__file__).resolve().parent
# load_dotenv(BACKEND_DIR / ".env")

# # Also fallback to default load_dotenv just in case
# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")

# if not DATABASE_URL:
#     raise ValueError("❌ DATABASE_URL not found in .env file")

# if "supabase" in DATABASE_URL or "postgresql" in DATABASE_URL:
#     print("🔌 [DATABASE] Connected to Remote Supabase PostgreSQL.")
# else:
#     print("📁 [DATABASE] Connected to Local SQLite fallback.")

# engine = create_async_engine(DATABASE_URL, echo=False)
# AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
# Base = declarative_base()


# async def get_db():
#     async with AsyncSessionLocal() as session:
#         yield session


import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

# Ensure .env is loaded
BACKEND_DIR = Path(__file__).resolve().parent
if (BACKEND_DIR / ".env").exists():
    load_dotenv(BACKEND_DIR / ".env")
else:
    load_dotenv(BACKEND_DIR.parent / ".env")
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in environment")

# Configuration arguments for Supabase Transaction Pooler (Port 6543 / PgBouncer)
connect_args = {}
if "postgresql" in DATABASE_URL or "supabase" in DATABASE_URL:
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,  # Automatically verifies connections before executing queries
)

AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session