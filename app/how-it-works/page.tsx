'use client'

export const dynamic = 'force-dynamic'

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import HowItWorksView from '@/components/how-it-works/HowItWorksView'
import Footer from '@/components/Footer'
import Spinner from '@/components/ui/Spinner'

export default function HowItWorksPage() {
  const { authenticated, ready, logout } = usePrivy()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/')
    }
  }, [ready, authenticated, router])

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    router.push('/')
  }

  if (!ready || !authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-transparent">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-zinc-100">
      <Navbar onLogout={handleLogout} loggingOut={loggingOut} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <HowItWorksView
          onGoToDashboard={() => router.push('/dashboard')}
          onGoToWallet={() => router.push('/dashboard')}
        />
      </main>

      <Footer />
    </div>
  )
}
