'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// PrivyProvider & WagmiProvider hanya bisa berjalan di sisi client
// ssr: false memastikan tidak dieksekusi saat build/prerender
const Providers = dynamic(() => import('@/components/Providers'), { ssr: false })

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>
}
