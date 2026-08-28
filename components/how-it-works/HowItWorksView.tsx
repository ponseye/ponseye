'use client'

import Button from '@/components/ui/Button'

interface HowItWorksViewProps {
  onGoToDashboard: () => void
  onGoToWallet: () => void
}

export default function HowItWorksView({
  onGoToDashboard,
  onGoToWallet,
}: HowItWorksViewProps) {
  const steps = [
    {
      step: '01',
      title: 'Target X / Twitter Alpha Accounts',
      desc: 'Add usernames of accounts that share early token launches or contract addresses (e.g. @elonmusk, crypto KOLs). Specify your default purchase amount in Native ETH.',
      icon: '🎯',
    },
    {
      step: '02',
      title: 'Automated Post Monitoring',
      desc: 'The system continuously monitors the latest posts from your target watchlist via Twitter API v2 in real-time.',
      icon: '📡',
    },
    {
      step: '03',
      title: 'Contract Address (CA) Detection',
      desc: 'Every incoming tweet is analyzed by a fast EVM parser. When a valid token contract address (0x...) is detected, the CA is extracted within milliseconds.',
      icon: '⚡',
    },
    {
      step: '04',
      title: 'Instant On-Chain Execution',
      desc: 'Executes the DEX swap directly on Robinhood Chain via your non-custodial embedded wallet with zero manual latency.',
      icon: '🚀',
    },
    {
      step: '05',
      title: '100% Private & Isolated',
      desc: 'Your configured targets, custom token watchlists, and transaction histories are isolated to your account.',
      icon: '🔒',
    },
    {
      step: '06',
      title: 'Telegram Bot & Real-Time Mobile Alerts',
      desc: 'Link your personal Telegram Bot to receive instant notifications when tokens are sniped, check on-chain balances with /balance, and add or manage target accounts on the go.',
      icon: '🤖',
    },
  ]

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-[#09090b] border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
            Robinhood Chain L2
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-300 border border-white/[0.08] font-mono">
            Non-Custodial
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          How PONS<span className="text-red-500">EYE</span> Works
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed">
          The fastest non-custodial token sniping and portfolio management platform on Robinhood Chain. Monitor crypto alpha and execute instant DEX swaps the moment contracts are posted.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={onGoToDashboard} variant="primary" className="gap-2 text-xs sm:text-sm">
            Open Dashboard Feed ➔
          </Button>
          <Button onClick={onGoToWallet} variant="secondary" className="gap-2 text-xs sm:text-sm">
            View My Wallet
          </Button>
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-zinc-200">System Workflow:</h2>
        <div className="grid grid-cols-1 gap-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex items-start gap-4 p-5 rounded-2xl bg-[#09090b] border border-white/[0.07] hover:border-white/[0.12] transition-colors shadow-lg"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-white/[0.08] flex items-center justify-center text-xl flex-shrink-0">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-red-500">
                    Step {s.step}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100">{s.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
