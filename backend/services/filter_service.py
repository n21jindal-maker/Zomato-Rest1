"""
filter_service.py — Sequential AND-filter pipeline with progressive relaxation.

Filtering order:
  1. Location  (case-insensitive substring match)
  2. Budget    (tier → cost range)
  3. Cuisine   (case-insensitive substring match on the restaurant's cuisine list)
  4. Rating    (aggregate_rating >= min_rating)

If the filtered set has fewer than ``MIN_RESULTS`` restaurants, the pipeline
progressively relaxes filters in this order:  budget → cuisine → rating,
until enough candidates are found or all relaxations are exhausted.

Results are sorted by ``aggregate_rating`` descending and capped at
``MAX_RESULTS``.
"""

import logging
from typing import Literal

import pandas as pd

from config import settings
from services.data_ingestion import get_dataframe

logger = logging.getLogger(__name__)

# ── Tuneable constants ────────────────────────────────────────────────────────
MIN_RESULTS = 3      # minimum before relaxation kicks in
MAX_RESULTS = 15     # return at most this many candidates


def filter_restaurants(
    location: str,
    min_budget: int,
    max_budget: int | None,
    cuisine: str | None,
    min_rating: float = 0.0,
) -> pd.DataFrame:
    """
    Apply sequential filters to the dataset and return top candidates.

    If strict filtering yields fewer than ``MIN_RESULTS`` restaurants, the
    pipeline relaxes filters in order: **budget → cuisine → rating**.

    Parameters
    ----------
    location : str
        City / area name (case-insensitive substring match).
    min_budget : int
        Minimum budget.
    max_budget : int | None
        Maximum budget. None means no upper bound.
    cuisine : str | None
        Desired cuisine (case-insensitive substring match). 'any' is treated as None.
    min_rating : float
        Minimum aggregate rating (0.0–5.0).

    Returns
    -------
    pd.DataFrame
        Filtered, sorted (rating desc), and capped DataFrame.
    """
    df = get_dataframe()

    if cuisine and cuisine.lower() == "any":
        cuisine = None

    # ── 1. Location (always enforced — never relaxed) ─────────────────────
    df = _filter_by_location(df, location)
    if df.empty:
        logger.warning("No restaurants found in location '%s'.", location)
        return df.head(0)  # empty frame with correct columns

    # ── 2–4. Strict pass ──────────────────────────────────────────────────
    result = _apply_filters(df, min_budget=min_budget, max_budget=max_budget, cuisine=cuisine, min_rating=min_rating)

    # ── Progressive relaxation ────────────────────────────────────────────
    # If the filtered set has fewer than ``MIN_RESULTS`` restaurants, the pipeline
    # progressively relaxes filters in this order:  budget → cuisine → rating,
    # until enough candidates are found or all relaxations are exhausted.
    relaxation_steps: list[dict] = [
        {"min_budget": None, "max_budget": None, "cuisine": cuisine, "min_rating": min_rating},
        {"min_budget": None, "max_budget": None, "cuisine": None, "min_rating": min_rating},
        {"min_budget": None, "max_budget": None, "cuisine": None, "min_rating": 0.0},
    ]

    step_labels = ["budget", "cuisine", "rating"]

    for step, params in zip(step_labels, relaxation_steps):
        if len(result) >= MIN_RESULTS:
            break
        logger.info(
            "Only %d result(s) — relaxing '%s' filter.",
            len(result), step,
        )
        result = _apply_filters(df, **params)

    # ── Sort & cap ────────────────────────────────────────────────────────
    result = result.sort_values("aggregate_rating", ascending=False).head(MAX_RESULTS)
    logger.info("Returning %d candidate(s) for query.", len(result))
    return result


# ── Individual filter helpers ────────────────────────────────────────────────

def _filter_by_location(df: pd.DataFrame, location: str) -> pd.DataFrame:
    """Case-insensitive substring match on the ``location`` column."""
    mask = df["location"].str.contains(location, case=False, na=False)
    return df[mask]


def _filter_by_budget(df: pd.DataFrame, min_budget: int, max_budget: int | None) -> pd.DataFrame:
    """Map budget tier to cost range and filter ``average_cost_for_two``."""
    mask = df["average_cost_for_two"] >= min_budget
    if max_budget is not None:
        mask = mask & (df["average_cost_for_two"] <= max_budget)
    return df[mask]


def _filter_by_cuisine(df: pd.DataFrame, cuisine: str) -> pd.DataFrame:
    """Case-insensitive substring match on the ``cuisines`` column."""
    mask = df["cuisines"].str.contains(cuisine, case=False, na=False)
    return df[mask]


def _filter_by_rating(df: pd.DataFrame, min_rating: float) -> pd.DataFrame:
    """Keep restaurants with ``aggregate_rating >= min_rating``."""
    return df[df["aggregate_rating"] >= min_rating]


def _apply_filters(
    df: pd.DataFrame,
    *,
    min_budget: int | None = None,
    max_budget: int | None = None,
    cuisine: str | None = None,
    min_rating: float = 0.0,
) -> pd.DataFrame:
    """
    Apply budget, cuisine, and rating filters to an already location-filtered
    DataFrame.  Passing ``None`` for budget or cuisine skips that filter.
    """
    if min_budget is not None or max_budget is not None:
        min_b = min_budget if min_budget is not None else 0
        df = _filter_by_budget(df, min_b, max_budget)
    if cuisine is not None:
        df = _filter_by_cuisine(df, cuisine)
    if min_rating > 0.0:
        df = _filter_by_rating(df, min_rating)
    return df
