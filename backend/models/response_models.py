"""
response_models.py — Pydantic models for API responses.
"""

from pydantic import BaseModel, Field


class RestaurantRecommendation(BaseModel):
    """A single restaurant recommendation returned by the system."""

    restaurant_name: str = Field(..., description="Name of the restaurant.")
    cuisine: str = Field(..., description="Cuisine(s) offered by the restaurant.")
    rating: float = Field(..., description="Aggregate rating (0.0–5.0).")
    estimated_cost: float = Field(
        ..., description="Approximate cost for two (INR)."
    )
    explanation: str = Field(
        "",
        description=(
            "AI-generated explanation for why this restaurant was recommended. "
            "Empty until Phase 3 LLM integration."
        ),
    )


class RecommendResponse(BaseModel):
    """
    Top-level response for ``POST /api/recommend``.

    Contains the ranked list of recommendations along with metadata about
    the filters that were applied and the total count of matching results.
    """

    recommendations: list[RestaurantRecommendation] = Field(
        ..., description="Ordered list of restaurant recommendations."
    )
    total_results: int = Field(
        ..., description="Number of candidate restaurants returned."
    )
    filters_applied: dict = Field(
        ..., description="Echo of the filters that were applied to the dataset."
    )
    fallback: bool = Field(
        False, description="True if LLM failed and rule-based ranking was used."
    )
