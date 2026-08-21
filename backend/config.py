"""
config.py — Central application settings loaded from the .env file.

All configuration is accessed via the `settings` singleton object.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


# Resolve the backend/ directory so we can locate .env reliably
BACKEND_DIR = Path(__file__).parent


class Settings(BaseSettings):
    """
    Application settings populated from environment variables / .env file.

    Budget tier cost ranges (INR, average cost for two):
      low    : <= 500
      medium : 501 – 1500
      high   : > 1500
    """

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── LLM ──────────────────────────────────────────────────────────────
    gemini_api_key: str = Field(..., description="Google Gemini API key")
    llm_provider: str = Field("gemini", description="LLM provider: 'gemini'")

    # ── CORS ──────────────────────────────────────────────────────────────
    allowed_origins: str = Field(
        "*", description="Comma-separated list of allowed CORS origins"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Logging ───────────────────────────────────────────────────────────
    log_level: str = Field("INFO", description="Python logging level")

    # ── Dataset ───────────────────────────────────────────────────────────
    dataset_cache_path: str = Field(
        "data/zomato_processed.csv",
        description="Path to the locally cached processed dataset (relative to backend/)",
    )
    hf_dataset_id: str = Field(
        "ManikaSaini/zomato-restaurant-recommendation",
        description="Hugging Face dataset identifier",
    )

    # ── Budget tiers  ─────────────────────────────────────────────────────
    # Maps user-supplied budget label → (min_cost, max_cost) in INR.
    # max_cost of None means "no upper bound".
    @property
    def budget_tiers(self) -> dict[str, tuple[int, int | None]]:
        return {
            "low":    (0,    500),
            "medium": (501,  1500),
            "high":   (1501, None),
        }


# ── Singleton ─────────────────────────────────────────────────────────────────
settings = Settings()
