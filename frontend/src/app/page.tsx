'use client'

import { useState, useRef } from 'react'
import SearchForm from '@/components/SearchForm'
import ResultsGrid from '@/components/ResultsGrid'
import LoadingState from '@/components/LoadingState'
import ErrorBanner from '@/components/ErrorBanner'
import { fetchRecommendations, ApiError } from '@/lib/api'
import { RecommendRequest, RecommendResponse } from '@/types/api'

type UIState = 'idle' | 'loading' | 'success' | 'error'

export default function HomePage() {
  const [uiState, setUiState] = useState<UIState>('idle')
  const [results, setResults] = useState<RecommendResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const resultsRef = useRef<HTMLDivElement>(null)

  async function handleSearch(payload: RecommendRequest) {
    setUiState('loading')
    setErrorMsg('')
    setResults(null)

    // Smoothly scroll to results area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    try {
      const data = await fetchRecommendations(payload)
      setResults(data)
      setUiState('success')
      // Scroll to results after data arrives
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not connect to the server. Please make sure the backend is running.'
      setErrorMsg(message)
      setUiState('error')
    }
  }

  return (
    <main className="flex-grow w-full max-w-[1200px] mx-auto mt-24 mb-8 px-5 md:px-6 flex flex-col items-center">
      {/* ── Hero Section ── */}
      <section
        className="text-center mb-xl w-full max-w-2xl mx-auto"
        aria-labelledby="hero-heading"
      >
        <div className="inline-flex items-center gap-2 mb-md bg-secondary-container/20 border border-secondary/20 rounded-full px-4 py-1.5">
          <span className="text-[10px] text-secondary">✦</span>
          <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase">
            Powered by Gemini AI
          </span>
        </div>

        <h1
          id="hero-heading"
          className="font-display-lg text-display-lg text-on-surface mb-sm"
        >
          Find your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed-dim">
            perfect
          </span>{' '}
          restaurant
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Let our AI curate an unforgettable dining experience tailored specifically
          to your taste, mood, and budget.
        </p>
      </section>

      {/* ── Search Form ── */}
      <SearchForm
        onSubmit={handleSearch}
        isLoading={uiState === 'loading'}
      />

      {/* ── Results Area ── */}
      <div
        ref={resultsRef}
        className={`w-full mt-xl transition-all duration-500 ${
          uiState === 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-live="polite"
      >
        {uiState === 'error' && (
          <ErrorBanner
            message={errorMsg}
            onDismiss={() => setUiState('idle')}
          />
        )}

        {uiState === 'loading' && <LoadingState />}

        {uiState === 'success' && results && (
          <ResultsGrid response={results} />
        )}
      </div>
    </main>
  )
}
