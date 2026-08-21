import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: {
    template: '%s | DineAI',
    default: 'DineAI — Find Your Perfect Restaurant',
  },
  description:
    'AI-powered restaurant recommendations tailored to your taste, mood, and budget. Powered by Gemini AI and the Zomato dataset.',
  keywords: ['restaurant', 'AI', 'recommendation', 'food', 'dining', 'DineAI'],
  authors: [{ name: 'DineAI' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#19120a',
  openGraph: {
    title: 'DineAI — Find Your Perfect Restaurant',
    description: 'Let AI curate an unforgettable dining experience tailored to you.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Material Symbols — loaded via CDN for full icon coverage */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${outfit.variable} font-sans antialiased overflow-x-hidden`}>
        <TopBar />
        <BottomNav />
        {children}
        <footer className="w-full py-lg flex flex-col items-center gap-xs mb-20 md:mb-0 text-on-surface-variant font-label-sm text-label-sm">
          <p>Powered by Gemini AI · Data from Zomato</p>
          <div className="flex gap-sm mt-2">
            <a href="#" className="hover:text-on-surface transition-colors">
              Privacy
            </a>
            <span>·</span>
            <a href="#" className="hover:text-on-surface transition-colors">
              Terms
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
