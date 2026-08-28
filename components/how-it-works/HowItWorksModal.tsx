'use client'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface HowItWorksModalProps {
  open: boolean
  onClose: () => void
}

export default function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  const steps = [
    {
      step: '01',
      title: 'Target Alpha & KOL Accounts',
      desc: 'Specify Twitter/X usernames that publish early token calls. Customize the default purchase amount in Native ETH for each target.',
      icon: '🎯',
    },
    {
      step: '02',
      title: 'Real-Time Post Ingestion',
      desc: 'The engine continuously monitors incoming tweets via Twitter API v2 in real-time.',
      icon: '📡',
    },
    {
      step: '03',
      title: 'Sub-Millisecond EVM CA Parsing',
      desc: 'Every tweet is parsed by high-speed regex to immediately identify valid Robinhood Chain contract addresses (0x...).',
      icon: '⚡',
    },
    {
      step: '04',
      title: 'Universal Multi-DEX Execution',
      desc: 'Automatically routes swaps across Pons V2 bonding curves and SushiSwap V3 pools with automatic unwrapping to Native ETH on sells.',
      icon: '🚀',
    },
    {
      step: '05',
      title: 'Non-Custodial & 100% Private',
      desc: 'All target watchlists, trade history, and private keys remain isolated to your embedded wallet account.',
      icon: '🔒',
    },
    {
      step: '06',
      title: 'Telegram Bot & Mobile Alerts',
      desc: 'Link your Telegram Bot token to get real-time snipe notifications, balance queries (/balance), and remote target control (/add).',
      icon: '🤖',
    },
  ]

  return (
    <Modal open={open} onClose={onClose} title="How PONSEYE Works">
      <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
              Robinhood Chain (4663)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-zinc-300 border border-white/[0.08] font-mono">
              Non-Custodial
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            PONSEYE provides automated token sniping, portfolio management, and universal DEX routing directly on Robinhood Chain.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-black border border-white/[0.08] flex items-center justify-center text-sm flex-shrink-0">
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-red-500">
                    {s.step}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-100">{s.title}</h4>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} variant="primary" className="w-full mt-2">
          Got It, Return to Terminal
        </Button>
      </div>
    </Modal>
  )
}
