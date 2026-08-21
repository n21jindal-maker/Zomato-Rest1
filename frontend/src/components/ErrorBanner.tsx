'use client'

import { useState, useEffect, useCallback } from 'react'

interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
  autoDismissMs?: number
}

export default function ErrorBanner({
  message,
  onDismiss,
  autoDismissMs = 8000,
}: ErrorBannerProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 300)
  }, [onDismiss])

  useEffect(() => {
    const timer = setTimeout(dismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [autoDismissMs, dismiss])

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-sm p-sm rounded-xl border mb-md transition-all duration-300 ${
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{
        background: 'rgba(147, 0, 10, 0.15)',
        borderColor: 'rgba(255, 180, 171, 0.3)',
      }}
    >
      <span
        className="material-symbols-outlined text-error flex-shrink-0 mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        error
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-label-md text-label-md text-error">Something went wrong</p>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 break-words">
          {message}
        </p>
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss error"
        className="flex-shrink-0 text-on-surface-variant hover:text-error transition-colors duration-200 ml-auto"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  )
}
