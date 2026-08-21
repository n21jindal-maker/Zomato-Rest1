"""
llm_service.py — Handles interaction with the LLM (Gemini).
"""

import json
import logging
import time
from typing import Optional

import google.generativeai as genai
from pydantic import ValidationError

from config import settings
from models.response_models import RestaurantRecommendation

logger = logging.getLogger(__name__)

# Initialize the Gemini API client
try:
    genai.configure(api_key=settings.gemini_api_key)
except Exception as e:
    logger.warning("Failed to configure Gemini API: %s", e)


def get_recommendations(
    prompt: str, candidates: list[dict]
) -> tuple[list[RestaurantRecommendation], bool]:
    """
    Send prompt to Gemini to get ranked recommendations.
    Returns a tuple of (recommendations, fallback_used).
    """
    model = genai.GenerativeModel("gemini-3.1-pro-preview")
    
    retries = 3
    delay = 1.0

    for attempt in range(1, retries + 1):
        try:
            logger.info("Calling Gemini API (Attempt %d/%d)", attempt, retries)
            start_time = time.time()
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                ),
            )
            
            elapsed = time.time() - start_time
            logger.info("Gemini API call completed in %.2fs", elapsed)
            
            raw_text = response.text
            
            # Try to parse the JSON
            parsed_json = json.loads(raw_text)
            
            if not isinstance(parsed_json, list):
                raise ValueError("Expected a JSON array of objects.")
                
            recommendations = []
            for item in parsed_json:
                recommendations.append(RestaurantRecommendation(**item))
                
            if recommendations:
                return recommendations, False
            else:
                raise ValueError("Empty recommendations array returned.")

        except (json.JSONDecodeError, ValueError, ValidationError) as e:
            logger.error("Failed to parse or validate LLM response: %s", e)
            if attempt < retries:
                time.sleep(delay)
                delay *= 2
            else:
                logger.error("Max retries reached for LLM parsing errors.")

        except Exception as e:
            logger.error("LLM API call failed: %s", e)
            if attempt < retries:
                time.sleep(delay)
                delay *= 2
            else:
                logger.error("Max retries reached for LLM API errors.")
                
    # Fallback path
    logger.warning("Falling back to rule-based ranking.")
    fallback_recommendations = []
    
    # Candidates are already sorted by aggregate_rating in the filter service
    top_candidates = candidates[:5]
    
    for candidate in top_candidates:
        fallback_recommendations.append(
            RestaurantRecommendation(
                restaurant_name=candidate.get("restaurant_name", "Unknown"),
                cuisine=candidate.get("cuisines", "Unknown"),
                rating=float(candidate.get("aggregate_rating", 0.0)),
                estimated_cost=float(candidate.get("average_cost_for_two", 0.0)),
                explanation="",
            )
        )
        
    return fallback_recommendations, True
