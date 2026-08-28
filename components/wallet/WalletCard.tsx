'use client'

import { useWallet } from '@/hooks/useWallet'
import { activeChain } from '@/lib/chains'
import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { createPublicClient, http, erc20Abi, formatEther, encodeFunctionData, getAddress } from 'viem'
import { useSendTransaction, useExportWallet } from '@privy-io/react-auth'

interface WalletCardProps {
  onSend: () => void
  onReceive: () => void
  onSwap: () => void
}

const WETH_ADDR = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73' as `0x${string}`

const WETH_ABI = [
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wad', type: 'uint256' }],
    outputs: [],
  },
] as const

export default function WalletCard({ onSend, onReceive, onSwap }: WalletCardProps) {
  const { address, balance, creatingWallet, createWallet, refetchBalance, embeddedWallet } = useWallet()
  const { sendTransaction } = useSendTransaction()
  const { exportWallet } = useExportWallet()
  const [copying, setCopying] = useState(false)

  const [wethBalanceRaw, setWethBalanceRaw] = useState<bigint>(0n)
  const [wethBalanceFormatted, setWethBalanceFormatted] = useState<string>('0')
  const [unwrapping, setUnwrapping] = useState(false)

  const fetchWethBalance = useCallback(async () => {
    if (!address) return
    try {
      const pubClient = createPublicClient({ chain: activeChain, transport: http('https://robinhood-rpc.publicnode.com') })
      const bal = await pubClient.readContract({
        address: WETH_ADDR,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [getAddress(address)],
      })
      setWethBalanceRaw(bal)
      const formatted = formatEther(bal)
      setWethBalanceFormatted(parseFloat(formatted) < 0.0001 && bal > 0n ? formatted.slice(0, 8) : parseFloat(formatted).toFixed(4))
    } catch { /* ignore */ }
  }, [address])

  useEffect(() => {
    const t = setTimeout(() => { fetchWethBalance() }, 0)
    const interval = setInterval(fetchWethBalance, 5000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [fetchWethBalance])

  async function handleUnwrapWeth() {
    if (!address || wethBalanceRaw === 0n || !embeddedWallet) return
    setUnwrapping(true)
    try {
      await embeddedWallet.switchChain(activeChain.id)
      const data = encodeFunctionData({
        abi: WETH_ABI,
        functionName: 'withdraw',
        args: [wethBalanceRaw],
      })
      await sendTransaction({
        to:       WETH_ADDR,
        data,
        chainId:  activeChain.id,
        gasLimit: 300000n,
      })
      toast.success('✅ Successfully unwrapped WETH to Native ETH!')
      await Promise.all([refetchBalance(), fetchWethBalance()])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed'
      if (msg.includes('cancel') || msg.includes('reject')) {
        toast.error('Unwrap canceled.')
      } else {
        toast.error(`❌ ${msg.slice(0, 100)}`)
      }
    } finally {
      setUnwrapping(false)
    }
  }

  async function copyAddress() {
    if (!address) return
    setCopying(true)
    await navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard!')
    setTimeout(() => setCopying(false), 1500)
  }

  const explorerUrl = `${activeChain.blockExplorers.default.url}/address/${address}`

  return (
    <div className="rounded-3xl bg-[#09090b]/90 backdrop-blur-xl border border-white/[0.08] shadow-2xl p-4 sm:p-7 w-full relative overflow-hidden">
      {/* Subtle background red glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header status */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-zinc-950 border border-white/[0.08] rounded-full px-2.5 sm:px-3 py-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Robinhood Chain
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950 border border-white/[0.08] rounded-full px-2.5 sm:px-3 py-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Live Sync
        </span>
      </div>

      {/* WETH Auto-Unwrap Banner if user holds WETH */}
      {wethBalanceRaw > 0n && (
        <div className="mb-4 sm:mb-5 bg-zinc-950 border border-red-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl text-red-400">⚡</span>
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Detected <span className="text-red-400 font-mono font-bold">{wethBalanceFormatted} WETH</span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Unwrap to combine directly into your Native ETH balance
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="accent"
            loading={unwrapping}
            onClick={handleUnwrapWeth}
            className="text-xs font-semibold py-2 px-3.5 w-full sm:w-auto flex-shrink-0"
          >
            Unwrap to ETH
          </Button>
        </div>
      )}

      {/* Native ETH Balance */}
      <div className="mb-4 sm:mb-6 bg-zinc-950 p-4 sm:p-6 rounded-2xl border border-white/[0.07] relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Native ETH Balance
          </span>
          <span className="text-[10px] sm:text-[11px] text-red-400/90 font-mono uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
            Layer-2 Orbit
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <span className="text-3xl sm:text-5xl font-extrabold text-zinc-100 tracking-tight font-mono break-all">
            {balance ? balance.formatted : '0.000000'}
          </span>
          <span className="text-base sm:text-lg text-red-500 font-bold font-mono">ETH</span>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mb-5 sm:mb-6">
        <p className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1.5 sm:mb-2">
          Account Address
        </p>
        {address ? (
          <div className="flex flex-col gap-2">
            <code
              className="text-[11px] sm:text-xs font-mono text-zinc-300 bg-zinc-950 border border-white/[0.08] rounded-xl px-3.5 py-2.5 w-full overflow-hidden text-ellipsis select-all"
              title={address}
            >
              {address}
            </code>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={copyAddress}
                disabled={copying}
                className="py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer"
                title="Copy Full Address"
              >
                {copying ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-red-400 font-mono">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1 text-[11px] font-medium"
                title="View on Explorer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Explorer</span>
              </a>
              <button
                onClick={() => exportWallet()}
                className="py-2 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-amber-300 transition-all flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer"
                title="Export Private Key (Self-Custody)"
              >
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-zinc-950 border border-white/[0.08] rounded-xl p-3.5">
            <span className="text-xs text-zinc-400">
              {creatingWallet ? 'Generating on-chain wallet...' : 'Wallet not yet created'}
            </span>
            <Button
              size="sm"
              loading={creatingWallet}
              onClick={() => createWallet()}
              variant="primary"
            >
              {creatingWallet ? 'Creating...' : 'Create Wallet'}
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons: Send, Receive, Swap */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Button
          onClick={onSend}
          variant="secondary"
          className="w-full gap-1.5 sm:gap-2 py-3 text-xs sm:text-sm font-semibold"
          disabled={!address}
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Send
        </Button>
        <Button
          onClick={onReceive}
          variant="secondary"
          className="w-full gap-1.5 sm:gap-2 py-3 text-xs sm:text-sm font-semibold"
          disabled={!address}
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Receive
        </Button>
        <Button
          onClick={onSwap}
          variant="primary"
          className="w-full gap-1.5 sm:gap-2 py-3 text-xs sm:text-sm font-semibold"
          disabled={!address}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap
        </Button>
      </div>
    </div>
  )
}
