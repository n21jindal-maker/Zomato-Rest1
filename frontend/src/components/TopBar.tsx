'use client'

import Link from 'next/link'

export default function TopBar() {
  return (
    <header className="bg-surface/70 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/10 shadow-sm">
      <div className="flex justify-between items-center px-5 h-16 max-w-[1200px] mx-auto md:px-6">
        {/* Logo + Wordmark */}
        <Link href="/" className="flex items-center gap-xs group">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center shadow-[0_0_12px_rgba(245,166,35,0.4)] group-hover:shadow-[0_0_20px_rgba(245,166,35,0.6)] transition-shadow duration-300">
            <span className="material-symbols-outlined text-[18px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              restaurant
            </span>
          </div>
          <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary tracking-tight">
            DineAI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-lg" aria-label="Main navigation">
          <Link
            href="#"
            className="text-primary font-label-md text-label-md flex flex-col items-center gap-1 transition-colors duration-300"
            aria-label="Discover restaurants"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              explore
            </span>
            <span>Discover</span>
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors duration-300 flex flex-col items-center gap-1"
            aria-label="Saved restaurants"
          >
            <span className="material-symbols-outlined text-[20px]">bookmark</span>
            <span>Saved</span>
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors duration-300 flex flex-col items-center gap-1"
            aria-label="Reservations"
          >
            <span className="material-symbols-outlined text-[20px]">event_available</span>
            <span>Reservations</span>
          </Link>
        </nav>

        {/* Avatar */}
        <div className="flex items-center gap-sm">
          <button
            aria-label="User profile"
            className="h-8 w-8 rounded-full bg-surface-variant border border-outline flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
        </div>
      </div>
    </header>
  )
}
