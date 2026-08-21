# Implementation Plan: AI-Powered Restaurant Recommendation System

> **Source:** [problemStatement.md](file:///d:/Rest%20Project/Docs/problemStatement.md) · [architecture.md](file:///d:/Rest%20Project/Docs/architecture.md)

---

## Overview

Build a full-stack, LLM-powered restaurant recommendation service that ingests the Zomato dataset from Hugging Face, filters restaurants by user preferences, and uses the Gemini API to generate ranked, explainable recommendations — all served through a FastAPI backend and a **Next.js (App Router) frontend** built on the premium **Celestial Gastronomy** design system (glassmorphism, amber/violet palette, Outfit typography).

The plan is organized into **5 phases**, each building on the previous, with clear deliverables and verification steps.

---

## Phase 1 — Project Scaffolding & Data Layer

> **Goal:** Set up the project structure, configure the environment, and get the Zomato dataset loaded and preprocessed.

### 1.1 Project Structure & Configuration

#### [NEW] [.gitignore](file:///d:/Rest%20Project/.gitignore)
- Ignore `.env`, `__pycache__`, `.pytest_cache`, `*.pyc`, `data/*.csv`, `venv/`

#### [NEW] [backend/requirements.txt](file:///d:/Rest%20Project/backend/requirements.txt)
- Pin dependencies: `fastapi`, `uvicorn[standard]`, `pandas`, `datasets`, `google-generativeai`, `python-dotenv`, `pydantic`, `httpx`, `pytest`

#### [NEW] [backend/.env](file:///d:/Rest%20Project/backend/.env)
- Template with `GEMINI_API_KEY=`, `LLM_PROVIDER=gemini`, `LOG_LEVEL=INFO`

#### [NEW] [backend/config.py](file:///d:/Rest%20Project/backend/config.py)
- Load `.env` via `python-dotenv`
- Expose settings as a Pydantic `BaseSettings` class: `gemini_api_key`, `llm_provider`, `log_level`, `budget_tiers` (dict mapping low/medium/high → cost ranges)

### 1.2 Data Ingestion Service

#### [NEW] [backend/services/data_ingestion.py](file:///d:/Rest%20Project/backend/services/data_ingestion.py)
- Download the dataset from `ManikaSaini/zomato-restaurant-recommendation` using the `datasets` library
- Clean & normalize:
  - Handle missing values (drop rows without name/rating)
  - Standardize location names (title-case, strip whitespace)
  - Parse `average_cost_for_two` to numeric
  - Normalize `aggregate_rating` to float
  - Split multi-cuisine strings into lists
- Map budget tiers:
  - **Low:** ≤ ₹500
  - **Medium:** ₹501 – ₹1500
  - **High:** > ₹1500
- Cache processed DataFrame in memory (module-level singleton)
- Optionally persist to `backend/data/zomato_processed.csv` for faster cold starts

### Deliverables — Phase 1
- [x] Project skeleton matches the directory structure from the architecture doc
- [ ] Virtual environment created and dependencies installed *(run commands below)*
- [ ] Dataset loads and preprocesses without errors *(run commands below)*
- [ ] Processed DataFrame contains clean columns: `restaurant_name`, `location`, `cuisines`, `average_cost_for_two`, `aggregate_rating`, `budget_tier`

### Verification — Phase 1
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python -c "from services.data_ingestion import get_dataframe; df = get_dataframe(); print(df.shape, df.columns.tolist())"
```

---

## Phase 2 — Backend API & Filtering Engine

> **Goal:** Stand up the FastAPI server with all endpoints and the filtering/ranking pipeline.

### 2.1 Pydantic Models

#### [NEW] [backend/models/request_models.py](file:///d:/Rest%20Project/backend/models/request_models.py)
- `RecommendRequest`: `location: str`, `budget: Literal["low","medium","high"]`, `cuisine: str`, `min_rating: float = 0.0`, `additional_preferences: str = ""`

#### [NEW] [backend/models/response_models.py](file:///d:/Rest%20Project/backend/models/response_models.py)
- `RestaurantRecommendation`: `restaurant_name`, `cuisine`, `rating`, `estimated_cost`, `explanation`
- `RecommendResponse`: `recommendations: list[RestaurantRecommendation]`, `total_results: int`, `filters_applied: dict`

### 2.2 Filtering & Ranking Service

#### [NEW] [backend/services/filter_service.py](file:///d:/Rest%20Project/backend/services/filter_service.py)
- Sequential AND-filter pipeline:
  1. Location filter (case-insensitive substring match on city/area)
  2. Budget filter (map tier → cost range, filter by `average_cost_for_two`)
  3. Cuisine filter (check if requested cuisine is in the restaurant's cuisine list)
  4. Rating filter (`aggregate_rating >= min_rating`)
- **Progressive relaxation** if results < 3: relax budget → cuisine → rating in that order
- Sort by `aggregate_rating` descending, return top **10–15** candidates

### 2.3 API Routes & Server

#### [NEW] [backend/routes/recommend.py](file:///d:/Rest%20Project/backend/routes/recommend.py)
- `POST /api/recommend` — validate input, call filter service, return candidates (LLM integration wired in Phase 3)
- `GET /api/cuisines` — return deduplicated, sorted cuisine list from the dataset
- `GET /api/locations` — return deduplicated, sorted location list from the dataset
- `GET /api/health` — return `{"status": "ok"}`

#### [NEW] [backend/main.py](file:///d:/Rest%20Project/backend/main.py)
- Initialize FastAPI app with title, description, version
- Add CORS middleware — allow `http://localhost:3000` (Next.js dev) and the production domain
- Wire up `recommend.py` router
- On startup: call `data_ingestion.get_dataframe()` to preload data
- Run via Uvicorn: `uvicorn main:app --reload --port 8000`

### Deliverables — Phase 2
- [x] FastAPI server starts and serves Swagger docs at `/docs`
- [x] All four endpoints respond correctly
- [x] Filter service returns correct candidates for known inputs
- [x] Progressive relaxation works when filters are too restrictive

### Verification — Phase 2
```bash
# Start server
uvicorn main:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/api/health
curl http://localhost:8000/api/cuisines
curl http://localhost:8000/api/locations
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"location":"Delhi","budget":"medium","cuisine":"Italian","min_rating":4.0}'
```

---

## Phase 3 — LLM Integration (Prompt Engineering + Gemini API)

> **Goal:** Wire in the Gemini LLM to rank candidates and generate natural-language explanations.

### 3.1 Prompt Builder

#### [NEW] [backend/services/prompt_builder.py](file:///d:/Rest%20Project/backend/services/prompt_builder.py)
- Construct a structured prompt with four sections:
  1. **System instruction** — "You are an expert restaurant recommendation assistant…"
  2. **User context** — location, budget, cuisine, min rating, additional preferences
  3. **Candidate data** — filtered restaurant list as a JSON array
  4. **Task instruction** — rank top 5, provide 2–3 sentence explanation per restaurant, return as JSON array
- Escape user-provided text to mitigate prompt injection
- Keep prompt within token limits (truncate candidates if necessary)

### 3.2 LLM Service

#### [NEW] [backend/services/llm_service.py](file:///d:/Rest%20Project/backend/services/llm_service.py)
- Initialize `google.generativeai` client with API key from config
- Send prompt to Gemini, request JSON output
- Parse and validate the response against the `RestaurantRecommendation` schema
- **Retry logic:** up to 3 retries with exponential backoff on rate limits / transient errors
- **Graceful degradation:** if LLM fails after retries, fall back to rule-based ranking (sort by rating → votes), return results without AI explanations
- Log all LLM calls (prompt length, response time, success/failure)

### 3.3 Wire LLM into the Recommendation Endpoint

#### [MODIFY] [recommend.py](file:///d:/Rest%20Project/backend/routes/recommend.py)
- After filtering, pass candidates to `prompt_builder.build_prompt()`
- Call `llm_service.get_recommendations(prompt)`
- Return LLM-ranked results; on LLM failure, return filter-only results with a `fallback: true` flag

### Deliverables — Phase 3
- [ ] Prompt template produces well-structured prompts
- [ ] Gemini API returns valid JSON recommendations
- [ ] Fallback path works when API key is missing or API is unreachable
- [ ] `/api/recommend` returns AI-generated explanations

### Verification — Phase 3
```bash
# With valid API key in .env
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"location":"Bangalore","budget":"high","cuisine":"Chinese","min_rating":4.0,"additional_preferences":"quick service"}'

# Verify response contains "explanation" fields with natural language text
# Test fallback: temporarily remove API key and confirm results still return (without explanations)
```

---

## Phase 4 — Frontend (Next.js App Router)

> **Goal:** Build a premium, production-quality Next.js 14 (App Router) frontend using the **Celestial Gastronomy** design system sourced from `stitch_dineai_premium_web_ui`. The UI must feel like a high-end AI concierge — glassmorphism surfaces, amber/violet palette, Outfit typography, and fluid micro-animations.

> **Design Reference:** [`stitch_dineai_premium_web_ui/`](file:///d:/Rest%20Project/stitch_dineai_premium_web_ui/stitch_dineai_premium_web_ui/)
> - Home page mockup → [`dineai_home_desktop/code.html`](file:///d:/Rest%20Project/stitch_dineai_premium_web_ui/stitch_dineai_premium_web_ui/dineai_home_desktop/code.html)
> - Results page mockup → [`dineai_results_desktop/code.html`](file:///d:/Rest%20Project/stitch_dineai_premium_web_ui/stitch_dineai_premium_web_ui/dineai_results_desktop/code.html)
> - Full design spec → [`celestial_gastronomy/DESIGN.md`](file:///d:/Rest%20Project/stitch_dineai_premium_web_ui/stitch_dineai_premium_web_ui/celestial_gastronomy/DESIGN.md)

---

### 4.1 Project Bootstrap

#### [NEW] [frontend/](file:///d:/Rest%20Project/frontend/) — Next.js 14 app
```bash
# Run from d:\Rest Project
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
```
- TypeScript + Tailwind CSS + App Router
- `src/` directory layout
- API base URL stored in `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

### 4.2 Design System Setup

#### [MODIFY] [frontend/tailwind.config.ts](file:///d:/Rest%20Project/frontend/tailwind.config.ts)
Extend Tailwind with the **Celestial Gastronomy** tokens (ported directly from the stitch mockup's `tailwind.config`):
- **Colors** — full token set: `surface`, `primary` (#ffc880 amber), `secondary` (#d2bcff violet), `on-surface`, `surface-container`, `outline`, etc.
- **Font sizes** — `display-lg` (48px/700), `headline-lg` (32px/700), `headline-md` (24px/600), `body-lg`, `body-md`, `label-md`, `label-sm`
- **Border radius** — `DEFAULT` 0.25rem, `lg` 0.5rem, `xl` 0.75rem, `full`
- **Spacing** — `xs` 8px, `sm` 16px, `md` 24px, `lg` 40px, `xl` 64px
- `darkMode: 'class'`

#### [MODIFY] [frontend/src/app/globals.css](file:///d:/Rest%20Project/frontend/src/app/globals.css)
Define global CSS custom properties and reusable utility classes:
```css
/* Celestial Gastronomy — global styles */
body {
  background-color: #19120a;
  background-image: radial-gradient(circle at 50% 0%, rgba(83,50,148,0.15) 0%, transparent 70%);
  color: #eee0d2;
  font-family: 'Outfit', sans-serif;
}

.glass-card {
  background: rgba(37, 30, 22, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.05);
  border-top: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.input-glow:focus-within {
  border-color: #f5a623;
  box-shadow: inset 0 0 10px rgba(245,166,35,0.2), 0 0 15px rgba(245,166,35,0.1);
}

.ai-pulse {
  animation: ai-glow 2.5s ease-in-out infinite;
}
@keyframes ai-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(83,50,148,0); }
  50% { box-shadow: 0 0 20px 6px rgba(83,50,148,0.35); }
}
```
- Custom range-slider styles (amber thumb, dark track)
- `pill-active` class for budget toggle
- `card-enter` keyframe animation (fade + translateY)
- Google Fonts import: **Outfit** (weights 400, 500, 600, 700)

---

### 4.3 API Client

#### [NEW] [frontend/src/lib/api.ts](file:///d:/Rest%20Project/frontend/src/lib/api.ts)
Typed fetch wrapper for the FastAPI backend:
```typescript
export async function fetchCuisines(): Promise<string[]>
export async function fetchLocations(): Promise<string[]>
export async function fetchRecommendations(payload: RecommendRequest): Promise<RecommendResponse>
```
- Base URL from `process.env.NEXT_PUBLIC_API_URL`
- Re-exports `RecommendRequest` and `RecommendResponse` types matching backend Pydantic models
- Throws typed `ApiError` on non-2xx responses

#### [NEW] [frontend/src/types/api.ts](file:///d:/Rest%20Project/frontend/src/types/api.ts)
```typescript
export interface RecommendRequest {
  location: string;
  budget: 'low' | 'medium' | 'high';
  cuisine: string;
  min_rating: number;
  additional_preferences?: string;
}
export interface RestaurantCard {
  restaurant_name: string;
  cuisine: string;
  rating: number;
  estimated_cost: number;
  explanation: string;
}
export interface RecommendResponse {
  recommendations: RestaurantCard[];
  total_results: number;
  filters_applied: Record<string, unknown>;
  fallback?: boolean;
}
```

---

### 4.4 UI Components (in `frontend/src/components/`)

#### [NEW] `TopBar.tsx`
- Fixed glassmorphism header: DineAI logo + wordmark, desktop nav (Discover / Saved / Reservations), avatar icon
- Mobile: shows only logo + avatar; bottom nav handles navigation
- Matches `dineai_home_desktop/code.html` header exactly

#### [NEW] `BottomNav.tsx`
- Mobile-only fixed bottom navigation bar (hidden `md:hidden`)
- 4 tabs: Discover, Saved, Reservations, Profile — with active-state amber tint

#### [NEW] `SearchForm.tsx` (Client Component `'use client'`)
- Glassmorphism form card (`glass-card rounded-2xl`)
- Fields:
  - **Location** — text input with `location_on` Material Symbol icon; options hydrated from `/api/locations` via `<datalist>`
  - **Cuisine** — `<select>` dropdown hydrated from `/api/cuisines`
  - **Budget** — three pill-toggle buttons ($ / $$ / $$$) mapping to `low/medium/high`; amber glow on active
  - **Min Rating** — range slider (3–5, step 0.1) with live amber value display
  - **Additional Preferences** — `<textarea>` with placeholder text
- Submit button: amber gradient, amber glow shadow, `btn-pulse` animation
- Calls `onSubmit(payload: RecommendRequest)` prop
- Full keyboard accessibility; all inputs have unique `id` attributes

#### [NEW] `RestaurantCard.tsx`
- Glassmorphism card (`glass-card rounded-2xl`)
- Displays: name, cuisine chip (violet), star rating (amber stars with glow at 5★), estimated cost, AI explanation paragraph
- **AI-recommended badge**: subtle pulsing violet glow (`ai-pulse` class) behind the card border
- `fallback` prop: hides the AI explanation section and shows a "Top-rated pick" label instead
- Entrance animation: `card-enter` CSS keyframe (fade-up with stagger via `animation-delay`)
- Hover: `translate-y-[-4px]` + deepened glow

#### [NEW] `ResultsGrid.tsx`
- Responsive grid: 1 column mobile → 2 columns tablet → 3 columns desktop
- Renders `RestaurantCard` list with staggered `animation-delay` (0ms, 100ms, 200ms…)
- Shows `total_results` count and `filters_applied` summary at the top
- If `fallback: true` on response, shows an amber alert banner: "AI service unavailable — showing top-rated results"

#### [NEW] `LoadingState.tsx`
- Full-width skeleton loader: 3 glass-card skeletons with shimmer animation
- Matches card dimensions so the layout doesn't shift on data arrival

#### [NEW] `ErrorBanner.tsx`
- Dismissible error banner with amber/red styling
- Accepts `message` prop; auto-dismisses after 8s

---

### 4.5 Pages (App Router)

#### [NEW] [frontend/src/app/layout.tsx](file:///d:/Rest%20Project/frontend/src/app/layout.tsx)
- Root layout: wraps all pages with `<TopBar />` and `<BottomNav />`
- Applies `dark` class to `<html>`
- Sets `<meta>` SEO tags: title template, description, viewport
- Loads Outfit font via `next/font/google`

#### [NEW] [frontend/src/app/page.tsx](file:///d:/Rest%20Project/frontend/src/app/page.tsx)
Home page (Server Component shell + Client island):
- Hero section: `h1` "Find your perfect restaurant", subtitle copy
- Renders `<SearchForm />` as a client component island
- On form submit: calls `fetchRecommendations()`, transitions to results view
- Manages UI state: `idle | loading | success | error`
- Shows `<LoadingState />` during fetch, `<ResultsGrid />` on success, `<ErrorBanner />` on error
- Results section slides into view with a smooth CSS transition (no page navigation — single-page flow)

#### [NEW] [frontend/src/app/not-found.tsx](file:///d:/Rest%20Project/frontend/src/app/not-found.tsx)
- Custom 404 page matching the Celestial Gastronomy theme

---

### 4.6 next.config.js

#### [MODIFY] [frontend/next.config.js](file:///d:/Rest%20Project/frontend/next.config.js)
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
    }];
  },
};
module.exports = nextConfig;
```
- Proxies `/api/*` to FastAPI during development — no CORS headers needed from the browser

---

### Deliverables — Phase 4
- [ ] `npm run dev` starts Next.js at `http://localhost:3000` without errors
- [ ] Dropdowns (location, cuisine) hydrate from live backend API
- [ ] Form submission triggers recommendations and renders cards with staggered animations
- [ ] Design exactly matches Celestial Gastronomy mockups: glassmorphism, amber palette, Outfit font
- [ ] AI pulse glow visible on restaurant cards
- [ ] Responsive: 1/2/3-column grid across mobile/tablet/desktop
- [ ] Loading skeleton and error banner display correctly
- [ ] `fallback: true` response handled gracefully

### Verification — Phase 4
```bash
# Terminal 1 — backend
cd "d:\Rest Project\backend"
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd "d:\Rest Project\frontend"
npm install
npm run dev
# Open http://localhost:3000
```
- Fill form → submit → verify cards render with AI explanations and amber star ratings
- Resize viewport: confirm 1/2/3 column breakpoints
- Stop backend mid-request → verify `<ErrorBanner />` appears
- Remove `GEMINI_API_KEY` → verify fallback banner shown but results still render

---

## Phase 5 — Testing, Polish & Documentation

> **Goal:** Add automated tests, handle edge cases, and finalize documentation.

### 5.1 Unit Tests

#### [NEW] [tests/test_filter_service.py](file:///d:/Rest%20Project/tests/test_filter_service.py)
- Test each filter individually (location, budget, cuisine, rating)
- Test progressive relaxation logic
- Test edge case: no results after all filters
- Test edge case: empty/null input fields

#### [NEW] [tests/test_prompt_builder.py](file:///d:/Rest%20Project/tests/test_prompt_builder.py)
- Test prompt structure contains all required sections
- Test prompt injection escaping
- Test candidate truncation when list is too long

### 5.2 Integration Tests

#### [NEW] [tests/test_api.py](file:///d:/Rest%20Project/tests/test_api.py)
- Test `GET /api/health` returns 200
- Test `GET /api/cuisines` returns non-empty list
- Test `GET /api/locations` returns non-empty list
- Test `POST /api/recommend` with valid input returns recommendations
- Test `POST /api/recommend` with invalid input returns 422
- Test `POST /api/recommend` fallback when LLM is unavailable (mock the LLM service)

### 5.3 Security & Edge Cases

#### [MODIFY] [main.py](file:///d:/Rest%20Project/backend/main.py)
- Add rate limiting middleware on `/api/recommend` (e.g., `slowapi`)
- Ensure CORS is restricted to specific origins in production

#### [MODIFY] [prompt_builder.py](file:///d:/Rest%20Project/backend/services/prompt_builder.py)
- Harden prompt injection escaping (strip special characters, limit `additional_preferences` length)

### 5.4 Documentation

#### [NEW] [README.md](file:///d:/Rest%20Project/README.md)
- Project overview, tech stack summary
- Setup instructions (clone, install dependencies, configure `.env`)
- How to run (backend + frontend)
- API documentation summary (link to `/docs`)
- Screenshots of the UI
- Future enhancements (from architecture doc §8)

### Deliverables — Phase 5
- [ ] All unit and integration tests pass
- [ ] Rate limiting is active on the recommend endpoint
- [ ] README covers full setup and usage
- [ ] No security warnings in the codebase

### Verification — Phase 5
```bash
cd backend
pytest tests/ -v --tb=short
```

---

## Phase Summary

| Phase | Focus                             | Key Files Created / Modified                                                                       | Estimated Effort |
|-------|-----------------------------------|----------------------------------------------------------------------------------------------------|------------------|
| **1** | Scaffolding & Data Layer         | `.gitignore`, `requirements.txt`, `.env`, `config.py`, `data_ingestion.py`                        | ~2–3 hours       |
| **2** | Backend API & Filtering          | `request_models.py`, `response_models.py`, `filter_service.py`, `recommend.py`, `main.py`         | ~3–4 hours       |
| **3** | LLM Integration                  | `prompt_builder.py`, `llm_service.py`, update `recommend.py`                                       | ~2–3 hours       |
| **4** | Frontend — Next.js App Router    | `create-next-app`, `tailwind.config.ts`, `globals.css`, `api.ts`, `types/api.ts`, 6× components, 2× pages, `next.config.js` | ~5–6 hours       |
| **5** | Testing, Polish & Docs           | `test_filter_service.py`, `test_prompt_builder.py`, `test_api.py`, `README.md`                    | ~2–3 hours       |

> **Total estimated effort: 14–19 hours**

---

## Decisions (Resolved)

1. **Gemini API Key** — ✅ Provided
2. **Frontend Framework** — ✅ **Next.js 14 (App Router)** with TypeScript + Tailwind CSS, using the Celestial Gastronomy design system from `stitch_dineai_premium_web_ui`
3. **API Integration** — Next.js `rewrites()` proxy to FastAPI in dev; direct API URL in prod (CORS allowed for the deployed origin)
4. **Dataset Caching** — ✅ Persist processed dataset to local CSV for faster restarts
5. **Deployment Target** — ✅ Push to GitHub; FastAPI → Docker, Next.js → Vercel (or same Docker compose)
