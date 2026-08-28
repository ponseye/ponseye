import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { robinhoodChain, activeChain } from '@/lib/chains'
import { sanitizeUsername, SniperTarget } from '@/lib/sniper'
import {
  formatTelegramBalanceMessage,
  formatTelegramHelpMessage,
  formatTelegramWalletMessage,
  formatTelegramTargetsMessage,
  formatTelegramTargetAddedMessage,
  formatTelegramTargetRemovedMessage,
  formatTelegramStatusMessage,
  getBalanceInlineKeyboard,
  getHelpInlineKeyboard,
  getTargetsInlineKeyboard,
} from '@/lib/telegram'

export const dynamic = 'force-dynamic'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    chat?: {
      id: number
    }
    text?: string
    date: number
  }
  callback_query?: {
    id: string
    from: {
      id: number
      username?: string
      first_name?: string
    }
    message?: {
      message_id: number
      chat?: {
        id: number
      }
      text?: string
    }
    data?: string
  }
}

// In-memory set to guarantee EXACTLY-ONCE command & callback execution
const PROCESSED_UPDATES = new Set<string>()

// Helper to keep processed set memory bounded
function markUpdateAsProcessed(key: string) {
  PROCESSED_UPDATES.add(key)
  if (PROCESSED_UPDATES.size > 2000) {
    const firstItems = Array.from(PROCESSED_UPDATES).slice(0, 1000)
    for (const item of firstItems) {
      PROCESSED_UPDATES.delete(item)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      botToken,
      chatId,
      userAddress,
      twitterHandle,
      targets = [] as SniperTarget[],
      lastUpdateId = 0,
      isMonitoring = true,
    } = await req.json()

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'botToken and chatId are required' }, { status: 400 })
    }

    const cleanToken = String(botToken).trim()
    const cleanChatId = String(chatId).trim()

    // Fetch updates from Telegram
    const offsetParam = lastUpdateId ? `&offset=${lastUpdateId + 1}` : ''
    const updatesUrl = `https://api.telegram.org/bot${cleanToken}/getUpdates?limit=10${offsetParam}&allowed_updates=["message","callback_query"]`

    const res = await fetch(updatesUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      if (data.description?.toLowerCase().includes('webhook')) {
        await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook`, { method: 'POST' }).catch(() => {})
      }
      return NextResponse.json({ error: data.description || 'Failed to fetch updates', ok: false, newLastUpdateId: lastUpdateId }, { status: 200 })
    }

    const updates: TelegramUpdate[] = data.result || []
    if (updates.length === 0) {
      return NextResponse.json({ ok: true, newLastUpdateId: lastUpdateId, handledCount: 0 })
    }

    let highestUpdateId = lastUpdateId
    let handledCount = 0
    let currentTargets: SniperTarget[] = [...targets]
    let targetsModified = false

    // Initialize viem public client for on-chain balance
    const client = createPublicClient({
      chain: robinhoodChain,
      transport: http('https://robinhood-rpc.publicnode.com'),
    })

    async function fetchEthBalance(): Promise<string> {
      if (!userAddress) return '0.000000'
      try {
        const rawBalance = await client.getBalance({ address: userAddress as `0x${string}` })
        return Number(formatEther(rawBalance)).toFixed(6)
      } catch (e) {
        console.error('Error fetching balance:', e)
        return '0.000000'
      }
    }

    for (const item of updates) {
      if (item.update_id > highestUpdateId) {
        highestUpdateId = item.update_id
      }

      const updateKey = `up_${cleanChatId}_${item.update_id}`
      if (PROCESSED_UPDATES.has(updateKey)) {
        continue
      }
      markUpdateAsProcessed(updateKey)

      // 1. Handle Callback Query (Inline Button Click)
      if (item.callback_query) {
        const cb = item.callback_query
        const cbChatId = String(cb.message?.chat?.id || cb.from.id)
        if (cbChatId !== cleanChatId) continue

        const cbData = cb.data || ''
        const msgId = cb.message?.message_id

        // Answer callback query so button stops showing spinner
        await fetch(`https://api.telegram.org/bot${cleanToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cb.id,
            text: cbData === 'cmd_refresh_balance' ? '🔄 Saldo berhasil diperbarui!' : 'Memproses...',
          }),
          cache: 'no-store',
        })

        if (cbData === 'cmd_refresh_balance' && msgId) {
          const balanceEth = await fetchEthBalance()
          const balanceMsg = formatTelegramBalanceMessage({
            balanceEth,
            walletAddress: userAddress,
            twitterHandle,
            lastUpdatedTime: new Date().toLocaleTimeString(),
          })

          await fetch(`https://api.telegram.org/bot${cleanToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              message_id: msgId,
              text: balanceMsg,
              parse_mode: 'HTML',
              reply_markup: getBalanceInlineKeyboard(userAddress),
            }),
            cache: 'no-store',
          })
          handledCount++
        } else if (cbData === 'cmd_targets' && msgId) {
          const targetsMsg = formatTelegramTargetsMessage({
            targets: currentTargets,
            twitterHandle,
          })

          await fetch(`https://api.telegram.org/bot${cleanToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              message_id: msgId,
              text: targetsMsg,
              parse_mode: 'HTML',
              reply_markup: getTargetsInlineKeyboard(),
            }),
            cache: 'no-store',
          })
          handledCount++
        } else if (cbData === 'cmd_status' && msgId) {
          const statusMsg = formatTelegramStatusMessage({
            walletAddress: userAddress,
            twitterHandle,
            targetsCount: currentTargets.length,
            isMonitoring,
          })

          await fetch(`https://api.telegram.org/bot${cleanToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              message_id: msgId,
              text: statusMsg,
              parse_mode: 'HTML',
              reply_markup: getHelpInlineKeyboard(),
            }),
            cache: 'no-store',
          })
          handledCount++
        } else if (cbData === 'cmd_add_help' && msgId) {
          const addHelpText = `➕ <b>Cara Menambah Akun Target via Telegram:</b>\n\n` +
            `Ketik perintah dengan format:\n` +
            `<code>/add &lt;username_twitter&gt; [jumlah_eth]</code>\n\n` +
            `<b>Contoh Penggunaan:</b>\n` +
            `• <code>/add elonmusk 0.01</code>\n` +
            `• <code>/add vitalikbuterin 0.005</code>\n\n` +
            `<i>(Jika jumlah ETH tidak diisi, default pembelian adalah 0.005 ETH)</i>`

          await fetch(`https://api.telegram.org/bot${cleanToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              message_id: msgId,
              text: addHelpText,
              parse_mode: 'HTML',
              reply_markup: getTargetsInlineKeyboard(),
            }),
            cache: 'no-store',
          })
          handledCount++
        }
        continue
      }

      // 2. Handle Text Messages
      const msg = item.message
      if (!msg || !msg.text || !msg.chat) continue

      if (String(msg.chat.id) !== cleanChatId) continue

      const rawText = msg.text.trim()
      const parts = rawText.split(/\s+/)
      const command = parts[0].toLowerCase().split('@')[0]

      let replyText: string | null = null
      let replyMarkup: unknown = null

      if (command === '/start' || command === '/help') {
        replyText = formatTelegramHelpMessage()
        replyMarkup = getHelpInlineKeyboard()
      } else if (command === '/balance' || command === '/saldo') {
        const balanceEth = await fetchEthBalance()
        replyText = formatTelegramBalanceMessage({
          balanceEth,
          walletAddress: userAddress,
          twitterHandle,
          lastUpdatedTime: new Date().toLocaleTimeString(),
        })
        replyMarkup = getBalanceInlineKeyboard(userAddress)
      } else if (command === '/wallet' || command === '/address') {
        replyText = formatTelegramWalletMessage({
          walletAddress: userAddress,
          twitterHandle,
          blockExplorerUrl: activeChain.blockExplorers.default.url,
        })
        replyMarkup = getBalanceInlineKeyboard(userAddress)
      } else if (command === '/targets' || command === '/target' || command === '/list') {
        replyText = formatTelegramTargetsMessage({
          targets: currentTargets,
          twitterHandle,
        })
        replyMarkup = getTargetsInlineKeyboard()
      } else if (command === '/add') {
        const rawUsername = parts[1]
        const rawAmount = parts[2] || '0.005'

        if (!rawUsername) {
          replyText = `⚠️ <b>Format Salah</b>\n\nKetik: <code>/add &lt;username&gt; [amount]</code>\nContoh: <code>/add elonmusk 0.01</code>`
        } else {
          const username = sanitizeUsername(rawUsername)
          const buyAmountEth = parseFloat(rawAmount) > 0 ? String(rawAmount) : '0.005'

          const existingIndex = currentTargets.findIndex(
            (t) => t.username.toLowerCase() === username.toLowerCase()
          )

          if (existingIndex >= 0) {
            currentTargets[existingIndex] = {
              ...currentTargets[existingIndex],
              buyAmountEth,
              enabled: true,
            }
          } else {
            const newTarget: SniperTarget = {
              id: `target_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              username,
              buyAmountEth,
              enabled: true,
              createdAt: Date.now(),
            }
            currentTargets = [newTarget, ...currentTargets]
          }

          targetsModified = true
          replyText = formatTelegramTargetAddedMessage({
            username,
            buyAmountEth,
            totalTargets: currentTargets.length,
          })
          replyMarkup = getTargetsInlineKeyboard()
        }
      } else if (command === '/remove' || command === '/delete' || command === '/del') {
        const rawUsername = parts[1]
        if (!rawUsername) {
          replyText = `⚠️ <b>Format Salah</b>\n\nKetik: <code>/remove &lt;username&gt;</code>\nContoh: <code>/remove elonmusk</code>`
        } else {
          const username = sanitizeUsername(rawUsername)
          const filtered = currentTargets.filter(
            (t) => t.username.toLowerCase() !== username.toLowerCase()
          )

          if (filtered.length === currentTargets.length) {
            replyText = `⚠️ Akun <b>@${username}</b> tidak ditemukan di daftar target.`
          } else {
            currentTargets = filtered
            targetsModified = true
            replyText = formatTelegramTargetRemovedMessage({
              username,
              totalTargets: currentTargets.length,
            })
          }
          replyMarkup = getTargetsInlineKeyboard()
        }
      } else if (command === '/status') {
        replyText = formatTelegramStatusMessage({
          walletAddress: userAddress,
          twitterHandle,
          targetsCount: currentTargets.length,
          isMonitoring,
        })
        replyMarkup = getHelpInlineKeyboard()
      } else if (command.startsWith('/')) {
        replyText = `❓ Perintah tidak dikenali.\n\nKetik <code>/help</code> untuk melihat panduan perintah yang tersedia.`
        replyMarkup = getHelpInlineKeyboard()
      }

      if (replyText) {
        handledCount++
        try {
          await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              text: replyText,
              parse_mode: 'HTML',
              link_preview_options: { is_disabled: true },
              ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
            }),
            cache: 'no-store',
          })
        } catch (err) {
          console.error('Error sending telegram command reply:', err)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      newLastUpdateId: highestUpdateId,
      handledCount,
      ...(targetsModified ? { newTargets: currentTargets } : {}),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to handle telegram commands'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
