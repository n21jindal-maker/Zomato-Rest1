# Edge Cases & Mitigation Strategy

> **Project:** AI-Powered Restaurant Recommendation System (Zomato Use Case)
> **Reference:** [architecture.md](file:///d:/Rest%20Project/Docs/architecture.md) · [implementation-plan.md](file:///d:/Rest%20Project/Docs/implementation-plan.md)

This document outlines potential edge cases across the system's architecture and the strategies implemented to handle them gracefully.

---

## 1. Data Ingestion & Preprocessing

| Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Hugging Face Hub Unavailable** | Cannot download dataset on initial startup. | **Fallback:** Cache the dataset locally as `backend/data/zomato_processed.csv` after the first successful fetch. Application loads from cache if remote fetch fails. |
| **Malformed Dataset Rows** | Crash during preprocessing or rendering if essential fields are null/NaN. | **Data Cleaning:** Drop rows with missing `restaurant_name` or `aggregate_rating`. Provide default values for missing `average_cost_for_two` or `cuisines` (e.g., "Unknown"). |
| **Unexpected Cost Formats** | Failure to map budget tiers correctly. | **Sanitization:** Strip currency symbols and commas during ingestion. Coerce to numeric, defaulting to a fallback tier (e.g., "Medium") if unparseable. |

## 2. API & User Input Validation

| Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Extremely Long `additional_preferences`** | Token limit overflow for the LLM prompt; potential prompt injection attacks. | **Validation:** Enforce a strict character limit (e.g., max 200 chars) via Pydantic on the `/api/recommend` endpoint. Sanitize/escape special characters. |
| **Missing or Invalid Request Fields** | Server 500 errors. | **Pydantic Schemas:** Enforce strict typing (e.g., `budget` must be `Literal["low", "medium", "high"]`). FastAPI automatically returns clear 422 Unprocessable Entity errors. |
| **Location/Cuisine Not in Dataset** | Filtering engine yields 0 results. | **UI Constraints:** Populate Frontend dropdowns dynamically using `/api/locations` and `/api/cuisines` to prevent users from submitting non-existent options. |

## 3. Filtering & Ranking Engine

| Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Overly Restrictive Filters (0 matches)** | No recommendations can be generated. | **Progressive Relaxation:** If candidates < 3, the engine automatically relaxes constraints in order: Budget → Cuisine → Rating. |
| **Total Exhaustion (still 0 matches)** | User receives a blank result. | **Fallback Response:** If progressive relaxation still fails, return a friendly JSON error indicating no matches were found, prompting the user to widen their search (e.g., different location). |
| **Too Many Candidates (>100)** | Overflows the LLM prompt context window. | **Truncation:** Sort all candidates by `aggregate_rating` (descending) and hard-cap the list sent to the LLM to the top 10–15 items. |

## 4. LLM Integration (Gemini)

| Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **API Rate Limits / Timeouts** | Request fails, user waits indefinitely. | **Retry Logic & Degradation:** Implement exponential backoff for up to 3 retries. If still failing, trigger **Graceful Degradation**: return the top filtered candidates (sorted by rating) without AI-generated explanations. |
| **API Key Missing or Invalid** | Complete failure of the recommendation step. | **Startup Check & Degradation:** Validate the presence of the API key on server startup. If missing, automatically run the application in "Fallback Mode" (rule-based ranking only). |
| **Malformed JSON Response from LLM** | Backend fails to parse LLM output into Pydantic models. | **Prompt Engineering & Parsing:** Instruct the LLM strictly on the JSON schema. Use robust JSON parsing (e.g., extracting JSON blocks from markdown). If parsing fails entirely, trigger the Graceful Degradation fallback. |
| **LLM Hallucination** | LLM recommends a restaurant that isn't in the provided candidate list. | **Post-Validation:** Before returning results to the frontend, verify that the `restaurant_name` in the LLM's response exists in the originally sent candidate list. |

## 5. Frontend & UI

| Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Backend Server Down** | Network error, UI freezes or does nothing on submit. | **Error Handling:** `fetch` catch blocks display a clear, user-friendly error banner (e.g., "Service temporarily unavailable. Please try again later."). |
| **Slow LLM Processing (High Latency)** | User assumes the app is broken and clicks submit multiple times. | **State Management:** Disable the submit button and display a prominent animated loading spinner while awaiting the API response. |
| **Mobile Viewport Overflow** | Long restaurant names or LLM explanations break the card layout. | **CSS Safeguards:** Use `word-wrap: break-word` and CSS Grid/Flexbox layouts that wrap gracefully on small screens. |

## 6. Deployment (Docker / GitHub)

| Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Secrets Committed to Repo** | Gemini API key compromised. | **VCS Rules:** Ensure `.env` is firmly in `.gitignore`. Use GitHub Secrets or Cloud Provider Secret Manager for deployment environments. |
| **Dataset Download Fails in Container** | Container fails to start. | **Build Step:** Modify the Dockerfile to run a pre-cache script that downloads the dataset during the image build phase, ensuring the container ships with the required data. |
