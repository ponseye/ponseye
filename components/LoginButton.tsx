'use client'

import { useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from './ui/Button'

export default function LoginButton() {
  const router = useRouter()
  const { authenticated } = usePrivy()
  const [loading, setLoading] = useState(false)

  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
        window.location.replace('/dashboard')
      }
    },
    onError: (err) => {
      console.error('Login error:', err)
      setLoading(false)
    },
  })

  useEffect(() => {
    if (authenticated && typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
      window.location.replace('/dashboard')
    }
  }, [authenticated])

  const handleLogin = async () => {
    try {
      setLoading(true)
      await initOAuth({ provider: 'twitter' })
    } catch (err) {
      console.error('Login error:', err)
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      loading={loading}
      onClick={handleLogin}
      className="w-full gap-3 bg-black hover:bg-gray-900 border border-gray-700 text-white text-base"
    >
      {!loading && (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.859L1.506 2.25h6.953l4.256 5.625 5.529-5.625Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )}
      Continue with X
    </Button>
  )
}
