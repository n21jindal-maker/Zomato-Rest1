'use client'

import { RecommendResponse } from '@/types/api'
import RestaurantCard from './RestaurantCard'

interface ResultsGridProps {
  response: RecommendResponse
}

function FiltersSummary({ filtersApplied }: { filtersApplied: Record<string, unknown> }) {
  const parts: string[] = []
  if (filtersApplied.location) parts.push(`${filtersApplied.location}`)
  if (filtersApplied.cuisine && filtersApplied.cuisine !== 'any')
    parts.push(`${filtersApplied.cuisine} cuisine`)
  if (filtersApplied.budget) {
    const budgetLabels: Record<string, string> = {
      low: 'budget-friendly ($)',
      medium: 'mid-range ($$)',
      high: 'premium ($$$)',
    }
    parts.push(budgetLabels[filtersApplied.budget as string] || String(filtersApplied.budget))
  }
  if (filtersApplied.min_rating) parts.push(`${filtersApplied.min_rating}★+`)

  return parts.length > 0 ? (
    <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
      Based on your preference for{' '}
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && ', '}
          <span className="text-primary font-medium">{p}</span>
        </span>
      ))}
      .
    </p>
  ) : null
}

export default function ResultsGrid({ response }: ResultsGridProps) {
  const { recommendations, total_results, filters_applied, fallback } = response

  return (
    <section className="w-full" aria-label="Restaurant recommendations">
      {/* Results Header */}
      <div className="mb-lg mt-md">
        <h2 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface">
          Found{' '}
          <span className="text-primary">{total_results} perfect match{total_results !== 1 ? 'es' : ''}</span>
        </h2>
        <FiltersSummary filtersApplied={filters_applied} />
      </div>

      {/* Fallback Alert Banner */}
      {fallback && (
        <div
          className="mb-md flex items-center gap-sm p-sm rounded-xl border"
          style={{
            background: 'rgba(245, 166, 35, 0.08)',
            borderColor: 'rgba(245, 166, 35, 0.3)',
          }}
          role="alert"
          aria-live="polite"
        >
          <span
            className="material-symbols-outlined text-primary flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            info
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            <span className="text-primary font-semibold">AI service unavailable</span> — showing top-rated results based on your filters.
          </p>
        </div>
      )}

      {/* No Results */}
      {recommendations.length === 0 ? (
        <div className="glass-card rounded-2xl p-xl text-center">
          <span
            className="material-symbols-outlined text-[48px] text-outline mx-auto block mb-md"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            search_off
          </span>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
            No restaurants found
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Try relaxing your filters — a different location, broader budget, or different cuisine might help.
          </p>
        </div>
      ) : (
        /* 3-Column Responsive Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {recommendations.map((restaurant, index) => (
            <RestaurantCard
              key={`${restaurant.restaurant_name}-${index}`}
              restaurant={restaurant}
              fallback={fallback}
              animationDelay={index * 100}
            />
          ))}
        </div>
      )}
    </section>
  )
}
