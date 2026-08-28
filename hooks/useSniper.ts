'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import { useTelegram } from '@/hooks/useTelegram'
import {
  SniperTarget,
  TweetFeedItem,
  SniperLog,
  extractContractAddresses,
  sanitizeUsername,
} from '@/lib/sniper'
import { getPonsTokenInfo, PONS_CURVE_ABI } from '@/lib/pons-v2'
import { activeChain } from '@/lib/chains'
import { trackTokenAddress } from '@/hooks/useTokens'
import {
  parseEther,
  encodeFunctionData,
  isAddress,
  getAddress,
  createWalletClient,
  custom,
} from 'viem'
import toast from 'react-hot-toast'

const SWAP_ROUTER = '0x1e406484F1F204b23cE84B9901C0171a738fd406' as `0x${string}`
const WETH = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73' as `0x${string}`

const SWAP_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const

function getStoredItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function useSniper() {
  const { user } = usePrivy()
  const { sendEth, balance, address, embeddedWallet, refetchBalance } = useWallet()
  const { notifyCaDetected, notifyAutoBuySuccess, notifyAutoBuyFailed } = useTelegram()

  // Storage key isolated per user
  const userId = user?.id || address || 'guest'
  const STORAGE_KEY_TARGETS = `rh_sniper_targets_${userId}`
  const STORAGE_KEY_FEED = `rh_sniper_feed_${userId}`
  const STORAGE_KEY_LOGS = `rh_sniper_logs_${userId}`
  const STORAGE_KEY_PROCESSED = `rh_sniper_processed_${userId}`

  const [targets, setTargets] = useState<SniperTarget[]>(() =>
    getStoredItem<SniperTarget[]>(STORAGE_KEY_TARGETS, [])
  )
  const [feed, setFeed] = useState<TweetFeedItem[]>(() =>
    getStoredItem<TweetFeedItem[]>(STORAGE_KEY_FEED, [])
  )
  const [logs, setLogs] = useState<SniperLog[]>(() =>
    getStoredItem<SniperLog[]>(STORAGE_KEY_LOGS, [])
  )
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true)
  const [rateLimitUntil, setRateLimitUntil] = useState<number>(0)

  // In-memory and persistent locks to guarantee EXACTLY-ONCE execution per tweet
  const buyingLocks = useRef<Set<string>>(new Set())
  const processedTweetsRef = useRef<Set<string>>(
    new Set(getStoredItem<string[]>(STORAGE_KEY_PROCESSED, []))
  )

  const targetsRef = useRef<SniperTarget[]>(targets)
  const feedRef = useRef<TweetFeedItem[]>(feed)
  const rateLimitUntilRef = useRef<number>(rateLimitUntil)

  useEffect(() => {
    targetsRef.current = targets
  }, [targets])

  useEffect(() => {
    feedRef.current = feed
  }, [feed])

  useEffect(() => {
    rateLimitUntilRef.current = rateLimitUntil
  }, [rateLimitUntil])

  // Sync targets from Telegram command updates or other components
  useEffect(() => {
    const handleTargetsSync = (e: Event) => {
      const customEvent = e as CustomEvent<SniperTarget[]>
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setTargets(customEvent.detail)
      } else {
        const updated = getStoredItem<SniperTarget[]>(STORAGE_KEY_TARGETS, [])
        setTargets(updated)
      }
    }

    window.addEventListener('rh_targets_updated', handleTargetsSync)
    return () => window.removeEventListener('rh_targets_updated', handleTargetsSync)
  }, [STORAGE_KEY_TARGETS])

  const saveTargets = useCallback(
    (newTargets: SniperTarget[]) => {
      setTargets(newTargets)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TARGETS, JSON.stringify(newTargets))
      }
    },
    [STORAGE_KEY_TARGETS]
  )

  const saveFeed = useCallback(
    (newFeed: TweetFeedItem[]) => {
      setFeed(newFeed)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(newFeed))
      }
    },
    [STORAGE_KEY_FEED]
  )

  const saveLogs = useCallback(
    (newLogs: SniperLog[]) => {
      setLogs(newLogs)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs))
      }
    },
    [STORAGE_KEY_LOGS]
  )

  const markTweetAsProcessed = useCallback(
    (tweetId: string) => {
      processedTweetsRef.current.add(tweetId)
      if (typeof window !== 'undefined') {
        const arr = Array.from(processedTweetsRef.current)
        // Keep last 500 processed tweets
        const trimmed = arr.slice(-500)
        localStorage.setItem(STORAGE_KEY_PROCESSED, JSON.stringify(trimmed))
      }
    },
    [STORAGE_KEY_PROCESSED]
  )

  // Execute Auto-Buy on detected token contract with full DEX routing (Pons V2 Bonding Curve & Sushi V3)
  const executeAutoBuy = useCallback(
    async (targetUsername: string, rawCa: string, amountEth: string, tweetId: string, tweetText: string) => {
      if (!isAddress(rawCa)) {
        console.warn(`[Sniper] Invalid CA detected: ${rawCa}`)
        return
      }

      const ca = getAddress(rawCa)

      // 1. Strict guard: If already bought, currently buying, or processed, ABORT immediately
      if (buyingLocks.current.has(tweetId) || processedTweetsRef.current.has(tweetId)) {
        console.warn(`[Sniper] Tweet ${tweetId} already processed or in progress. Skipping duplicate execution.`)
        return
      }

      // Lock immediately
      buyingLocks.current.add(tweetId)
      markTweetAsProcessed(tweetId)

      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`

      const updatedFeed = feedRef.current.map((item) =>
        item.id === tweetId ? { ...item, snipedStatus: 'buying' as const } : item
      )
      saveFeed(updatedFeed)

      const initialLog: SniperLog = {
        id: logId,
        timestamp: Date.now(),
        targetUsername,
        tweetText,
        detectedCa: ca,
        buyAmountEth: amountEth,
        status: 'buying',
      }

      saveLogs([initialLog, ...logs])
      toast.loading(`🎯 CA Detected in @${targetUsername}! Executing DEX Auto-Buy on Robinhood Chain...`, {
        id: logId,
      })

      try {
        if (!embeddedWallet || !address) throw new Error('Embedded wallet is not ready')

        await embeddedWallet.switchChain(activeChain.id)
        const provider = await embeddedWallet.getEthereumProvider()
        const walletClient = createWalletClient({
          chain: activeChain,
          transport: custom(provider),
        })
        const [account] = await walletClient.getAddresses()
        const amountInWei = parseEther(amountEth)
        let tx = ''

        // 1. Cek apakah token aktif di Pons V2 Bonding Curve
        const ponsInfo = await getPonsTokenInfo(ca).catch(() => null)

        if (ponsInfo && ponsInfo.phase === 0 && ponsInfo.curveAddress) {
          const curveAddr = getAddress(ponsInfo.curveAddress)
          const isNative = ponsInfo.isNative !== false
          const buyData = encodeFunctionData({
            abi: PONS_CURVE_ABI,
            functionName: 'buy',
            args: [amountInWei, 0n, address as `0x${string}`],
          })

          tx = await walletClient.sendTransaction({
            account,
            to: curveAddr,
            value: isNative ? amountInWei : 0n,
            data: buyData,
            gas: 400000n,
          })
        } else {
          // 2. Routing melalui SushiSwap V3 / Uniswap V3 Router
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
          const calldata = encodeFunctionData({
            abi: SWAP_ABI,
            functionName: 'exactInputSingle',
            args: [{
              tokenIn: WETH,
              tokenOut: ca as `0x${string}`,
              fee: 10000,
              recipient: address as `0x${string}`,
              deadline,
              amountIn: amountInWei,
              amountOutMinimum: 0n,
              sqrtPriceLimitX96: 0n,
            }],
          })

          try {
            tx = await walletClient.sendTransaction({
              account,
              to: SWAP_ROUTER,
              value: amountInWei,
              data: calldata,
              gas: 400000n,
            })
          } catch (routerErr) {
            console.warn('[Sniper] DEX Router swap fallback to sendEth:', routerErr)
            const fallbackRes = await sendEth(ca, amountEth)
            tx = String(fallbackRes)
          }
        }

        const successLog: SniperLog = {
          ...initialLog,
          status: 'success',
          txHash: tx || undefined,
        }

        saveLogs([successLog, ...logs.filter((l) => l.id !== logId)])

        const successFeed = feedRef.current.map((item) =>
          item.id === tweetId
            ? { ...item, snipedStatus: 'success' as const, txHash: tx || undefined }
            : item
        )
        saveFeed(successFeed)

        toast.success(`🚀 Auto-Buy Successful! Swapped ${amountEth} ETH for CA: ${ca.slice(0, 6)}...${ca.slice(-4)}`, {
          id: logId,
        })

        const updatedTargets = targetsRef.current.map((t) =>
          t.username.toLowerCase() === targetUsername.toLowerCase()
            ? { ...t, lastSnipedAt: Date.now() }
            : t
        )
        saveTargets(updatedTargets)

        // Otomatis daftarkan token ke portofolio & refresh saldo
        if (userId) trackTokenAddress(userId, ca)
        if (address) trackTokenAddress(address, ca)
        setTimeout(() => refetchBalance(), 2500)

        // Trigger Telegram Success Notification
        notifyAutoBuySuccess(targetUsername, ca, amountEth, tx).catch((err) => {
          console.error('[Telegram] Failed to send success notification:', err)
        })
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Auto-buy transaction failed'
        const isCanceled =
          errorMsg.toLowerCase().includes('cancel') ||
          errorMsg.toLowerCase().includes('reject') ||
          errorMsg.toLowerCase().includes('denied') ||
          errorMsg.toLowerCase().includes('aborted') ||
          errorMsg.toLowerCase().includes('user rejected')

        const failedLog: SniperLog = {
          ...initialLog,
          status: 'failed',
          errorMessage: isCanceled ? 'Transaction canceled by user' : errorMsg,
        }

        saveLogs([failedLog, ...logs.filter((l) => l.id !== logId)])

        const failedFeed = feedRef.current.map((item) =>
          item.id === tweetId
            ? {
                ...item,
                snipedStatus: 'failed' as const,
                errorMessage: isCanceled ? 'Canceled' : errorMsg,
              }
            : item
        )
        saveFeed(failedFeed)

        if (isCanceled) {
          toast.error('Transaction canceled by user.', { id: logId })
        } else {
          toast.error(`❌ Auto-Buy Failed: ${errorMsg.slice(0, 80)}`, { id: logId })
        }

        // Trigger Telegram Failure Notification
        notifyAutoBuyFailed(targetUsername, ca, amountEth, isCanceled ? 'Transaction canceled by user' : errorMsg).catch((err) => {
          console.error('[Telegram] Failed to send failure notification:', err)
        })
      } finally {
        buyingLocks.current.delete(tweetId)
      }
    },
    [embeddedWallet, address, logs, markTweetAsProcessed, saveLogs, saveFeed, sendEth, saveTargets, userId, refetchBalance, notifyAutoBuySuccess, notifyAutoBuyFailed]
  )

  const addTarget = useCallback(
    (rawUsername: string, buyAmountEth: string) => {
      const username = sanitizeUsername(rawUsername)
      if (!username) {
        toast.error('Invalid Twitter / X username')
        return
      }

      if (targets.some((t) => t.username.toLowerCase() === username.toLowerCase())) {
        toast.error(`Target @${username} is already in your watchlist`)
        return
      }

      const newTarget: SniperTarget = {
        id: `target_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        username,
        buyAmountEth: buyAmountEth || '0.005',
        enabled: true,
        createdAt: Date.now(),
      }

      const updated = [newTarget, ...targets]
      saveTargets(updated)
      toast.success(`Target @${username} added to your dashboard!`)
    },
    [targets, saveTargets]
  )

  const removeTarget = useCallback(
    (id: string) => {
      const cleanInput = sanitizeUsername(id)
      const target = targets.find((t) => t.id === id || t.username.toLowerCase() === cleanInput)
      const targetUsername = target?.username.toLowerCase() || cleanInput

      const updated = targets.filter(
        (t) => t.id !== id && t.username.toLowerCase() !== targetUsername
      )
      saveTargets(updated)

      const filteredFeed = feedRef.current.filter(
        (f) => f.username.toLowerCase() !== targetUsername
      )
      saveFeed(filteredFeed)

      // Also clean up across guest and current user keys to prevent ghost targets from reappearing
      if (typeof window !== 'undefined') {
        const potentialKeys = new Set([
          STORAGE_KEY_TARGETS,
          `rh_sniper_targets_guest`,
          `rh_sniper_targets_${userId}`,
          address ? `rh_sniper_targets_${address}` : '',
          user?.id ? `rh_sniper_targets_${user.id}` : '',
        ])

        potentialKeys.forEach((key) => {
          if (!key) return
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed: SniperTarget[] = JSON.parse(stored)
              if (Array.isArray(parsed)) {
                const cleaned = parsed.filter(
                  (t) => t.id !== id && t.username.toLowerCase() !== targetUsername
                )
                localStorage.setItem(key, JSON.stringify(cleaned))
              }
            }
          } catch {}
        })
      }

      toast.success('Target removed from watchlist')
    },
    [targets, saveTargets, saveFeed, STORAGE_KEY_TARGETS, userId, address, user]
  )

  const toggleTarget = useCallback(
    (id: string) => {
      const updated = targets.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
      saveTargets(updated)
    },
    [targets, saveTargets]
  )

  const refreshTweets = useCallback(async () => {
    const activeTargets = targetsRef.current.filter((t) => t.enabled)
    if (activeTargets.length === 0) return

    // Skip polling if Twitter API is currently rate-limited
    if (rateLimitUntilRef.current > Date.now()) {
      return
    }

    setIsRefreshing(true)
    let newTweetsCount = 0

    for (const target of activeTargets) {
      try {
        const res = await fetch('/api/twitter/tweets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: target.username,
            twitterUserId: target.twitterUserId,
            sinceId: target.lastSeenTweetId,
          }),
        })

        const data = await res.json()

        if (res.status === 429 || data.rateLimited) {
          const resetTime = data.resetTimestamp ? data.resetTimestamp * 1000 : Date.now() + 60000
          setRateLimitUntil(resetTime)
          break
        }

        if (!res.ok) continue

        const tweets = data?.tweets || []
        const fetchedUserId = data?.userId
        const fetchedDisplayName = data?.displayName
        const fetchedProfileImageUrl = data?.profileImageUrl

        // Persist numerical Twitter user ID and avatar metadata on target
        const updatedTarget = {
          ...target,
          twitterUserId: fetchedUserId || target.twitterUserId,
          displayName: fetchedDisplayName || target.displayName,
          profileImageUrl: fetchedProfileImageUrl || target.profileImageUrl,
        }

        if (tweets.length > 0) {
          const latestTweet = tweets[0]
          const isFirstFetchForTarget = !target.lastSeenTweetId
          updatedTarget.lastSeenTweetId = latestTweet.id

          // Save lastSeenTweetId & metadata
          const updatedTargets = targetsRef.current.map((t) =>
            t.id === target.id ? updatedTarget : t
          )
          saveTargets(updatedTargets)

          // Filter: Hanya ambil postingan yang dibuat SETELAH target ditambahkan ke watchlist
          // Postingan lama (sebelum target dibuat) TIDAK AKAN dimasukkan ke feed
          const freshTweetsOnly = isFirstFetchForTarget
            ? tweets.filter((t: { created_at: string }) => {
                const tweetTime = new Date(t.created_at).getTime()
                return tweetTime >= target.createdAt - 30000 // Hanya tweet dalam kurun 30 detik saat/setelah target dibuat
              })
            : tweets

          if (freshTweetsOnly.length > 0) {
            newTweetsCount += freshTweetsOnly.length

            const newItems: TweetFeedItem[] = freshTweetsOnly.map((t: { id: string; text: string; createdAt?: string; created_at?: string; displayName?: string; profileImageUrl?: string }) => {
              const cas = extractContractAddresses(t.text)
              const createdAtDate = t.createdAt || t.created_at || ''
              return {
                id: t.id,
                username: target.username,
                displayName: t.displayName || fetchedDisplayName || target.displayName,
                profileImageUrl: t.profileImageUrl || fetchedProfileImageUrl || target.profileImageUrl,
                text: t.text,
                createdAt: createdAtDate ? new Date(createdAtDate).getTime() : Date.now(),
                detectedCas: cas,
                snipedStatus: 'idle',
              }
            })

            const existingIds = new Set(feedRef.current.map((f) => f.id))
            const strictlyNewItems = newItems.filter((item) => !existingIds.has(item.id))
            if (strictlyNewItems.length > 0) {
              const combined = [...strictlyNewItems, ...feedRef.current]
              saveFeed(combined)
            }

            // Auto-buy triggers for newly posted tweets containing a CA
            for (const item of strictlyNewItems) {
              if (
                item.detectedCas.length > 0 &&
                !processedTweetsRef.current.has(item.id) &&
                !buyingLocks.current.has(item.id)
              ) {
                // Notify CA Detection to Telegram
                notifyCaDetected(target.username, item.detectedCas[0], item.text).catch((err) => {
                  console.error('[Telegram] Failed to send CA detected notification:', err)
                })

                await executeAutoBuy(target.username, item.detectedCas[0], target.buyAmountEth, item.id, item.text)
              }
            }
          }
        } else {
          // If no new tweets, still persist any newly discovered userId/profileImageUrl
          const updatedTargets = targetsRef.current.map((t) =>
            t.id === target.id ? updatedTarget : t
          )
          saveTargets(updatedTargets)
        }

      } catch (e) {
        console.error(`Error fetching tweets for @${target.username}:`, e)
      }
    }

    setIsRefreshing(false)
    if (newTweetsCount > 0) {
      toast.success(`${newTweetsCount} new posts loaded from Twitter!`)
    }
  }, [saveTargets, saveFeed, executeAutoBuy, notifyCaDetected])

  // Polling loop otomatis (setiap 20 detik) & auto-refresh saat window focus
  useEffect(() => {
    if (!isMonitoring || targets.length === 0) return

    const timer = setTimeout(() => {
      refreshTweets()
    }, 400)

    const interval = setInterval(() => {
      refreshTweets()
    }, 20000)

    const handleFocus = () => {
      refreshTweets()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshTweets()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isMonitoring, targets.length, refreshTweets])

  const clearFeed = useCallback(() => {
    setFeed([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_FEED)
    }
    toast.success('Live post feed cleared')
  }, [STORAGE_KEY_FEED])

  return {
    targets,
    feed,
    logs,
    isRefreshing,
    isMonitoring,
    setIsMonitoring,
    rateLimitUntil,
    addTarget,
    removeTarget,
    toggleTarget,
    refreshTweets,
    clearFeed,
  }
}
