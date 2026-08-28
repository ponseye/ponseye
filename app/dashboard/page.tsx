'use client'

export const dynamic = 'force-dynamic'

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import TwitterFeed from '@/components/dashboard/TwitterFeed'
import WalletCard from '@/components/wallet/WalletCard'
import TokenList from '@/components/wallet/TokenList'
import SendModal from '@/components/wallet/SendModal'
import ReceiveModal from '@/components/wallet/ReceiveModal'
import SwapModal from '@/components/wallet/SwapModal'
import TelegramModal from '@/components/telegram/TelegramModal'
import FullscreenIntro from '@/components/landing/FullscreenIntro'
import Footer from '@/components/Footer'
import Spinner from '@/components/ui/Spinner'

export default function DashboardPage() {
  const { authenticated, ready, logout } = usePrivy()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  // Fullscreen cinematic intro state: always starts true on refresh when user is not logged in
  const [showIntro, setShowIntro] = useState(true)

  // Wallet & Integration Modal States
  const [sendOpen, setSendOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [selectedSwapCa, setSelectedSwapCa] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (ready && authenticated) {
      setShowIntro(false)
    }
  }, [ready, authenticated])

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  function handleCompleteIntro() {
    setShowIntro(false)
  }

  function handleOpenSwapWithToken(ca?: string) {
    setSelectedSwapCa(ca)
    setSwapOpen(true)
  }

  function handleCloseSwap() {
    setSwapOpen(false)
    setSelectedSwapCa(undefined)
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-transparent">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      {/* 1. Fullscreen Cinematic Intro (Starts from the beginning on refresh when not logged in) */}
      {showIntro && !authenticated && (
        <FullscreenIntro onComplete={handleCompleteIntro} />
      )}

      {/* 2. Main Terminal Dashboard */}
      <div className="flex flex-col min-h-screen bg-transparent text-zinc-100 animate-fadeIn">
        {/* Header Navigation with Login button for guests */}
        <Navbar
          onLogout={handleLogout}
          loggingOut={loggingOut}
          onOpenTelegram={() => setTelegramOpen(true)}
        />

      {/* Unified Split-Screen Main Terminal */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-8 items-start w-full">
          {/* Left Column: Sniper Engine (Target Accounts + Live Posts & CA Detector) */}
          <div className="xl:col-span-7 2xl:col-span-7 w-full">
            <TwitterFeed
              onOpenSwap={(tokenCa) => handleOpenSwapWithToken(tokenCa)}
              onOpenTelegram={() => setTelegramOpen(true)}
            />
          </div>

          {/* Right Column: Wallet (Top) + Scrollable Portfolio (Bottom) */}
          <div className="xl:col-span-5 2xl:col-span-5 w-full flex flex-col gap-5 sm:gap-6 xl:sticky xl:top-24">
            {/* Right Top: Wallet Card */}
            <WalletCard
              onSend={() => setSendOpen(true)}
              onReceive={() => setReceiveOpen(true)}
              onSwap={() => handleOpenSwapWithToken()}
            />

            {/* Right Bottom: Token Holdings (Scrollable List) */}
            <TokenList onQuickSwap={(tokenCa) => handleOpenSwapWithToken(tokenCa)} />
          </div>
        </div>
      </main>

      {/* Footer with Copyright & How It Works */}
      <Footer />

      {/* Modals */}
      <SendModal open={sendOpen} onClose={() => setSendOpen(false)} />
      <ReceiveModal open={receiveOpen} onClose={() => setReceiveOpen(false)} />
      <SwapModal open={swapOpen} onClose={handleCloseSwap} initialCa={selectedSwapCa} />
      <TelegramModal open={telegramOpen} onClose={() => setTelegramOpen(false)} />
    </div>
    </>
  )
}
