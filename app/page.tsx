'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import LoginButton from '@/components/LoginButton'
import Spinner from '@/components/ui/Spinner'
import FullscreenIntro from '@/components/landing/FullscreenIntro'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { authenticated, ready } = usePrivy()
  const router = useRouter()

  // Fullscreen cinematic intro state (only show once per session for guest users)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true
    return !sessionStorage.getItem('ponseye_intro_seen')
  })

  useEffect(() => {
    if (ready && authenticated) {
      setShowIntro(false)
      if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
        window.location.replace('/dashboard')
      }
    }
  }, [ready, authenticated])

  function handleCompleteIntro() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ponseye_intro_seen', 'true')
    }
    setShowIntro(false)
  }

  if (ready && authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-transparent gap-3">
        <Spinner size="lg" />
        <span className="text-xs font-mono text-zinc-400">Loading your dashboard...</span>
      </div>
    )
  }

  return (
    <>
      {/* 1. Fullscreen Cinematic Step-by-Step Intro */}
      {showIntro && !authenticated && (
        <FullscreenIntro onComplete={handleCompleteIntro} />
      )}

      {/* 2. Main Minimalist Login Card (Revealed after intro) */}
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-transparent px-4 py-8 relative">
        <main className="relative flex flex-col items-center gap-7 w-full max-w-sm text-center p-7 sm:p-8 rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-red-950/30 animate-fadeIn">
          {/* Logo / Branding */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-red-950/60 border border-red-500/30 flex items-center justify-center bg-black relative">
              <Image src="/icon.png" alt="PONSEYE" width={80} height={80} className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                PONS<span className="text-red-500">EYE</span>
              </h1>
              <p className="text-zinc-400 text-xs font-mono mt-0.5 tracking-wider">Robinhood Chain (4663)</p>
            </div>
          </div>

          {/* Login with X Action */}
          <div className="w-full flex flex-col gap-3">
            <LoginButton />
          </div>
        </main>
      </div>
    </>
  )
}
