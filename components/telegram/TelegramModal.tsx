'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useTelegram } from '@/hooks/useTelegram'
import { useWallet } from '@/hooks/useWallet'
import { usePrivy } from '@privy-io/react-auth'
import toast from 'react-hot-toast'

interface TelegramModalProps {
  open: boolean
  onClose: () => void
}

export default function TelegramModal({ open, onClose }: TelegramModalProps) {
  const { user } = usePrivy()
  const { address } = useWallet()
  const {
    config,
    isVerifying,
    isSendingTest,
    saveConfig,
    verifyBotToken,
    detectRecentChat,
    sendTestMessage,
  } = useTelegram()

  const twitterAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'twitter_oauth'
  ) as { username?: string } | undefined

  const twitterHandle = twitterAccount?.username ? `@${twitterAccount.username}` : 'User'
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x...'

  // Local form state
  const [botToken, setBotToken] = useState(config.botToken)
  const [chatId, setChatId] = useState(config.chatId)
  const [botUsername, setBotUsername] = useState(config.botUsername || '')
  const [botFirstName, setBotFirstName] = useState(config.botFirstName || '')
  const [enabled, setEnabled] = useState(config.enabled)
  const [notifyOnDetected, setNotifyOnDetected] = useState(config.notifyOnDetected)
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(config.notifyOnSuccess)
  const [notifyOnFailed, setNotifyOnFailed] = useState(config.notifyOnFailed)
  const [isDetectingChat, setIsDetectingChat] = useState(false)

  // Sync with current config on open
  useEffect(() => {
    if (open) {
      setBotToken(config.botToken)
      setChatId(config.chatId)
      setBotUsername(config.botUsername || '')
      setBotFirstName(config.botFirstName || '')
      setEnabled(config.enabled)
      setNotifyOnDetected(config.notifyOnDetected)
      setNotifyOnSuccess(config.notifyOnSuccess)
      setNotifyOnFailed(config.notifyOnFailed)
    }
  }, [open, config])

  async function handleVerifyToken() {
    if (!botToken.trim()) {
      toast.error('Please enter a bot token')
      return
    }
    const result = await verifyBotToken(botToken)
    if (result) {
      setBotUsername(result.username)
      setBotFirstName(result.firstName)
    }
  }

  async function handleAutoDetectChat() {
    if (!botToken.trim()) {
      toast.error('Please enter and verify your bot token first')
      return
    }
    setIsDetectingChat(true)
    try {
      const chat = await detectRecentChat(botToken)
      if (chat && chat.chatId) {
        setChatId(chat.chatId)
        toast.success(`Chat ID detected: ${chat.chatId} (${chat.firstName || chat.username || 'User'})`)
      } else {
        toast.error('No recent messages found. Click "Open Bot in Telegram", send /start, then click Detect again.')
      }
    } finally {
      setIsDetectingChat(false)
    }
  }

  async function handleSendTest() {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error('Please provide both Bot Token and Chat ID before testing')
      return
    }
    await sendTestMessage(botToken, chatId)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (enabled && (!botToken.trim() || !chatId.trim())) {
      toast.error('Please provide both Bot Token and Chat ID to enable alerts')
      return
    }

    saveConfig({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      botUsername: botUsername.trim(),
      botFirstName: botFirstName.trim(),
      enabled,
      notifyOnDetected,
      notifyOnSuccess,
      notifyOnFailed,
    })

    toast.success(enabled ? 'Telegram Bot activated successfully!' : 'Telegram settings saved')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Telegram Bot & Auto-Alerts">
      <form onSubmit={handleSave} className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">
        {/* Connected Identity Info Banner */}
        <div className="bg-[#09110d] border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/30 flex items-center justify-center bg-black relative flex-shrink-0">
              <Image src="/logo.svg" alt="PONSEye" width={32} height={32} className="object-cover" />
            </div>
            <div>
              <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
                <span>{twitterHandle}</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                  Robinhood Chain
                </span>
              </div>
              <div className="text-zinc-500 font-mono text-[11px]">{shortAddress}</div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono ${
                config.enabled && config.botToken && config.chatId
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-500 border border-white/[0.06]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  config.enabled && config.botToken && config.chatId
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              {config.enabled && config.botToken && config.chatId ? 'BOT ACTIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Master Activation Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#09110d]/80 border border-white/[0.08] backdrop-blur-md">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>Enable Telegram Notifications</span>
            </span>
            <span className="text-[11px] text-zinc-400">
              Receive real-time alerts when CA is detected & auto-buys execute
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              enabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Step 1: Bot Token */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              1. Telegram Bot Token <span className="text-emerald-400">*</span>
            </label>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
            >
              Create bot via @BotFather ↗
            </a>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              value={botToken}
              onChange={(e) => {
                setBotToken(e.target.value)
                setBotUsername('')
              }}
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ..."
              className="flex-1 bg-[#050b08] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isVerifying}
              onClick={handleVerifyToken}
              className="text-xs font-medium px-3 flex-shrink-0"
            >
              Verify
            </Button>
          </div>

          {botUsername && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                Connected Bot: <b>@{botUsername}</b> ({botFirstName})
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Chat ID & Auto-Detect */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              2. Your Telegram Chat ID <span className="text-emerald-400">*</span>
            </label>
            {botUsername && (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
              >
                1. Click to Open Bot & Send /start ↗
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="flex-1 bg-[#050b08] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isDetectingChat}
              onClick={handleAutoDetectChat}
              className="text-xs font-medium px-3 flex-shrink-0"
              title="Automatically find your Chat ID after you message your bot"
            >
              Auto-Detect
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Click your bot link above, tap <b>Start</b> in Telegram, then click <b>Auto-Detect</b>.
          </p>
        </div>

        {/* Step 3: Notification Options */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
          <span className="text-xs font-semibold text-zinc-300">Notification Triggers</span>

          <div className="flex flex-col gap-2 bg-[#09110d]/80 p-3 rounded-xl border border-white/[0.06]">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={notifyOnDetected}
                onChange={(e) => setNotifyOnDetected(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4"
              />
              <span>Alert when a new token CA is detected in tweets</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={notifyOnSuccess}
                onChange={(e) => setNotifyOnSuccess(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4"
              />
              <span>Alert when Auto-Buy transaction succeeds (with Blockscout link)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={notifyOnFailed}
                onChange={(e) => setNotifyOnFailed(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4"
              />
              <span>Alert if Auto-Buy fails or gets canceled</span>
            </label>
          </div>
        </div>

        {/* Step 4: Test Message & Save Buttons */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="secondary"
            loading={isSendingTest}
            onClick={handleSendTest}
            className="w-full text-xs font-medium py-2.5 border-white/[0.12] hover:border-emerald-500/40"
          >
            💬 Send Test Message to Telegram
          </Button>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Apply
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
