# Evaluation Framework (eval.md)

> **Project:** AI-Powered Restaurant Recommendation System
> **Reference:** [architecture.md](file:///d:/Rest%20Project/Docs/architecture.md) · [implementation-plan.md](file:///d:/Rest%20Project/Docs/implementation-plan.md)

This document outlines the evaluation strategy for the recommendation system, ensuring that the data filtering is accurate, the LLM responses are high-quality (grounded and helpful), and the system performs well under expected loads.

---

## 1. Evaluation Objectives

1. **Filtering Accuracy:** Ensure the deterministic filtering engine correctly narrows down the dataset based on hard constraints (location, budget, cuisine, rating).
2. **LLM Grounding & Adherence:** Ensure the Gemini LLM only recommends restaurants from the provided candidate list (zero hallucinations) and returns the correct JSON structure.
3. **Explanation Quality:** Evaluate whether the LLM's explanations directly address the user's `additional_preferences` and sound natural.
4. **System Latency:** Monitor the overhead introduced by the LLM API call compared to local filtering.

---

## 2. Automated Testing (Deterministic Components)

These tests evaluate the non-AI parts of the system. They run in CI/CD via `pytest`.

### 2.1 Filtering Engine (`test_filter_service.py`)
- **Exact Matches:** Given specific preferences (e.g., "Delhi", "Italian", "high", >4.0), verify all returned candidates meet these criteria.
- **Progressive Relaxation:** Given impossible constraints (e.g., minimum rating of 5.0 with a "low" budget), verify the engine gracefully relaxes constraints to return *some* results rather than an empty array.
- **Sorting:** Verify candidates passed to the LLM are correctly sorted by `aggregate_rating` descending.

### 2.2 API Endpoints (`test_api.py`)
- **Schema Validation:** Verify the API rejects invalid payloads (e.g., `budget: "super-cheap"`) with a 422 error.
- **Degradation Check:** Mock the LLM service to simulate a timeout. Verify the API returns the filtered candidates without explanations, maintaining a 200 OK status.

---

## 3. LLM Evaluation Metrics (Generative Components)

Evaluating LLM outputs requires a mix of heuristic checks and qualitative review.

### 3.1 Heuristic (Automated) LLM Evals
Run against a "Golden Dataset" of 20-30 test queries.

| Metric | Measurement Method | Target |
| :--- | :--- | :--- |
| **Schema Adherence** | Check if output parses cleanly into the Pydantic `RestaurantRecommendation` list. | 100% |
| **Hallucination Rate** | Check if every `restaurant_name` in the LLM output exists in the original `candidate_list` provided in the prompt. | 0% |
| **Constraint Adherence** | Ensure the LLM ranks exactly 5 items (if candidates >= 5). | 100% |

### 3.2 Qualitative Evals (Human-in-the-Loop)
A sample of responses should be reviewed for:
- **Tone & Persona:** Does it sound like a helpful restaurant expert?
- **Preference Alignment:** If the user asked for "family-friendly", does the explanation actually mention why it's good for families, or is it a generic summary?
- **Repetition:** Are the explanations distinct from one another, or is the model reusing the same phrasing for all 5 recommendations?

---

## 4. Performance & Latency Metrics

| Metric | Target | Monitoring Approach |
| :--- | :--- | :--- |
| **Data Ingestion (Cold Start)** | < 3 seconds | Time the dataset loading sequence on application startup. |
| **Filtering Latency** | < 50 ms | Measure execution time of the pandas filtering pipeline. |
| **LLM Call Latency** | < 3 seconds (p90) | Log request/response times for the Gemini API call. |
| **End-to-End Latency** | < 3.5 seconds | Total time from HTTP request to HTTP response. |

---

## 5. Test Cases (Golden Dataset Examples)

When running evaluations, use these representative queries to test the edges of the system:

1. **The "Perfect Match" (Standard Query):**
   - Location: "Bangalore" | Budget: "medium" | Cuisine: "North Indian" | Min Rating: 4.0 | Additional: "good for large groups"
   - *Expected:* Fast filtering, LLM highlights group seating.
2. **The "Overly Restrictive" (Tests Relaxation):**
   - Location: "Delhi" | Budget: "low" | Cuisine: "Sushi" | Min Rating: 4.8
   - *Expected:* Engine relaxes constraints (likely dropping budget or rating) to find sushi places. LLM should ideally acknowledge the compromise if instructed.
3. **The "Vague/Broad" (Tests LLM Ranking):**
   - Location: "Mumbai" | Budget: "high" | Cuisine: "Any" | Min Rating: 3.0 | Additional: "romantic anniversary dinner"
   - *Expected:* Engine returns many top-rated places. The LLM must do the heavy lifting to pick places suitable for an anniversary based on its general knowledge of the restaurants.
