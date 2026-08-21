export interface RecommendRequest {
  location: string
  min_budget: number
  max_budget?: number | null
  cuisine: string
  min_rating: number
  additional_preferences?: string
}

export interface RestaurantCard {
  restaurant_name: string
  cuisine: string
  rating: number
  estimated_cost: number
  explanation: string
}

export interface RecommendResponse {
  recommendations: RestaurantCard[]
  total_results: number
  filters_applied: Record<string, unknown>
  fallback?: boolean
}

export interface ApiError {
  message: string
  status?: number
}
