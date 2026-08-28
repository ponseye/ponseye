'use client'

import { useState } from 'react'
import HowItWorksModal from '@/components/how-it-works/HowItWorksModal'

export default function Footer() {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  return (
    <>
      <footer className="w-full border-t border-white/[0.07] bg-black/60 backdrop-blur-xl mt-auto select-none">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs">
          {/* Left: Copyright & Network */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-zinc-400">
            <span className="font-semibold text-zinc-200 font-mono">
              © 2026 PONS<span className="text-red-500">EYE</span>
            </span>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Robinhood Chain (4663)</span>
            </div>
          </div>

          {/* Right: How It Works & Links */}
          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors font-medium hover:underline cursor-pointer"
            >
              <span>📖</span>
              <span>How It Works</span>
            </button>
            <span className="text-zinc-700">|</span>
            <a
              href="https://x.com/ponseye"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors font-medium font-mono"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@ponseye</span>
            </a>
          </div>
        </div>
      </footer>

      {/* How It Works Popup Modal */}
      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </>
  )
}
