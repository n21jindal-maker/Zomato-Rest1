# Deployment Plan

This document outlines the steps to deploy the **DineAI** application, which consists of a FastAPI backend and a Next.js frontend.

## 1. Overview
- **Backend (API)**: Deployed on [Railway](https://railway.app/). (Python/FastAPI)
- **Frontend (UI)**: Deployed on [Vercel](https://vercel.com/). (Next.js)

Both platforms provide native support for GitHub integration, allowing continuous deployment upon push to the main branch.

---

## 2. Backend Deployment (Railway)

1. **GitHub Integration**: Connect your GitHub account to Railway.
2. **Project Setup**:
   - Create a new project in Railway and select **Deploy from GitHub repo**.
   - Choose this repository.
   - Go to the service settings and update the **Root Directory** to `/backend`.
3. **Environment Variables**:
   In the Railway Service settings > **Variables**, add the following values (matching your `.env.example`):
   ```env
   GEMINI_API_KEY=<your_actual_api_key>
   LLM_PROVIDER=gemini
   LOG_LEVEL=INFO
   # DATASET_CACHE_PATH=data/zomato_processed.csv
   ```
4. **Start Command**:
   Railway typically uses Nixpacks to automatically detect Python/FastAPI projects. If you need to specify a start command (under Settings > Build & Deploy), use:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. **Generate Domain**:
   Under Settings > Networking, click **Generate Domain** to get a public URL for your backend API (e.g., `https://rest-backend-production.up.railway.app`). 
   *Keep note of this URL for the frontend setup.*

---

## 3. Frontend Deployment (Vercel)

1. **GitHub Integration**: Connect your GitHub account to Vercel.
2. **Project Setup**:
   - Click **Add New...** > **Project** and import this repository.
   - **Crucial Step**: In the configuration modal, set the **Root Directory** to `frontend`.
   - Vercel will automatically detect the **Next.js** framework and configure the build settings.
3. **Environment Variables**:
   Expand the "Environment Variables" section and add the backend API URL you generated in the previous step:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-app-url.up.railway.app
   ```
4. **Deploy**:
   Click **Deploy**. Vercel will build your Next.js app and provide you with a live domain (e.g., `https://dineai-frontend.vercel.app`).

---

## 4. Post-Deployment Steps

1. **Test the Backend API**: 
   Visit `https://your-backend-app-url.up.railway.app/docs` to open the FastAPI Swagger UI and ensure the API successfully started and the dataset preloaded without errors.
2. **Test the Application**: 
   Visit your Vercel URL and run a test query to verify that the frontend can successfully communicate with the deployed backend.
3. **Secure CORS (Recommended)**: 
   Currently, the backend allows all origins (`["*"]`) in `backend/main.py`. Once you have your Vercel frontend URL, it is recommended to restrict CORS:
   ```python
   # In backend/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend-app.vercel.app"],
       # ...
   )
   ```
   Push this change to GitHub to automatically trigger a new deployment on Railway.
