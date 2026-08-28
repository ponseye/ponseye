'use client'

import { useState, useEffect, useCallback } from 'react'

interface TextStep {
  number: string
  kicker: string
  line1: string
  line2: string
  subtext: string
}

const TEXT_STEPS: TextStep[] = [
  {
    number: '01',
    kicker: 'TARGET ALPHA CALLERS',
    line1: 'MONITOR TOP KOLS',
    line2: 'IN REAL-TIME',
    subtext: 'Stream posts from top influencers on X the moment early calls go live.',
  },
  {
    number: '02',
    kicker: 'SPEED SCANNER',
    line1: 'SUB-MILLISECOND',
    line2: 'CA DETECTION',
    subtext: 'High-speed EVM regex engine parses Robinhood Chain token contracts instantly.',
  },
  {
    number: '03',
    kicker: 'LIQUIDITY ROUTING',
    line1: '1-CLICK INSTANT',
    line2: 'PONS V2 SWAP',
    subtext: 'Direct bonding curve execution with zero confirmation popup delays.',
  },
  {
    number: '04',
    kicker: 'EMBEDDED WALLET',
    line1: '100% NON-CUSTODIAL',
    line2: '& PRIVATE',
    subtext: 'Your keys stay in your wallet. Automatic on-chain token balance discovery.',
  },
  {
    number: '05',
    kicker: 'ROBINHOOD CHAIN',
    line1: 'WELCOME TO',
    line2: 'PONSEye TERMINAL',
    subtext: 'The fastest automated sniping & DEX trading terminal on Robinhood Chain.',
  },
]

const STEP_DURATION = 3200 // 3.2s per step

interface FullscreenIntroProps {
  onComplete: () => void
}

export default function FullscreenIntro({ onComplete }: FullscreenIntroProps) {
  const [index, setIndex] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const advanceStep = useCallback(() => {
    setIsFadingOut(true)
    setTimeout(() => {
      if (index < TEXT_STEPS.length - 1) {
        setIndex((prev) => prev + 1)
        setIsFadingOut(false)
      } else {
        setIsComplete(true)
        setTimeout(onComplete, 500)
      }
    }, 600)
  }, [index, onComplete])

  useEffect(() => {
    const timer = setTimeout(() => {
      advanceStep()
    }, STEP_DURATION)

    return () => clearTimeout(timer)
  }, [index, advanceStep])

  const step = TEXT_STEPS[index]

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white px-6 py-12 sm:py-16 select-none overflow-hidden transition-all duration-700 ${
        isComplete ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Soft Red Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-red-600/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Top Header with Skip Button */}
      <div className="w-full flex justify-between items-center max-w-5xl mx-auto z-20 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-mono text-zinc-400 font-bold tracking-wider">PONSEye Terminal</span>
        </div>
        <button
          onClick={() => {
            setIsComplete(true)
            setTimeout(onComplete, 200)
          }}
          className="text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
        >
          <span>Skip</span>
          <span className="text-red-400">↗</span>
        </button>
      </div>

      {/* Pure Center Minimalist Typography */}
      <div
        key={index}
        className={`flex flex-col items-center text-center max-w-4xl mx-auto my-auto ${
          isFadingOut ? 'animate-cinematic-out' : 'animate-cinematic-in'
        }`}
      >
        {/* Kicker Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/80 border border-white/[0.08] shadow-lg mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] text-zinc-300 uppercase">
            {step.number} • {step.kicker}
          </span>
        </div>

        {/* Big 2-Line Headline */}
        <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 mb-5 sm:mb-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] leading-none text-zinc-100 uppercase font-sans">
            {step.line1}
          </h1>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-rose-300 text-glow-red uppercase font-sans">
            {step.line2}
          </h2>
        </div>

        {/* Crisp Subtext */}
        <p className="text-base sm:text-xl text-zinc-400 font-light leading-relaxed max-w-xl font-sans tracking-normal">
          {step.subtext}
        </p>
      </div>

      {/* Subtle Step Progress Dots at Bottom */}
      <div className="flex items-center gap-2 z-10">
        {TEXT_STEPS.map((s, idx) => (
          <div
            key={s.number}
            className={`h-1 rounded-full transition-all duration-500 ${
              idx === index
                ? 'w-7 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                : idx < index
                ? 'w-2 bg-zinc-700'
                : 'w-2 bg-zinc-900'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
