'use client'

import { useWallets, usePrivy, useCreateWallet, getEmbeddedConnectedWallet } from '@privy-io/react-auth'
import { parseEther, createWalletClient, custom, type Hash } from 'viem'
import { activeChain } from '@/lib/chains'
import { useEffect, useState, useCallback, useRef } from 'react'

export function useWallet() {
  const { wallets } = useWallets()
  const { user, authenticated, ready } = usePrivy()
  const { createWallet } = useCreateWallet()
  const [sending, setSending] = useState(false)
  const [creatingWallet, setCreatingWallet] = useState(false)
  const [txHash, setTxHash] = useState<Hash | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Saldo state (fetch dari server-side API agar tidak kena rate-limit RPC)
  const [balanceEth, setBalanceEth] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  // 1. Cari embedded connected wallet
  const embeddedWallet =
    getEmbeddedConnectedWallet(wallets) ??
    wallets.find((w) => w.walletClientType === 'privy') ??
    wallets[0]

  // 2. Ambil address dari berbagai sumber Privy
  const userWalletAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'wallet' && (a as { walletClientType?: string }).walletClientType === 'privy'
  ) as { address?: string } | undefined

  const fallbackAddress =
    user?.wallet?.address ??
    userWalletAccount?.address ??
    (user?.linkedAccounts?.find((a) => a.type === 'wallet') as { address?: string } | undefined)?.address

  const address = (embeddedWallet?.address ?? fallbackAddress) as `0x${string}` | undefined

  const createWalletAttempted = useRef(false)

  // 3. Jika user login tapi belum punya wallet, otomatis buat wallet (hanya dipanggil 1x)
  useEffect(() => {
    if (ready && authenticated && !address && !createWalletAttempted.current) {
      createWalletAttempted.current = true
      setCreatingWallet(true)
      createWallet()
        .catch((err) => {
          console.error('Auto create wallet error:', err)
        })
        .finally(() => {
          setCreatingWallet(false)
        })
    }
  }, [ready, authenticated, address, createWallet])

  // 4. Fetch balance dari server-side API (hindari RPC rate-limit & CORS)
  const refetchBalance = useCallback(async () => {
    if (!address) return
    setBalanceLoading(true)
    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (res.ok) {
        const data = await res.json()
        setBalanceEth(data.balanceEth ?? '0.00000000')
      }
    } catch (e) {
      console.error('Balance fetch error:', e)
    } finally {
      setBalanceLoading(false)
    }
  }, [address])

  // Auto-fetch balance saat address tersedia, polling tiap 5 detik, dan auto-refresh saat window focus
  useEffect(() => {
    if (!address) return

    const timeout = setTimeout(() => { refetchBalance() }, 0)
    const interval = setInterval(() => { refetchBalance() }, 5000)

    const handleFocus = () => { refetchBalance() }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetchBalance()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [address, refetchBalance])

  /**
   * Kirim ETH ke alamat tujuan (to) dengan jumlah `amount`.
   * Menggunakan viem walletClient langsung — bypass popup UI Privy sepenuhnya.
   */
  async function sendEth(to: string, amount: string): Promise<Hash> {
    if (!embeddedWallet) throw new Error('No embedded wallet found')
    setSending(true)
    setError(null)
    setTxHash(null)

    try {
      // Paksa switch ke Robinhood Chain Mainnet
      await embeddedWallet.switchChain(activeChain.id)
      const provider = await embeddedWallet.getEthereumProvider()

      // Gunakan viem walletClient langsung — bypass semua popup Privy
      const client = createWalletClient({
        chain: activeChain,
        transport: custom(provider),
      })

      const [account] = await client.getAddresses()
      const hash = await client.sendTransaction({
        account,
        to: to as `0x${string}`,
        value: parseEther(amount),
        gas: BigInt(50_000),
      })

      setTxHash(hash)
      // Refresh balance setelah transaksi
      setTimeout(() => refetchBalance(), 3000)
      return hash
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaksi gagal'
      setError(msg)
      throw err
    } finally {
      setSending(false)
    }
  }

  const balance = balanceEth !== null
    ? {
        formatted: balanceEth,
        symbol: 'ETH',
        value: BigInt(0), // placeholder for compatibility
        decimals: 18,
      }
    : undefined

  return {
    address,
    balance,
    balanceLoading,
    sending,
    creatingWallet,
    txHash,
    error,
    sendEth,
    createWallet,
    refetchBalance,
    user,
    embeddedWallet,
  }
}
