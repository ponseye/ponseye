'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ReceiveModalProps {
  open: boolean
  onClose: () => void
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

export default function ReceiveModal({ open, onClose }: ReceiveModalProps) {
  const { address } = useWallet()
  const [copying, setCopying] = useState(false)

  async function copyAddress() {
    if (!address) return
    setCopying(true)
    await navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard!')
    setTimeout(() => setCopying(false), 1500)
  }

  return (
    <Modal open={open} onClose={onClose} title="Receive Assets — Robinhood Chain">
      <div className="flex flex-col items-center gap-5">
        {/* QR Code */}
        <div className="p-3.5 bg-white rounded-2xl shadow-xl border border-white/20">
          {address ? (
            <QRCodeSVG
              value={address}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          ) : (
            <div className="w-[180px] h-[180px] flex items-center justify-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-zinc-300 border-t-red-500" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-zinc-400 text-xs text-center leading-relaxed">
          Scan the QR code or copy your address to receive Native ETH and tokens on Robinhood Chain.
        </p>

        {/* Address */}
        {address && (
          <div className="w-full">
            <p className="text-[11px] text-zinc-400 mb-1.5 text-center uppercase tracking-wider font-semibold">
              Account Address
            </p>
            <div className="flex items-center gap-2 bg-zinc-950 rounded-xl p-3 border border-white/[0.08]">
              <code className="text-xs font-mono text-zinc-300 flex-1 break-all text-center">
                {shortenAddress(address)}
              </code>
              <button
                onClick={copyAddress}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                title="Copy Address"
              >
                {copying ? (
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        <Button onClick={onClose} variant="secondary" className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  )
}
