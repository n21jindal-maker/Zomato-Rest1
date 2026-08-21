'use client'

import { RestaurantCard as RestaurantCardType } from '@/types/api'

interface RestaurantCardProps {
  restaurant: RestaurantCardType
  fallback?: boolean
  animationDelay?: number
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <span
          key={`full-${i}`}
          className={`material-symbols-outlined text-[16px] text-primary ${rating === 5 ? 'drop-shadow-[0_0_6px_rgba(245,166,35,0.8)]' : ''}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
      {hasHalf && (
        <span
          className="material-symbols-outlined text-[16px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star_half
        </span>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="material-symbols-outlined text-[16px] text-surface-bright">
          star
        </span>
      ))}
    </div>
  )
}

export default function RestaurantCard({
  restaurant,
  fallback = false,
  animationDelay = 0,
}: RestaurantCardProps) {
  const isAIRecommended = !fallback && restaurant.explanation

  return (
    <article
      className={`glass-panel rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer group glow-hover card-enter ${isAIRecommended ? 'ai-pulse' : ''}`}
      style={{
        animationDelay: `${animationDelay}ms`,
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: '1px solid rgba(255,255,255,0.18)',
      }}
      aria-label={`${restaurant.restaurant_name} restaurant card`}
    >
      {/* Card Body */}
      <div className="p-sm flex flex-col flex-grow">
        {/* Header: Name + Cuisine Chip */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="font-headline-md text-headline-md text-on-surface truncate">
              {restaurant.restaurant_name}
            </h2>
            {/* Cuisine Chip (violet) */}
            <div className="mt-1">
              <span className="inline-flex items-center bg-secondary-container/20 text-secondary border border-secondary/20 rounded-full px-3 py-0.5 font-label-sm text-label-sm">
                {restaurant.cuisine}
              </span>
            </div>
          </div>
          <button
            className="text-on-surface-variant hover:text-primary transition-colors duration-300 flex-shrink-0"
            aria-label={`Save ${restaurant.restaurant_name}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              bookmark
            </span>
          </button>
        </div>

        {/* Rating + Cost */}
        <div className="flex items-center gap-xs mb-4">
          <div className="flex items-center gap-1">
            <StarRating rating={restaurant.rating} />
            <span className="font-label-md text-label-md text-on-surface ml-1">
              {restaurant.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-on-surface-variant text-[10px]">•</span>
          <div className="flex items-center text-on-surface-variant gap-1">
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            <span className="font-label-md text-label-md">
              ~₹{restaurant.estimated_cost.toLocaleString('en-IN')} for two
            </span>
          </div>
        </div>

        {/* AI Explanation or Fallback Label */}
        <div className="mt-auto bg-surface-container-high/50 rounded-xl p-3 border border-white/5 relative overflow-hidden">
          {/* Amber left accent bar */}
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container rounded-l-xl" />

          <div className="flex items-center gap-2 mb-1.5 pl-1">
            {isAIRecommended ? (
              <span className="font-label-sm text-label-sm text-primary-container bg-primary-container/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="text-[10px]">✦</span>
                AI Match
              </span>
            ) : (
              <span className="font-label-sm text-label-sm text-outline bg-surface-variant/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                Top-rated pick
              </span>
            )}
          </div>

          {isAIRecommended ? (
            <p className="font-body-md text-body-md text-on-surface-variant italic text-sm pl-1 leading-relaxed">
              &ldquo;{restaurant.explanation}&rdquo;
            </p>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant text-sm pl-1">
              Highly rated based on your filters.
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
