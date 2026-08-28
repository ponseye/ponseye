'use client'

import { usePrivy, useLoginWithOAuth } from '@privy-io/react-auth'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { useState } from 'react'

interface NavbarProps {
  onLogout: () => void
  loggingOut?: boolean
  onOpenTelegram?: () => void
}

export default function Navbar({
  onLogout,
  loggingOut = false,
  onOpenTelegram,
}: NavbarProps) {
  const { user, authenticated } = usePrivy()
  const [loggingIn, setLoggingIn] = useState(false)

  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => {
      setLoggingIn(false)
    },
    onError: (err) => {
      console.error('Login error:', err)
      setLoggingIn(false)
    },
  })

  const handleLogin = async () => {
    try {
      setLoggingIn(true)
      await initOAuth({ provider: 'twitter' })
    } catch (err) {
      console.error('Login error:', err)
      setLoggingIn(false)
    }
  }

  const twitterAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'twitter_oauth'
  ) as { username?: string } | undefined

  const displayName = twitterAccount?.username
    ? `@${twitterAccount.username}`
    : user?.email?.address ?? 'User'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050807]/75 backdrop-blur-xl">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden shadow-lg shadow-emerald-950/50 border border-emerald-500/30 group-hover:scale-105 transition-transform flex items-center justify-center bg-black relative flex-shrink-0">
            <Image src="/logo.svg" alt="PONSEYE" width={32} height={32} className="object-cover" priority />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
            PONS<span className="text-emerald-400">EYE</span>
          </span>
        </Link>

        {/* Center: Network Info */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/60 px-3 py-1 rounded-full border border-white/[0.06] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Robinhood Chain (4663)</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {authenticated ? (
            <>
              {/* Telegram Bot Button */}
              {onOpenTelegram && (
                <button
                  onClick={onOpenTelegram}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/[0.08] hover:border-emerald-500/40 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm group backdrop-blur-md"
                  title="Configure Telegram Bot Token & Alerts"
                >
                  <svg className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                  </svg>
                  <span className="hidden sm:inline font-mono">Telegram Bot</span>
                </button>
              )}

              <span className="text-xs text-zinc-400 font-mono hidden md:inline bg-zinc-900/60 px-2.5 py-1.5 rounded-xl border border-white/[0.08] backdrop-blur-md">
                {displayName}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                loading={loggingOut}
                className="text-zinc-400 hover:text-emerald-300 px-2.5 sm:px-3 py-1.5 text-xs"
                title="Sign Out"
              >
                {!loggingOut && (
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                <span>Sign Out</span>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleLogin}
              loading={loggingIn}
              className="gap-2 text-xs font-bold py-2 px-3.5 sm:px-4 shadow-lg shadow-emerald-950/40"
            >
              {!loggingIn && (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.859L1.506 2.25h6.953l4.256 5.625 5.529-5.625Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
              <span>Log in with X</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
