"""
data_ingestion.py — Dataset loading, cleaning, and in-memory caching.

Flow:
  1. If a local CSV cache exists → load from CSV (fast).
  2. Otherwise → download from Hugging Face, clean, persist to CSV, return DataFrame.

All downstream services access the dataset through `get_dataframe()` which
returns a module-level singleton, so the dataset is only processed once per
application run.
"""

import logging
import re
from pathlib import Path

import pandas as pd

from config import settings

logger = logging.getLogger(__name__)

# ── Module-level singleton ────────────────────────────────────────────────────
_df: pd.DataFrame | None = None

# Absolute path to the CSV cache, resolved relative to this file's directory
_CACHE_PATH = Path(__file__).parent.parent / settings.dataset_cache_path


# ── Public API ────────────────────────────────────────────────────────────────

def get_dataframe() -> pd.DataFrame:
    """
    Return the preprocessed Zomato DataFrame.

    The DataFrame is loaded once and cached in memory.  Subsequent calls
    return the already-loaded DataFrame immediately.
    """
    global _df
    if _df is None:
        _df = _load_dataset()
    return _df


def get_unique_locations() -> list[str]:
    """Return a sorted list of all distinct location values."""
    df = get_dataframe()
    return sorted(df["location"].dropna().unique().tolist())


def get_unique_cuisines() -> list[str]:
    """Return a sorted, deduplicated list of all cuisine types in the dataset."""
    df = get_dataframe()
    # Each row may contain multiple cuisines as a comma-separated string
    all_cuisines: set[str] = set()
    for entry in df["cuisines"].dropna():
        for cuisine in str(entry).split(","):
            cleaned = cuisine.strip().title()
            if cleaned:
                all_cuisines.add(cleaned)
    return sorted(all_cuisines)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _load_dataset() -> pd.DataFrame:
    """
    Load the dataset from local CSV cache if available, otherwise download
    from Hugging Face, clean it, and persist to the cache path.
    """
    if _CACHE_PATH.exists():
        logger.info("Loading dataset from local cache: %s", _CACHE_PATH)
        df = pd.read_csv(_CACHE_PATH, low_memory=False)
        df = _restore_types(df)
        logger.info("Dataset loaded from cache. Shape: %s", df.shape)
        return df

    logger.info(
        "Local cache not found. Downloading dataset from Hugging Face: %s",
        settings.hf_dataset_id,
    )
    df = _download_from_huggingface()
    df = _clean(df)
    _persist(df)
    logger.info("Dataset downloaded and cached. Shape: %s", df.shape)
    return df


def _download_from_huggingface() -> pd.DataFrame:
    """Download the Hugging Face dataset and convert to a pandas DataFrame."""
    try:
        from datasets import load_dataset  # type: ignore

        hf_dataset = load_dataset(settings.hf_dataset_id, split="train")
        
        # Drop large unneeded columns to prevent OOM errors on constrained environments (like Railway free tier)
        cols_to_remove = ["reviews_list", "menu_item", "phone", "url", "address"]
        existing_cols_to_remove = [c for c in cols_to_remove if c in hf_dataset.column_names]
        if existing_cols_to_remove:
            hf_dataset = hf_dataset.remove_columns(existing_cols_to_remove)
            
        return hf_dataset.to_pandas()
    except Exception as exc:
        logger.error("Failed to download dataset from Hugging Face: %s", exc)
        raise RuntimeError(
            f"Could not load dataset '{settings.hf_dataset_id}' from Hugging Face "
            "and no local cache was found. Please check your internet connection."
        ) from exc


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize and clean the raw DataFrame.

    Steps:
      1. Standardize column names to snake_case.
      2. Drop rows missing essential fields (name, rating).
      3. Normalize `location` (title-case, strip whitespace).
      4. Normalize `cuisines` (title-case, strip whitespace).
      5. Coerce `average_cost_for_two` to numeric.
      6. Coerce `aggregate_rating` to float.
      7. Add `budget_tier` label (low / medium / high).
    """
    logger.info("Cleaning dataset...")

    # ── 1. Standardize column names ───────────────────────────────────────
    df.columns = [_to_snake_case(c) for c in df.columns]

    # ── 2. Identify key columns (flexible naming) ─────────────────────────
    col_map = _detect_columns(df)
    df.rename(columns=col_map, inplace=True)

    # ── 3. Drop rows missing name or rating ───────────────────────────────
    required = ["restaurant_name", "aggregate_rating"]
    before = len(df)
    df.dropna(subset=[c for c in required if c in df.columns], inplace=True)
    logger.info("Dropped %d rows with missing essential fields.", before - len(df))

    # ── Drop duplicate rows ───────────────────────────────────────────────
    before = len(df)
    subset_cols = [c for c in ["restaurant_name", "location", "address"] if c in df.columns]
    if subset_cols:
        df.drop_duplicates(subset=subset_cols, inplace=True)
    else:
        df.drop_duplicates(inplace=True)
    logger.info("Dropped %d duplicate rows.", before - len(df))

    # ── 4. Normalize location ─────────────────────────────────────────────
    if "location" in df.columns:
        df["location"] = (
            df["location"].fillna("Unknown").astype(str).str.strip().str.title()
        )

    # ── 5. Normalize cuisines ─────────────────────────────────────────────
    if "cuisines" in df.columns:
        df["cuisines"] = (
            df["cuisines"].fillna("Unknown").astype(str).str.strip().str.title()
        )

    # ── 6. Coerce cost ────────────────────────────────────────────────────
    if "average_cost_for_two" in df.columns:
        df["average_cost_for_two"] = pd.to_numeric(
            df["average_cost_for_two"].astype(str).str.replace(r"[^\d.]", "", regex=True),
            errors="coerce",
        ).fillna(0)

    # ── 7. Coerce rating ──────────────────────────────────────────────────
    if "aggregate_rating" in df.columns:
        df["aggregate_rating"] = pd.to_numeric(
            df["aggregate_rating"], errors="coerce"
        ).fillna(0.0)

    # ── 8. Add budget tier ────────────────────────────────────────────────
    if "average_cost_for_two" in df.columns:
        df["budget_tier"] = df["average_cost_for_two"].apply(_cost_to_budget_tier)
    else:
        logger.warning(
            "'average_cost_for_two' column not found after normalization. "
            "Columns present: %s. Defaulting budget_tier to 'low'.",
            df.columns.tolist(),
        )
        df["average_cost_for_two"] = 0.0
        df["budget_tier"] = "low"

    logger.info("Cleaning complete. Final shape: %s", df.shape)
    return df


def _restore_types(df: pd.DataFrame) -> pd.DataFrame:
    """Re-coerce column types after loading from CSV (CSV loses type info)."""
    if "average_cost_for_two" in df.columns:
        df["average_cost_for_two"] = pd.to_numeric(
            df["average_cost_for_two"], errors="coerce"
        ).fillna(0)
    if "aggregate_rating" in df.columns:
        df["aggregate_rating"] = pd.to_numeric(
            df["aggregate_rating"], errors="coerce"
        ).fillna(0.0)
    return df


def _persist(df: pd.DataFrame) -> None:
    """Save the cleaned DataFrame to the local CSV cache."""
    _CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(_CACHE_PATH, index=False)
    logger.info("Dataset cached to: %s", _CACHE_PATH)


def _cost_to_budget_tier(cost: float) -> str:
    """Map a numeric cost-for-two value to a budget label."""
    tiers = settings.budget_tiers
    if cost <= tiers["low"][1]:
        return "low"
    elif cost <= tiers["medium"][1]:
        return "medium"
    else:
        return "high"


def _to_snake_case(name: str) -> str:
    """Convert a column name to lowercase snake_case."""
    name = re.sub(r"[\s\-]+", "_", name.strip())
    name = re.sub(r"[^\w]", "", name)
    return name.lower()


def _detect_columns(df: pd.DataFrame) -> dict[str, str]:
    """
    Build a rename mapping to normalize common column name variations
    found in the Zomato dataset to the canonical names the app expects.

    Covers both the Kaggle-style column names and the ManikaSaini HF dataset
    which uses: 'name', 'rate', 'approx_cost(for two people)', 'listed_in(city)'.
    Note: special-char columns like 'approx_cost(for two people)' are first
    converted to snake_case by _to_snake_case, yielding
    'approx_costfor_two_people' — that snake_case form is what we match here.
    """
    canonical = {
        "restaurant_name": [
            "restaurant_name", "name", "res_name",
        ],
        "location": [
            "location", "city", "locality", "area",
            # HF dataset: listed_in(city) → snake → listed_incity
            "listed_incity", "listed_in_city",
        ],
        "cuisines": [
            "cuisines", "cuisine", "cuisine_type",
        ],
        "average_cost_for_two": [
            "average_cost_for_two", "avg_cost", "cost_for_two", "cost",
            # HF dataset: 'approx_cost(for two people)' → snake_case below
            "approx_costfor_two_people",   # after _to_snake_case
            "approx_cost_for_two_people",  # alternate snake
            "approx_cost",
        ],
        "aggregate_rating": [
            "aggregate_rating", "rating", "avg_rating", "user_rating",
            # HF dataset uses 'rate'
            "rate",
        ],
    }
    rename_map: dict[str, str] = {}
    existing = set(df.columns)
    for target, candidates in canonical.items():
        if target in existing:
            continue  # already correct
        for candidate in candidates:
            if candidate in existing:
                rename_map[candidate] = target
                break
    return rename_map
