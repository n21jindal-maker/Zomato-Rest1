'use client'

import { useState, useEffect, useId } from 'react'
import { RecommendRequest } from '@/types/api'
import { fetchCuisines, fetchLocations } from '@/lib/api'

interface SearchFormProps {
  onSubmit: (payload: RecommendRequest) => void
  isLoading?: boolean
}



export default function SearchForm({ onSubmit, isLoading = false }: SearchFormProps) {
  const formId = useId()

  const [location, setLocation] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [minBudget, setMinBudget] = useState<number>(0)
  const [maxBudget, setMaxBudget] = useState<number | ''>('')
  const [minRating, setMinRating] = useState(4.0)
  const [additionalPreferences, setAdditionalPreferences] = useState('')
  const [cuisines, setCuisines] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    fetchCuisines()
      .then(setCuisines)
      .catch(() => setCuisines([]))

    fetchLocations()
      .then(setLocations)
      .catch(() => setLocations([]))
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location.trim()) return
    onSubmit({
      location: location.trim(),
      min_budget: minBudget,
      max_budget: maxBudget === '' ? null : maxBudget,
      cuisine: cuisine || 'any',
      min_rating: minRating,
      additional_preferences: additionalPreferences.trim(),
    })
  }

  return (
    <div className="glass-card w-full max-w-3xl rounded-2xl p-md md:p-xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-lg"
        aria-label="Restaurant search form"
      >
        {/* Location & Cuisine Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Location */}
          <div className="flex flex-col gap-xs">
            <label
              htmlFor={`${formId}-location`}
              className="font-label-md text-label-md text-on-surface-variant ml-1"
            >
              Location
            </label>
            <div className="relative flex items-center bg-surface-container/50 border border-surface-variant rounded-xl input-glow transition-all duration-300 overflow-hidden group">
              <span
                className="material-symbols-outlined absolute left-sm text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px] pointer-events-none"
              >
                location_on
              </span>
              <input
                id={`${formId}-location`}
                type="text"
                list={`${formId}-locations-list`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, neighborhood, or area"
                required
                className="w-full bg-transparent border-none py-sm pl-xl pr-sm text-on-surface font-body-md focus:ring-0 focus:outline-none placeholder:text-surface-bright"
                autoComplete="off"
              />
              <datalist id={`${formId}-locations-list`}>
                {locations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Cuisine */}
          <div className="flex flex-col gap-xs">
            <label
              htmlFor={`${formId}-cuisine`}
              className="font-label-md text-label-md text-on-surface-variant ml-1"
            >
              Cuisine
            </label>
            <div className="relative flex items-center bg-surface-container/50 border border-surface-variant rounded-xl input-glow transition-all duration-300 overflow-hidden group">
              <span className="material-symbols-outlined absolute left-sm text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">
                restaurant
              </span>
              <select
                id={`${formId}-cuisine`}
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full bg-transparent border-none py-sm pl-xl pr-sm text-on-surface font-body-md focus:ring-0 focus:outline-none appearance-none cursor-pointer"
              >
                <option className="bg-surface text-surface-bright" value="">
                  Any cuisine
                </option>
                {cuisines.map((c) => (
                  <option key={c} className="bg-surface text-on-surface" value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-sm text-on-surface-variant pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Budget & Rating Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Budget Inputs */}
          <div className="flex flex-col gap-xs">
            <span className="font-label-md text-label-md text-on-surface-variant ml-1">
              Budget (₹)
            </span>
            <div className="flex gap-sm h-[52px]">
              <div className="relative flex-1 flex items-center bg-surface-container/50 border border-surface-variant rounded-xl input-glow transition-all duration-300 overflow-hidden group">
                <input
                  id={`${formId}-min-budget`}
                  type="number"
                  min="0"
                  value={minBudget === 0 ? '' : minBudget}
                  onChange={(e) => setMinBudget(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Min"
                  className="w-full bg-transparent border-none py-sm px-md text-on-surface font-body-md focus:ring-0 focus:outline-none placeholder:text-surface-bright"
                />
              </div>
              <div className="relative flex-1 flex items-center bg-surface-container/50 border border-surface-variant rounded-xl input-glow transition-all duration-300 overflow-hidden group">
                <input
                  id={`${formId}-max-budget`}
                  type="number"
                  min={minBudget}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Max"
                  className="w-full bg-transparent border-none py-sm px-md text-on-surface font-body-md focus:ring-0 focus:outline-none placeholder:text-surface-bright"
                />
              </div>
            </div>
          </div>

          {/* Min Rating Slider */}
          <div className="flex flex-col gap-xs justify-center">
            <div className="flex justify-between items-end ml-1 mb-2">
              <label
                htmlFor={`${formId}-rating`}
                className="font-label-md text-label-md text-on-surface-variant"
              >
                Minimum Rating
              </label>
              <span className="font-label-md text-label-md text-primary flex items-center gap-1">
                <span>{minRating.toFixed(1)}</span>
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </span>
            </div>
            <div className="px-1">
              <input
                id={`${formId}-rating`}
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                aria-label={`Minimum rating: ${minRating.toFixed(1)} stars`}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Additional Preferences */}
        <div className="flex flex-col gap-xs">
          <label
            htmlFor={`${formId}-preferences`}
            className="font-label-md text-label-md text-on-surface-variant ml-1"
          >
            Additional Preferences
          </label>
          <div className="relative flex bg-surface-container/50 border border-surface-variant rounded-xl input-glow transition-all duration-300 overflow-hidden group p-1">
            <textarea
              id={`${formId}-preferences`}
              value={additionalPreferences}
              onChange={(e) => setAdditionalPreferences(e.target.value)}
              placeholder="e.g. Quiet atmosphere, vegan options, outdoor seating, quick service..."
              rows={3}
              maxLength={500}
              className="w-full bg-transparent border-none p-sm text-on-surface font-body-md focus:ring-0 focus:outline-none placeholder:text-surface-bright resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          id={`${formId}-submit`}
          type="submit"
          disabled={isLoading || !location.trim()}
          className="mt-sm w-full bg-gradient-to-r from-[#f5a623] to-[#ffc880] text-[#291800] font-headline-md text-headline-md py-4 rounded-xl flex items-center justify-center gap-xs transition-all duration-300 scale-100 active:scale-95 btn-pulse disabled:opacity-60 disabled:cursor-not-allowed disabled:animate-none"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              Finding restaurants…
            </>
          ) : (
            <>
              ✨ Find Restaurants
            </>
          )}
        </button>
      </form>
    </div>
  )
}
