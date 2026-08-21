import { RecommendRequest, RecommendResponse } from '@/types/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody?.detail || errorBody?.message || errorMessage
    } catch {
      // ignore parse error
    }
    throw new ApiError(errorMessage, response.status)
  }

  return response.json() as Promise<T>
}

export async function fetchCuisines(): Promise<string[]> {
  const data = await fetchJson<{ cuisines: string[] }>(`${BASE_URL}/api/cuisines`)
  return data.cuisines
}

export async function fetchLocations(): Promise<string[]> {
  const data = await fetchJson<{ locations: string[] }>(`${BASE_URL}/api/locations`)
  return data.locations
}

export async function fetchRecommendations(
  payload: RecommendRequest
): Promise<RecommendResponse> {
  return fetchJson<RecommendResponse>(`${BASE_URL}/api/recommend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export { ApiError }
