"""
request_models.py — Pydantic models for incoming API requests.
"""

from typing import Literal

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    """
    Request body for the ``POST /api/recommend`` endpoint.

    All filter fields are required except ``min_rating`` and
    ``additional_preferences`` which carry sensible defaults.
    """

    location: str = Field(
        ...,
        min_length=1,
        description="City or area name to filter restaurants by.",
        examples=["Delhi", "Bangalore"],
    )
    min_budget: int = Field(
        0,
        ge=0,
        description="Minimum budget (average cost for two).",
    )
    max_budget: int | None = Field(
        None,
        ge=0,
        description="Maximum budget (average cost for two). None means no upper bound.",
    )
    cuisine: str = Field(
        ...,
        min_length=1,
        description="Desired cuisine type (e.g. 'Italian', 'North Indian').",
        examples=["Italian", "Chinese"],
    )
    min_rating: float = Field(
        0.0,
        ge=0.0,
        le=5.0,
        description="Minimum aggregate rating (0.0–5.0). Defaults to 0.0 (no filter).",
    )
    additional_preferences: str = Field(
        "",
        max_length=500,
        description="Free-text additional preferences forwarded to the LLM (Phase 3).",
    )
