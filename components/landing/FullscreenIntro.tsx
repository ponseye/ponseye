'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#030705] text-white px-6 py-12 sm:py-16 select-none overflow-hidden transition-all duration-700 ${
        isComplete ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Cosmic Emerald Eye Artwork Layer */}
      <div
        className="absolute inset-0 opacity-45 bg-center bg-cover bg-no-repeat pointer-events-none scale-105"
        style={{
          backgroundImage: 'url(/eye-bg.png)',
          filter: 'contrast(120%) saturate(125%)',
        }}
      />

      {/* Background Soft Emerald Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-emerald-500/20 rounded-full blur-[170px] pointer-events-none" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 20%, rgba(2, 6, 4, 0.92) 100%)',
        }}
      />

      {/* Top Header with Skip Button */}
      <div className="w-full flex justify-between items-center max-w-5xl mx-auto z-20 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-emerald-500/30 flex items-center justify-center bg-black relative flex-shrink-0 shadow-md">
            <Image src="/logo.svg" alt="PONSEye" width={24} height={24} className="object-cover" priority />
          </div>
          <span className="text-xs font-mono text-zinc-300 font-bold tracking-wider">PONSEye Terminal</span>
        </div>
        <button
          onClick={() => {
            setIsComplete(true)
            setTimeout(onComplete, 200)
          }}
          className="text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
        >
          <span>Skip</span>
          <span className="text-emerald-400">↗</span>
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#07100c]/80 border border-emerald-500/20 shadow-lg mb-6 sm:mb-8 backdrop-blur-md">
          <div className="w-4 h-4 rounded-full overflow-hidden border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.9)] flex items-center justify-center bg-black relative flex-shrink-0">
            <Image src="/logo.svg" alt="PONSEye" width={16} height={16} className="object-cover" />
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] text-emerald-300 uppercase">
            {step.number} • {step.kicker}
          </span>
        </div>

        {/* Big 2-Line Headline */}
        <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 mb-5 sm:mb-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] leading-none text-zinc-100 uppercase font-sans">
            {step.line1}
          </h1>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 text-glow-emerald uppercase font-sans">
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
                ? 'w-7 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                : idx < index
                ? 'w-2 bg-emerald-800/60'
                : 'w-2 bg-zinc-900'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
