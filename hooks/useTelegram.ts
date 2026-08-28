'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import {
  TelegramConfig,
  DEFAULT_TELEGRAM_CONFIG,
  formatTelegramCaDetectedMessage,
  formatTelegramSuccessMessage,
  formatTelegramSwapMessage,
  formatTelegramFailedMessage,
  formatTelegramTestMessage,
} from '@/lib/telegram'
import { activeChain } from '@/lib/chains'
import toast from 'react-hot-toast'

function getStoredItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function useTelegram() {
  const { user } = usePrivy()
  const { address } = useWallet()

  const twitterAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'twitter_oauth'
  ) as { username?: string } | undefined

  const twitterUsername = twitterAccount?.username

  const userId = user?.id || address || 'guest'
  const STORAGE_KEY = `rh_telegram_config_${userId}`

  const [config, setConfig] = useState<TelegramConfig>(() =>
    getStoredItem<TelegramConfig>(STORAGE_KEY, DEFAULT_TELEGRAM_CONFIG)
  )

  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  // Sync state from storage event or updates
  useEffect(() => {
    const handleConfigSync = () => {
      setConfig(getStoredItem<TelegramConfig>(STORAGE_KEY, DEFAULT_TELEGRAM_CONFIG))
    }
    window.addEventListener('rh_telegram_updated', handleConfigSync)
    return () => window.removeEventListener('rh_telegram_updated', handleConfigSync)
  }, [STORAGE_KEY])

  const saveConfig = useCallback(
    (newConfig: TelegramConfig) => {
      setConfig(newConfig)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
        window.dispatchEvent(new Event('rh_telegram_updated'))
      }
    },
    [STORAGE_KEY]
  )

  const updateConfig = useCallback(
    (partial: Partial<TelegramConfig>) => {
      const updated = { ...config, ...partial }
      saveConfig(updated)
    },
    [config, saveConfig]
  )

  // Verify bot token with API
  const verifyBotToken = useCallback(
    async (botToken: string) => {
      if (!botToken.trim()) {
        toast.error('Please enter a bot token')
        return null
      }

      setIsVerifying(true)
      try {
        const res = await fetch('/api/telegram/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken: botToken.trim() }),
        })

        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.error || 'Invalid bot token')
          return null
        }

        toast.success(`Verified: @${data.bot.username} (${data.bot.firstName})`)
        return data.bot as { id: number; firstName: string; username: string }
      } catch (e) {
        console.error('Error verifying bot token:', e)
        toast.error('Failed to connect to Telegram API')
        return null
      } finally {
        setIsVerifying(false)
      }
    },
    []
  )

  // Auto-detect user Chat ID from recent messages
  const detectRecentChat = useCallback(
    async (botToken: string) => {
      if (!botToken.trim()) return null
      try {
        const res = await fetch('/api/telegram/get-updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken: botToken.trim() }),
        })

        const data = await res.json()
        if (res.ok && data.ok && data.latestChat) {
          return data.latestChat as {
            chatId: string
            username?: string
            firstName?: string
            lastMessageText?: string
          }
        }
        return null
      } catch (e) {
        console.error('Error detecting recent chat:', e)
        return null
      }
    },
    []
  )

  // Send raw message
  const sendMessage = useCallback(
    async (message: string, overrideConfig?: { botToken?: string; chatId?: string }) => {
      const token = overrideConfig?.botToken || config.botToken
      const chat = overrideConfig?.chatId || config.chatId

      if (!token || !chat) {
        return false
      }

      try {
        const res = await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: token,
            chatId: chat,
            message,
            parseMode: 'HTML',
          }),
        })

        const data = await res.json()
        return res.ok && data.ok
      } catch (e) {
        console.error('Error sending Telegram notification:', e)
        return false
      }
    },
    [config.botToken, config.chatId]
  )

  // Send test message
  const sendTestMessage = useCallback(
    async (botToken?: string, chatId?: string) => {
      const token = botToken || config.botToken
      const chat = chatId || config.chatId

      if (!token || !chat) {
        toast.error('Bot token and Chat ID are required')
        return false
      }

      setIsSendingTest(true)
      try {
        const message = formatTelegramTestMessage({
          botUsername: config.botUsername,
          walletAddress: address,
          twitterHandle: twitterUsername,
        })

        const success = await sendMessage(message, { botToken: token, chatId: chat })
        if (success) {
          toast.success('Test message sent to your Telegram!')
          return true
        } else {
          toast.error('Failed to send message. Make sure you started the bot!')
          return false
        }
      } catch (e) {
        console.error('Error in sendTestMessage:', e)
        toast.error('Failed to send test message')
        return false
      } finally {
        setIsSendingTest(false)
      }
    },
    [config.botToken, config.chatId, config.botUsername, address, twitterUsername, sendMessage]
  )

  // Notification triggers for Sniper
  const notifyCaDetected = useCallback(
    async (targetUsername: string, ca: string, tweetText: string) => {
      if (!config.enabled || !config.notifyOnDetected || !config.botToken || !config.chatId) return

      const msg = formatTelegramCaDetectedMessage({
        targetUsername,
        ca,
        tweetText,
        walletAddress: address,
        twitterHandle: twitterUsername,
      })

      await sendMessage(msg)
    },
    [config.enabled, config.notifyOnDetected, config.botToken, config.chatId, address, twitterUsername, sendMessage]
  )

  const notifyAutoBuySuccess = useCallback(
    async (targetUsername: string, ca: string, amountEth: string, txHash?: string) => {
      if (!config.enabled || !config.notifyOnSuccess || !config.botToken || !config.chatId) return

      const msg = formatTelegramSuccessMessage({
        targetUsername,
        ca,
        amountEth,
        txHash,
        walletAddress: address,
        twitterHandle: twitterUsername,
        blockExplorerUrl: activeChain.blockExplorers.default.url,
      })

      await sendMessage(msg)
    },
    [config.enabled, config.notifyOnSuccess, config.botToken, config.chatId, address, twitterUsername, sendMessage]
  )

  const notifyAutoBuyFailed = useCallback(
    async (targetUsername: string, ca: string, amountEth: string, errorMessage: string) => {
      if (!config.enabled || !config.notifyOnFailed || !config.botToken || !config.chatId) return

      const msg = formatTelegramFailedMessage({
        targetUsername,
        ca,
        amountEth,
        errorMessage,
        walletAddress: address,
        twitterHandle: twitterUsername,
      })

      await sendMessage(msg)
    },
    [config.enabled, config.notifyOnFailed, config.botToken, config.chatId, address, twitterUsername, sendMessage]
  )

  const notifyManualSwap = useCallback(
    async ({
      tradeType,
      tokenSymbol,
      tokenName,
      ca,
      inputAmount,
      inputSymbol,
      outputAmount,
      outputSymbol,
      txHash,
    }: {
      tradeType: 'BUY' | 'SELL'
      tokenSymbol: string
      tokenName?: string
      ca: string
      inputAmount: string
      inputSymbol: string
      outputAmount: string
      outputSymbol: string
      txHash?: string
    }) => {
      if (!config.enabled || !config.notifyOnSuccess || !config.botToken || !config.chatId) return

      const msg = formatTelegramSwapMessage({
        tradeType,
        tokenSymbol,
        tokenName,
        ca,
        inputAmount,
        inputSymbol,
        outputAmount,
        outputSymbol,
        txHash,
        walletAddress: address,
        twitterHandle: twitterUsername,
        blockExplorerUrl: activeChain.blockExplorers.default.url,
      })

      await sendMessage(msg)
    },
    [config.enabled, config.notifyOnSuccess, config.botToken, config.chatId, address, twitterUsername, sendMessage]
  )

  // Ref to track last handled update_id persisted per user
  const STORAGE_KEY_LAST_UPDATE = `rh_telegram_last_update_${userId}`
  const lastUpdateIdRef = useRef<number>(
    getStoredItem<number>(STORAGE_KEY_LAST_UPDATE, 0)
  )
  const isPollingRef = useRef<boolean>(false)

  // Sync lastUpdateIdRef when userId changes
  useEffect(() => {
    lastUpdateIdRef.current = getStoredItem<number>(STORAGE_KEY_LAST_UPDATE, 0)
  }, [STORAGE_KEY_LAST_UPDATE])

  // Polling loop to listen and reply to user Telegram commands (/balance, /start, /targets, /add, /remove, /wallet, /status)
  useEffect(() => {
    if (!config.botToken || !config.chatId) return

    const pollCommands = async () => {
      if (isPollingRef.current) return
      isPollingRef.current = true

      try {
        const storedTargets = getStoredItem<unknown[]>(`rh_sniper_targets_${userId}`, [])
        const res = await fetch('/api/telegram/handle-commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: config.botToken,
            chatId: config.chatId,
            userAddress: address,
            twitterHandle: twitterUsername,
            targets: storedTargets,
            lastUpdateId: lastUpdateIdRef.current,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.newLastUpdateId && data.newLastUpdateId > lastUpdateIdRef.current) {
            lastUpdateIdRef.current = data.newLastUpdateId
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_LAST_UPDATE, String(data.newLastUpdateId))
            }
          }

          // If a target was added or removed via Telegram, sync to local state & UI
          if (data.newTargets && Array.isArray(data.newTargets)) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`rh_sniper_targets_${userId}`, JSON.stringify(data.newTargets))
              window.dispatchEvent(new CustomEvent('rh_targets_updated', { detail: data.newTargets }))
            }
          }
        }
      } catch {
        // Ignore network errors in polling loop
      } finally {
        isPollingRef.current = false
      }
    }

    const timer = setTimeout(pollCommands, 400)
    const interval = setInterval(pollCommands, 2500)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [config.botToken, config.chatId, address, twitterUsername, userId, STORAGE_KEY_LAST_UPDATE])

  return {
    config,
    isVerifying,
    isSendingTest,
    saveConfig,
    updateConfig,
    verifyBotToken,
    detectRecentChat,
    sendTestMessage,
    sendMessage,
    notifyCaDetected,
    notifyAutoBuySuccess,
    notifyAutoBuyFailed,
    notifyManualSwap,
  }
}
