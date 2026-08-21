'use client'

import Link from 'next/link'

export default function BottomNav() {
  return (
    <nav
      className="bg-surface/80 backdrop-blur-lg fixed bottom-0 w-full z-50 rounded-t-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:hidden flex justify-around items-center h-20 px-4"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link
        href="#"
        id="nav-discover"
        className="flex flex-col items-center justify-center text-primary bg-primary-container/20 rounded-xl px-3 py-1 transition-all duration-300 ease-in-out font-label-sm text-label-sm"
        aria-label="Discover restaurants"
      >
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          explore
        </span>
        <span className="mt-1">Discover</span>
      </Link>

      <Link
        href="#"
        id="nav-saved"
        className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-white/5 rounded-xl px-3 py-1 transition-all duration-300 ease-in-out font-label-sm text-label-sm"
        aria-label="Saved restaurants"
      >
        <span className="material-symbols-outlined text-[22px]">bookmark</span>
        <span className="mt-1">Saved</span>
      </Link>

      <Link
        href="#"
        id="nav-reservations"
        className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-white/5 rounded-xl px-3 py-1 transition-all duration-300 ease-in-out font-label-sm text-label-sm"
        aria-label="Reservations"
      >
        <span className="material-symbols-outlined text-[22px]">event_available</span>
        <span className="mt-1">Reservations</span>
      </Link>

      <Link
        href="#"
        id="nav-profile"
        className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-white/5 rounded-xl px-3 py-1 transition-all duration-300 ease-in-out font-label-sm text-label-sm"
        aria-label="User profile"
      >
        <span className="material-symbols-outlined text-[22px]">person</span>
        <span className="mt-1">Profile</span>
      </Link>
    </nav>
  )
}
