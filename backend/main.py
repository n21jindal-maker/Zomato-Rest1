"""
main.py — FastAPI application entry point.

Initialises the app, wires middleware and routers, and preloads the dataset
on startup so the first request doesn't incur a cold-start penalty.

Run with:
    uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes.recommend import router as recommend_router
from services.data_ingestion import get_dataframe

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload the dataset into memory on startup."""
    logger.info("🚀  Starting up — preloading Zomato dataset…")
    df = get_dataframe()
    logger.info("✅  Dataset preloaded. %d restaurants available.", len(df))
    yield
    logger.info("👋  Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Restaurant Recommender",
    description=(
        "An LLM-powered restaurant recommendation API.  "
        "Filters Zomato data by location, budget, cuisine, and rating, "
        "then ranks results with Gemini AI explanations."
    ),
    version="0.2.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the frontend (and local dev tools) to access the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(recommend_router)
