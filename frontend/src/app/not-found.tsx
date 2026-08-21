import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found | DineAI',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main className="flex-grow w-full max-w-[1200px] mx-auto mt-24 mb-8 px-5 md:px-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass-card rounded-2xl p-xl text-center max-w-lg w-full">
        {/* 404 Number with glow */}
        <div className="relative mb-lg">
          <span className="font-display-lg text-[96px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-fixed-dim select-none">
            404
          </span>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ filter: 'blur(40px)', opacity: 0.3 }}
            aria-hidden="true"
          >
            <span className="text-[96px] text-primary font-bold">404</span>
          </div>
        </div>

        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
          Page Not Found
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          Looks like this table is reserved for someone else. The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-xs bg-gradient-to-r from-primary-container to-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded-xl hover:shadow-[0_0_20px_rgba(245,166,35,0.4)] transition-all duration-300 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            home
          </span>
          Back to DineAI
        </Link>
      </div>
    </main>
  )
}
