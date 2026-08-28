'use client'

import { useState } from 'react'
import { isAddress, parseEther } from 'viem'
import { useWallet } from '@/hooks/useWallet'
import { useSendTransaction } from '@privy-io/react-auth'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { activeChain } from '@/lib/chains'

interface SendModalProps {
  open: boolean
  onClose: () => void
}

export default function SendModal({ open, onClose }: SendModalProps) {
  const { balance, refetchBalance } = useWallet()
  const { sendTransaction } = useSendTransaction()

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)

  const isValidAddress = isAddress(to)
  const isValidAmount = parseFloat(amount) > 0 && !isNaN(parseFloat(amount))
  const hasEnoughBalance =
    balance && parseFloat(amount) <= parseFloat(balance.formatted)

  const canSend = isValidAddress && isValidAmount && hasEnoughBalance && !sending

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      await sendTransaction({
        to:       to as `0x${string}`,
        value:    parseEther(amount),
        chainId:  activeChain.id,
        gasLimit: 100000n,
      })
      toast.success('ETH transaction successfully sent!')
      await refetchBalance()
      handleClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      if (
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('reject') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('aborted')
      ) {
        toast.error('Transaction canceled.')
      } else {
        toast.error(msg.slice(0, 100))
      }
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    setTo('')
    setAmount('')
    onClose()
  }

  function setMax() {
    if (balance) {
      const maxEth = Math.max(0, parseFloat(balance.formatted) - 0.0005)
      setAmount(maxEth > 0 ? maxEth.toFixed(4) : '0')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Send ETH — Robinhood Chain">
      <div className="flex flex-col gap-4">
        {/* Network indicator */}
        <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-white/[0.08]">
          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Robinhood Chain Mainnet
          </span>
          {balance && (
            <span className="font-mono text-zinc-400">
              Balance: <strong className="text-zinc-100">{parseFloat(balance.formatted).toFixed(4)} ETH</strong>
            </span>
          )}
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Recipient Address
          </label>
          <input
            type="text"
            placeholder="0x... (Robinhood Chain address)"
            value={to}
            onChange={(e) => setTo(e.target.value.trim())}
            className="w-full bg-zinc-950 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
          />
          {to && !isValidAddress && (
            <p className="text-xs text-red-400 mt-1">Invalid Ethereum / Robinhood address</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300">Amount (ETH)</label>
            <button
              type="button"
              onClick={setMax}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-0.5 rounded bg-red-500/10 font-mono"
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="any"
              min="0"
              className="w-full bg-zinc-950 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500/50 pr-16 transition-all font-mono"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
              ETH
            </span>
          </div>
          {amount && !hasEnoughBalance && (
            <p className="text-xs text-red-400 mt-1">Insufficient ETH balance</p>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!canSend}
            loading={sending}
          >
            {sending ? 'Awaiting Wallet...' : 'Send ETH'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
