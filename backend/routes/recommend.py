"""
recommend.py — API routes for the restaurant recommendation system.

Endpoints
---------
POST /api/recommend   Validate input, run filter pipeline, return candidates.
GET  /api/cuisines    Deduplicated, sorted cuisine list from the dataset.
GET  /api/locations   Deduplicated, sorted location list from the dataset.
GET  /api/health      Simple liveness probe.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.request_models import RecommendRequest
from models.response_models import RecommendResponse, RestaurantRecommendation
from services.data_ingestion import get_unique_cuisines, get_unique_locations
from services.filter_service import filter_restaurants
from services.prompt_builder import build_prompt
from services.llm_service import get_recommendations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Recommendations"])


# ── Health check ──────────────────────────────────────────────────────────────

@router.get("/health", summary="Health check")
async def health_check():
    """Simple liveness probe — returns ``{"status": "ok"}``."""
    return {"status": "ok"}


# ── Metadata endpoints ────────────────────────────────────────────────────────

@router.get("/cuisines", summary="List all cuisines")
async def list_cuisines():
    """Return a deduplicated, sorted list of cuisines from the dataset."""
    cuisines = get_unique_cuisines()
    return {"cuisines": cuisines, "count": len(cuisines)}


@router.get("/locations", summary="List all locations")
async def list_locations():
    """Return a deduplicated, sorted list of locations from the dataset."""
    locations = get_unique_locations()
    return {"locations": locations, "count": len(locations)}


# ── Recommendation endpoint ──────────────────────────────────────────────────

@router.post(
    "/recommend",
    response_model=RecommendResponse,
    summary="Get restaurant recommendations",
)
async def recommend(request: RecommendRequest):
    """
    Accept user preferences, filter the dataset, and return ranked
    restaurant recommendations.

    In Phase 2, results are ranked by aggregate rating.  Phase 3 will
    wire in the LLM for AI-powered ranking and explanations.
    """
    logger.info(
        "Recommendation request — location=%s, min_budget=%s, max_budget=%s, cuisine=%s, "
        "min_rating=%s",
        request.location, request.min_budget, request.max_budget, request.cuisine, request.min_rating,
    )

    # ── Run filter pipeline ───────────────────────────────────────────────
    candidates_df = filter_restaurants(
        location=request.location,
        min_budget=request.min_budget,
        max_budget=request.max_budget,
        cuisine=request.cuisine,
        min_rating=request.min_rating,
    )

    if candidates_df.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No restaurants found matching your criteria: "
                f"location='{request.location}', min_budget='{request.min_budget}', "
                f"max_budget='{request.max_budget}', "
                f"cuisine='{request.cuisine}', min_rating={request.min_rating}. "
                f"Try broadening your filters."
            ),
        )

    # ── Build response ────────────────────────────────────────────────────
    candidates_list = candidates_df.to_dict(orient="records")
    
    prompt = build_prompt(
        location=request.location,
        min_budget=request.min_budget,
        max_budget=request.max_budget,
        cuisine=request.cuisine,
        min_rating=request.min_rating,
        additional_preferences=request.additional_preferences,
        candidates=candidates_list,
    )
    
    recommendations, fallback_used = get_recommendations(prompt, candidates_list)

    filters_applied = {
        "location": request.location,
        "min_budget": request.min_budget,
        "max_budget": request.max_budget,
        "cuisine": request.cuisine,
        "min_rating": request.min_rating,
        "additional_preferences": request.additional_preferences,
    }

    return RecommendResponse(
        recommendations=recommendations,
        total_results=len(recommendations),
        filters_applied=filters_applied,
        fallback=fallback_used,
    )
