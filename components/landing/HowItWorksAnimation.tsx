'use client'

import { useState, useEffect } from 'react'

interface StepItem {
  id: number
  stepNumber: string
  title: string
  subtitle: string
  desc: string
  icon: string
  badge: string
  previewText: string
  previewSubtext: string
  previewIcon: string
}

const STEPS: StepItem[] = [
  {
    id: 0,
    stepNumber: '01',
    title: 'Target KOL & Alpha Accounts',
    subtitle: 'Choose who to monitor',
    desc: 'Input Twitter/X usernames of top alpha callers to monitor their posts in real-time.',
    icon: '🎯',
    badge: 'Step 1 • Target',
    previewText: 'Monitoring @KOL_Alpha & 5 Target Accounts',
    previewSubtext: 'Snipe amount set: 0.005 Native ETH',
    previewIcon: '🟢',
  },
  {
    id: 1,
    stepNumber: '02',
    title: 'Live Post Ingestion',
    subtitle: 'Real-time WebSocket stream',
    desc: 'Incoming tweets are ingested within milliseconds via Twitter API v2 live feeds.',
    icon: '📡',
    badge: 'Step 2 • Stream',
    previewText: 'New Post: "Just launched $TOKEN on Robinhood!"',
    previewSubtext: 'Timestamp: 0.02s ago • Filter: Active',
    previewIcon: '⚡',
  },
  {
    id: 2,
    stepNumber: '03',
    title: 'Sub-Millisecond CA Detector',
    subtitle: 'Instant regex verification',
    desc: 'High-speed EVM address parser instantly extracts and validates contract addresses (0x...).',
    icon: '⚡',
    badge: 'Step 3 • Detect',
    previewText: 'Detected CA: 0x5fc5360d...d168 (Verified)',
    previewSubtext: 'Chain: Robinhood Chain (4663) • Verified',
    previewIcon: '🔍',
  },
  {
    id: 3,
    stepNumber: '04',
    title: 'Instant 1-Click Swap',
    subtitle: 'Pons V2 Bonding Curve execution',
    desc: 'Routes trade directly to the on-chain curve with 0 confirmation friction.',
    icon: '🏹',
    badge: 'Step 4 • Execute',
    previewText: 'Executing Buy on DEX Liquidity Pool',
    previewSubtext: 'Output: 12,500.00 TOKEN • Tx Confirmed',
    previewIcon: '🚀',
  },
  {
    id: 4,
    stepNumber: '05',
    title: '100% Non-Custodial Wallet',
    subtitle: 'Your keys, your tokens',
    desc: 'Tokens arrive directly in your embedded Robinhood wallet with real-time portfolio tracking.',
    icon: '🔐',
    badge: 'Step 5 • Portfolio',
    previewText: 'Portfolio Updated: +12,500.00 TOKEN',
    previewSubtext: 'Holding active • Ready to instant sell',
    previewIcon: '🪙',
  },
  {
    id: 5,
    stepNumber: '06',
    title: 'Telegram Bot & Mobile Alerts',
    subtitle: 'Real-time Telegram Command Center',
    desc: 'Receive instant alerts on snipe events, check balances with /balance, and add targets directly on Telegram.',
    icon: '🤖',
    badge: 'Step 6 • Telegram',
    previewText: 'Telegram Alert: CA Detected & Sniped!',
    previewSubtext: 'Bought 0.005 ETH • Tx: Blockscout Verified',
    previewIcon: '📱',
  },
]

export default function HowItWorksAnimation() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-advance step every 3 seconds
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [isPaused])

  const current = STEPS[activeStep]

  return (
    <div
      className="w-full flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl relative overflow-hidden text-left select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title & Animated Progress Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase font-mono">
            How It Works
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeStep
                  ? 'w-6 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  : 'w-2 bg-zinc-800 hover:bg-zinc-600'
              }`}
              title={`Step ${s.stepNumber}: ${s.title}`}
            />
          ))}
        </div>
      </div>

      {/* Step Stepper Visual Dots */}
      <div className="grid grid-cols-6 gap-1.5">
        {STEPS.map((s, idx) => {
          const isActive = idx === activeStep
          const isDone = idx < activeStep
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(idx)}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-md shadow-red-950/40 scale-105'
                  : isDone
                  ? 'bg-zinc-950 border-white/[0.1] text-zinc-300'
                  : 'bg-zinc-950/40 border-white/[0.04] text-zinc-600'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.stepNumber}</span>
            </button>
          )
        })}
      </div>

      {/* Animated Active Step Card */}
      <div
        key={activeStep}
        className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-xl bg-zinc-950/90 border border-red-500/25 shadow-lg relative overflow-hidden transition-all duration-300 animate-fadeIn"
      >
        {/* Step Badge & Icon */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 font-mono">
            {current.badge}
          </span>
          <span className="text-xl">{current.icon}</span>
        </div>

        {/* Step Titles */}
        <div>
          <h3 className="text-sm font-bold text-zinc-100">{current.title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{current.desc}</p>
        </div>

        {/* Live Step Simulation Terminal Box */}
        <div className="flex items-center gap-2.5 bg-black/90 border border-white/[0.08] p-2.5 rounded-lg text-xs font-mono">
          <span className="text-sm flex-shrink-0">{current.previewIcon}</span>
          <div className="flex flex-col truncate">
            <span className="text-zinc-200 font-semibold text-[11px] truncate">
              {current.previewText}
            </span>
            <span className="text-zinc-500 text-[10px] truncate">{current.previewSubtext}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
