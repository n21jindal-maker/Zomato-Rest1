"""
prompt_builder.py — Constructs the prompt for the LLM.
"""

import json
import html

def escape_input(text: str) -> str:
    """Escape user input to mitigate prompt injection."""
    if not text:
        return ""
    # Strip some common injection keywords/characters
    text = text.replace("`", "").replace("{", "").replace("}", "")
    return html.escape(text)[:500]  # Limit length

def build_prompt(
    location: str,
    min_budget: int,
    max_budget: int | None,
    cuisine: str,
    min_rating: float,
    additional_preferences: str,
    candidates: list[dict]
) -> str:
    """Build the prompt for the LLM to rank and explain recommendations."""
    
    # Escape user inputs
    safe_location = escape_input(location)
    safe_cuisine = escape_input(cuisine)
    safe_prefs = escape_input(additional_preferences)
    
    # Truncate candidates to top 15 to avoid exceeding token limits
    candidates_subset = candidates[:15]
    candidates_json = json.dumps(candidates_subset, indent=2)

    prompt = f"""You are an expert restaurant recommendation assistant.

USER CONTEXT:
- Location: {safe_location}
- Budget: {min_budget} to {max_budget if max_budget is not None else 'Any'}
- Preferred Cuisine: {safe_cuisine}
- Minimum Rating: {min_rating}
- Additional Preferences: {safe_prefs}

CANDIDATE RESTAURANTS (JSON Format):
{candidates_json}

TASK INSTRUCTIONS:
1. Review the candidate restaurants above.
2. Select the top 5 most suitable restaurants based on the user's context (especially taking into account their additional preferences).
3. For each selected restaurant, write a 2-3 sentence explanation of why it is a great choice. Tailor the explanation to the user's context.
4. Output your response as a valid JSON array of objects, where each object has the following keys:
   - "restaurant_name" (string)
   - "cuisine" (string)
   - "rating" (float)
   - "estimated_cost" (float)
   - "explanation" (string)
   
Do not include any other text, markdown formatting (like ```json), or commentary outside the JSON array. Output strictly valid JSON.
"""
    return prompt
