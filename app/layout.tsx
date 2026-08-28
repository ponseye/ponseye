import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import SparkleBackground from '@/components/ui/SparkleBackground'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ponseye.com'),
  title: 'PONSEYE — Robinhood Chain',
  description: 'PONSEYE — High-speed token sniping, portfolio management, and universal DEX routing on Robinhood Chain.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#060608] text-zinc-100 antialiased selection:bg-red-500/20 selection:text-red-300 relative overflow-x-hidden">
        {/* Ambient Crimson Gradient & Sparkling Particles Background */}
        <SparkleBackground />

        {/* App Content */}
        <div className="relative z-10 flex flex-col flex-1">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  )
}