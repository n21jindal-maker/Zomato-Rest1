# Architecture Document: AI-Powered Restaurant Recommendation System

> **Project:** Zomato-inspired Restaurant Recommendation Service  
> **Date:** August 2026  
> **Reference:** [problemStatement.md](file:///d:/Rest%20Project/Docs/problemStatement.md)

---

## 1. High-Level Overview

The system is a full-stack application that combines a **structured restaurant dataset** with a **Large Language Model (LLM)** to deliver personalized, explainable restaurant recommendations. Users provide their preferences through a web interface, the backend filters and ranks relevant restaurants, and the LLM generates natural-language explanations for each suggestion.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                                │
│   Enters: Location, Budget, Cuisine, Rating, Preferences             │
└──────────────────┬───────────────────────────────────────────────────┘
                   │  HTTP Request (REST API)
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER (Python / FastAPI)                │
│                                                                       │
│  ┌─────────────┐   ┌──────────────────┐   ┌────────────────────┐     │
│  │  Input       │──▶│  Data Filtering  │──▶│  Prompt Builder    │     │
│  │  Validator   │   │  & Ranking       │   │  & LLM Client      │     │
│  └─────────────┘   └──────────────────┘   └────────┬───────────┘     │
│                            ▲                        │                 │
│                            │                        ▼                 │
│                    ┌───────┴────────┐       ┌───────────────────┐     │
│                    │  Data Store    │       │  LLM Provider     │     │
│                    │  (Preprocessed │       │  (Gemini / OpenAI)│     │
│                    │   Dataset)     │       └───────────────────┘     │
│                    └────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
                   │
                   ▼  JSON Response
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (HTML/CSS/JS)                            │
│          Renders recommendation cards with explanations               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Layers

### 2.1 Presentation Layer (Frontend)

| Aspect         | Detail                                                      |
| -------------- | ----------------------------------------------------------- |
| **Technology** | HTML5, CSS3, Vanilla JavaScript                             |
| **Purpose**    | Collect user preferences & display recommendation results   |
| **Components** | Preference Form, Results Panel, Loading State, Error Display |

**Responsibilities:**
- Render a responsive form for user input (location, budget, cuisine, minimum rating, additional preferences)
- Submit preferences to the backend REST API
- Display recommendation cards containing restaurant name, cuisine, rating, estimated cost, and AI-generated explanation
- Handle loading states and error messages gracefully

---

### 2.2 API Layer (REST Endpoints)

| Endpoint                     | Method | Description                                    |
| ---------------------------- | ------ | ---------------------------------------------- |
| `/api/recommend`             | POST   | Accept user preferences, return recommendations |
| `/api/cuisines`              | GET    | List all available cuisines in the dataset      |
| `/api/locations`             | GET    | List all available locations in the dataset     |
| `/api/health`                | GET    | Health check endpoint                           |

**Request Schema — `/api/recommend`**

```json
{
  "location": "Delhi",
  "budget": "medium",
  "cuisine": "Italian",
  "min_rating": 4.0,
  "additional_preferences": "family-friendly, outdoor seating"
}
```

**Response Schema — `/api/recommend`**

```json
{
  "recommendations": [
    {
      "restaurant_name": "La Piazza",
      "cuisine": "Italian",
      "rating": 4.5,
      "estimated_cost": 800,
      "explanation": "La Piazza is a top-rated Italian restaurant in Central Delhi with a cozy family-friendly ambiance..."
    }
  ],
  "total_results": 5,
  "filters_applied": {
    "location": "Delhi",
    "budget": "medium",
    "cuisine": "Italian",
    "min_rating": 4.0
  }
}
```

---

### 2.3 Business Logic Layer (Core Services)

#### 2.3.1 Data Ingestion Service

| Aspect         | Detail                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| **Source**      | [Zomato Dataset on Hugging Face](https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation) |
| **Library**     | `datasets` (Hugging Face) or `pandas`                                       |
| **Stage**       | Runs once at application startup (or cached to local file)                  |

**Steps:**
1. Download/load the dataset using the Hugging Face `datasets` library
2. Clean and normalize fields (handle missing values, standardize location names, parse cost ranges)
3. Extract and index relevant columns:
   - `restaurant_name`
   - `location` / `city`
   - `cuisines`
   - `average_cost_for_two`
   - `aggregate_rating`
   - Additional metadata (votes, online delivery, table booking, etc.)
4. Map budget labels to cost ranges:
   - **Low:** ≤ ₹500
   - **Medium:** ₹501 – ₹1500
   - **High:** > ₹1500
5. Cache the processed DataFrame in memory for fast filtering

#### 2.3.2 Filtering & Ranking Service

**Pipeline:**

```
User Preferences
      │
      ▼
┌─────────────────┐
│  Location Filter │──▶ Match city/area
└────────┬────────┘
         ▼
┌─────────────────┐
│  Budget Filter   │──▶ Map budget tier to cost range
└────────┬────────┘
         ▼
┌─────────────────┐
│  Cuisine Filter  │──▶ Match cuisine type(s)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Rating Filter   │──▶ >= min_rating
└────────┬────────┘
         ▼
┌─────────────────┐
│  Sort by Rating  │──▶ Descending order
│  (Top N = 10-15) │
└────────┬────────┘
         ▼
   Candidate List → sent to LLM
```

- Filters are applied sequentially (AND logic)
- If filters yield too few results (< 3), relax constraints progressively (budget → cuisine → rating)
- Return top **10–15 candidates** to keep the LLM prompt concise

#### 2.3.3 Prompt Engineering Module

Constructs a structured prompt for the LLM containing:

1. **System instruction** — role definition ("You are a restaurant recommendation expert…")
2. **User context** — the user's stated preferences
3. **Candidate data** — filtered restaurant list in a structured format (JSON or table)
4. **Task instruction** — rank the top 5, provide a 2–3 sentence explanation per recommendation, and optionally summarize the set

**Prompt Template (example):**

```
You are an expert restaurant recommendation assistant.

A user is looking for restaurants with the following preferences:
- Location: {location}
- Budget: {budget}
- Cuisine: {cuisine}
- Minimum Rating: {min_rating}
- Additional: {additional_preferences}

Below is a list of candidate restaurants that match the basic filters:

{candidate_restaurants_json}

From this list, select and rank the top 5 restaurants that best fit the
user's preferences. For each recommendation, provide:
1. Restaurant Name
2. Cuisine
3. Rating
4. Estimated Cost for Two
5. A 2–3 sentence explanation of why this restaurant is a great fit.

Return your response as a JSON array.
```

#### 2.3.4 LLM Integration Service

| Aspect             | Detail                                           |
| ------------------ | ------------------------------------------------ |
| **Primary Model**  | Google Gemini API (or OpenAI GPT as fallback)    |
| **Library**        | `google-generativeai` / `openai`                 |
| **Auth**           | API key stored in `.env` (never committed)       |
| **Response Format**| Structured JSON (parsed and validated)           |

**Responsibilities:**
- Send the constructed prompt to the LLM
- Parse the JSON response and validate structure
- Handle rate limits, timeouts, and malformed responses with retries
- Fallback to a simpler ranking (by rating) if the LLM call fails

---

### 2.4 Data Layer

```
┌─────────────────────────────────────────┐
│           Data Sources                   │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  Hugging Face Dataset (Remote)   │    │
│  │  ─ loaded once at startup        │    │
│  └──────────┬───────────────────────┘    │
│             │                             │
│             ▼                             │
│  ┌──────────────────────────────────┐    │
│  │  Local CSV / Parquet Cache       │    │
│  │  ─ preprocessed, indexed         │    │
│  └──────────┬───────────────────────┘    │
│             │                             │
│             ▼                             │
│  ┌──────────────────────────────────┐    │
│  │  In-Memory pandas DataFrame      │    │
│  │  ─ used for runtime filtering    │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 3. Project Structure

```
Rest Project/
├── Docs/
│   ├── ProblemStatement.txt          # Original problem statement
│   ├── problemStatement.md           # Formatted problem statement
│   └── architecture.md               # This document
├── backend/
│   ├── main.py                       # FastAPI application entry point
│   ├── config.py                     # Environment & configuration management
│   ├── services/
│   │   ├── data_ingestion.py         # Dataset loading & preprocessing
│   │   ├── filter_service.py         # Filtering & candidate selection
│   │   ├── prompt_builder.py         # LLM prompt construction
│   │   └── llm_service.py           # LLM API integration
│   ├── models/
│   │   ├── request_models.py         # Pydantic request schemas
│   │   └── response_models.py        # Pydantic response schemas
│   ├── routes/
│   │   └── recommend.py              # API route handlers
│   ├── data/
│   │   └── zomato_processed.csv      # Cached preprocessed dataset
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # API keys (git-ignored)
├── frontend/
│   ├── index.html                    # Main HTML page
│   ├── style.css                     # Styling
│   └── script.js                     # Client-side logic
├── tests/
│   ├── test_filter_service.py        # Unit tests for filtering
│   ├── test_prompt_builder.py        # Unit tests for prompt construction
│   └── test_api.py                   # Integration tests for API endpoints
├── .gitignore
└── README.md
```

---

## 4. Technology Stack

| Layer           | Technology                              | Purpose                              |
| --------------- | --------------------------------------- | ------------------------------------ |
| **Frontend**    | HTML5, CSS3, JavaScript                 | User interface                       |
| **Backend**     | Python 3.11+, FastAPI                   | REST API server                      |
| **Data**        | pandas, Hugging Face `datasets`         | Data loading & manipulation          |
| **LLM**        | Google Gemini API / OpenAI API          | Natural language recommendations     |
| **Validation**  | Pydantic                                | Request/response schema validation   |
| **Server**      | Uvicorn                                 | ASGI server for FastAPI              |
| **Environment** | python-dotenv                           | Secrets management                   |
| **Testing**     | pytest, httpx                           | Unit & integration tests             |

---

## 5. Data Flow Sequence

```
  User            Frontend          Backend API        Filter Service       LLM Service
   │                 │                   │                   │                   │
   │  Fill form      │                   │                   │                   │
   │────────────────▶│                   │                   │                   │
   │                 │  POST /recommend  │                   │                   │
   │                 │──────────────────▶│                   │                   │
   │                 │                   │  Filter dataset   │                   │
   │                 │                   │──────────────────▶│                   │
   │                 │                   │  Candidates (≤15) │                   │
   │                 │                   │◀──────────────────│                   │
   │                 │                   │  Build prompt + call LLM             │
   │                 │                   │─────────────────────────────────────▶│
   │                 │                   │  Ranked results + explanations       │
   │                 │                   │◀─────────────────────────────────────│
   │                 │  JSON response    │                   │                   │
   │                 │◀──────────────────│                   │                   │
   │  Display cards  │                   │                   │                   │
   │◀────────────────│                   │                   │                   │
```

---

## 6. Key Design Decisions

### 6.1 Why FastAPI?

- Native async support for non-blocking LLM API calls
- Built-in Pydantic validation for request/response schemas
- Auto-generated Swagger/OpenAPI docs at `/docs`
- Lightweight and high-performance

### 6.2 Why In-Memory pandas over a Database?

- The Zomato dataset is relatively small (fits comfortably in memory)
- Eliminates the need for database setup, migrations, and connection management
- pandas provides fast, expressive filtering and sorting
- Can be upgraded to SQLite or PostgreSQL if the dataset grows significantly

### 6.3 Why Pre-Filter Before LLM?

- LLMs have token limits — sending the entire dataset is impractical
- Pre-filtering reduces cost per API call (fewer input tokens)
- Structured filtering (location, budget, rating) is deterministic and fast
- The LLM focuses on what it does best: **reasoning, ranking, and explanation**

### 6.4 Graceful Degradation

If the LLM API is unavailable or returns an error:
- Fall back to a **rule-based ranking** (sort by rating, then by votes)
- Return results without AI-generated explanations
- Log the failure for monitoring

---

## 7. Security Considerations

| Concern                   | Mitigation                                                |
| ------------------------- | --------------------------------------------------------- |
| **API Key Exposure**      | Store in `.env`, load via `python-dotenv`, add to `.gitignore` |
| **Input Injection**       | Validate and sanitize all user inputs via Pydantic models |
| **Prompt Injection**      | Escape user-provided text before embedding in LLM prompt  |
| **Rate Limiting**         | Implement request throttling on the `/api/recommend` endpoint |
| **CORS**                  | Restrict allowed origins to the frontend domain           |

---

## 8. Future Enhancements

| Enhancement                       | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| **User Accounts & History**       | Save past searches and favorite restaurants                     |
| **Semantic Search (Embeddings)**  | Use vector embeddings for better fuzzy matching on preferences  |
| **Review Summarization**          | Use the LLM to summarize restaurant reviews from the dataset    |
| **Map Integration**               | Show restaurant locations on an interactive map                 |
| **Multi-language Support**        | Serve recommendations in the user's preferred language          |
| **Caching Layer**                 | Cache frequent queries with Redis to reduce LLM API costs      |
| **Feedback Loop**                 | Let users rate recommendations to improve future suggestions    |
