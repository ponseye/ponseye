export interface TelegramConfig {
  botToken: string
  chatId: string
  botUsername?: string
  botFirstName?: string
  enabled: boolean
  notifyOnDetected: boolean
  notifyOnSuccess: boolean
  notifyOnFailed: boolean
}

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: '',
  chatId: '',
  botUsername: '',
  botFirstName: '',
  enabled: false,
  notifyOnDetected: true,
  notifyOnSuccess: true,
  notifyOnFailed: true,
}

export interface TelegramInlineButton {
  text: string
  callback_data?: string
  url?: string
}

export function formatTelegramCaDetectedMessage({
  targetUsername,
  ca,
  tweetText,
  walletAddress,
  twitterHandle,
}: {
  targetUsername: string
  ca: string
  tweetText: string
  walletAddress?: string
  twitterHandle?: string
}): string {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Unknown'
  const userTag = twitterHandle ? `@${twitterHandle}` : 'Connected User'

  return `🎯 <b>PONSEye — New CA Detected!</b>\n\n` +
    `👤 <b>Target:</b> @${targetUsername}\n` +
    `💎 <b>Token CA:</b> <code>${ca}</code>\n` +
    `📝 <b>Post:</b> <i>"${escapeHtml(tweetText.slice(0, 180))}${tweetText.length > 180 ? '...' : ''}"</i>\n\n` +
    `👛 <b>Connected Wallet:</b> <code>${shortWallet}</code> (${userTag})\n` +
    `🌐 <b>Network:</b> Robinhood Chain (4663)`
}

export function formatTelegramSuccessMessage({
  targetUsername,
  ca,
  amountEth,
  txHash,
  walletAddress,
  twitterHandle,
  blockExplorerUrl,
}: {
  targetUsername: string
  ca: string
  amountEth: string
  txHash?: string
  walletAddress?: string
  twitterHandle?: string
  blockExplorerUrl: string
}): string {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Unknown'
  const userTag = twitterHandle ? `@${twitterHandle}` : 'Connected User'
  const explorerLink = txHash ? `${blockExplorerUrl}/tx/${txHash}` : '#'

  return `🚀 <b>PONSEye — Auto-Buy Successful!</b>\n\n` +
    `🎯 <b>Target:</b> @${targetUsername}\n` +
    `💎 <b>Bought CA:</b> <code>${ca}</code>\n` +
    `💰 <b>Amount:</b> <b>${amountEth} ETH</b>\n` +
    `👛 <b>Wallet:</b> <code>${shortWallet}</code> (${userTag})\n\n` +
    (txHash ? `🔗 <a href="${explorerLink}"><b>View Transaction on Blockscout →</b></a>\n` : '') +
    `🌐 <b>Network:</b> Robinhood Chain (4663)`
}

export function formatTelegramSwapMessage({
  tradeType,
  tokenSymbol,
  tokenName,
  ca,
  inputAmount,
  inputSymbol,
  outputAmount,
  outputSymbol,
  txHash,
  walletAddress,
  twitterHandle,
  blockExplorerUrl,
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
  walletAddress?: string
  twitterHandle?: string
  blockExplorerUrl: string
}): string {
  const isBuy = tradeType === 'BUY'
  const emoji = isBuy ? '🟢' : '🔴'
  const actionTitle = isBuy ? 'BUY EXECUTED' : 'SELL EXECUTED'
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Unknown'
  const userTag = twitterHandle ? `@${twitterHandle}` : 'Connected User'
  const explorerLink = txHash ? `${blockExplorerUrl}/tx/${txHash}` : '#'

  return `${emoji} <b>PONSEye — Token ${actionTitle}!</b>\n\n` +
    `🪙 <b>Token:</b> <b>$${tokenSymbol}</b> ${tokenName ? `(${escapeHtml(tokenName)})` : ''}\n` +
    `💎 <b>Contract:</b> <code>${ca}</code>\n\n` +
    `📤 <b>Paid:</b> <b>${inputAmount} ${inputSymbol}</b>\n` +
    `📥 <b>Received:</b> <b>${outputAmount} ${outputSymbol}</b>\n\n` +
    `👛 <b>Wallet:</b> <code>${shortWallet}</code> (${userTag})\n` +
    (txHash ? `🔗 <a href="${explorerLink}"><b>View on Blockscout Explorer →</b></a>\n` : '') +
    `🌐 <b>Network:</b> Robinhood Chain (4663)`
}

export function formatTelegramFailedMessage({
  targetUsername,
  ca,
  amountEth,
  errorMessage,
  walletAddress,
  twitterHandle,
}: {
  targetUsername: string
  ca: string
  amountEth: string
  errorMessage: string
  walletAddress?: string
  twitterHandle?: string
}): string {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Unknown'
  const userTag = twitterHandle ? `@${twitterHandle}` : 'Connected User'

  return `❌ <b>PONSEye — Auto-Buy Failed</b>\n\n` +
    `🎯 <b>Target:</b> @${targetUsername}\n` +
    `💎 <b>Token CA:</b> <code>${ca}</code>\n` +
    `💰 <b>Attempted:</b> ${amountEth} ETH\n` +
    `⚠️ <b>Reason:</b> <code>${escapeHtml(errorMessage.slice(0, 200))}</code>\n\n` +
    `👛 <b>Wallet:</b> <code>${shortWallet}</code> (${userTag})`
}

export function formatTelegramTestMessage({
  botUsername,
  walletAddress,
  twitterHandle,
}: {
  botUsername?: string
  walletAddress?: string
  twitterHandle?: string
}): string {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected'
  const userTag = twitterHandle ? `@${twitterHandle}` : 'Anonymous'

  return `✅ <b>PONSEye — Telegram Bot Connected!</b>\n\n` +
    `🤖 <b>Bot:</b> ${botUsername ? `@${botUsername}` : 'Active'}\n` +
    `👤 <b>Twitter Account:</b> ${userTag}\n` +
    `👛 <b>Connected Wallet:</b> <code>${shortWallet}</code>\n` +
    `🌐 <b>Network:</b> Robinhood Chain Mainnet (4663)\n\n` +
    `⚡ <i>Your personal sniper bot is now active and ready to receive real-time notifications for CA detection and automated buys!</i>\n\n` +
    `💡 <i>Type <code>/help</code> or tap the buttons below:</i>`
}

export function formatTelegramHelpMessage(): string {
  return `🤖 <b>PONSEye Bot Command Center:</b>\n\n` +
    `💰 <code>/balance</code> — Cek saldo ETH & token Robinhood Chain\n` +
    `🎯 <code>/targets</code> — Lihat daftar akun Twitter yang dimonitor\n` +
    `➕ <code>/add &lt;username&gt; [amount]</code> — Tambah target & alokasi ETH\n` +
    `   <i>Contoh: <code>/add elonmusk 0.01</code></i>\n` +
    `➖ <code>/remove &lt;username&gt;</code> — Hapus akun target\n` +
    `👛 <code>/wallet</code> — Lihat alamat wallet & link Explorer\n` +
    `⚡ <code>/status</code> — Status sniper engine\n` +
    `❓ <code>/help</code> — Panduan perintah bot`
}

export function formatTelegramBalanceMessage({
  balanceEth,
  walletAddress,
  twitterHandle,
  lastUpdatedTime,
}: {
  balanceEth: string
  walletAddress?: string
  twitterHandle?: string
  lastUpdatedTime?: string
}): string {
  const userTag = twitterHandle ? `@${twitterHandle}` : 'User'
  const timeString = lastUpdatedTime || new Date().toLocaleTimeString()

  return `💰 <b>Wallet Balance & Portfolio</b>\n\n` +
    `👤 <b>User:</b> ${userTag}\n` +
    `👛 <b>Wallet:</b> <code>${walletAddress || 'Unknown'}</code>\n` +
    `🌐 <b>Network:</b> Robinhood Chain (4663)\n\n` +
    `⚡ <b>Native ETH:</b> <b>${balanceEth} ETH</b>\n\n` +
    `🕒 <i>Updated at ${timeString}</i>`
}

export function formatTelegramWalletMessage({
  walletAddress,
  twitterHandle,
  blockExplorerUrl,
}: {
  walletAddress?: string
  twitterHandle?: string
  blockExplorerUrl: string
}): string {
  const userTag = twitterHandle ? `@${twitterHandle}` : 'User'

  if (!walletAddress) {
    return `⚠️ <b>No Wallet Connected</b>\n\nSilakan hubungkan wallet via Twitter login di web.`
  }

  return `👛 <b>Connected Robinhood Chain Wallet</b>\n\n` +
    `👤 <b>Twitter Account:</b> ${userTag}\n` +
    `📍 <b>Address:</b> <code>${walletAddress}</code>\n\n` +
    `🔗 <a href="${blockExplorerUrl}/address/${walletAddress}"><b>View Address on Blockscout Explorer →</b></a>`
}

export function formatTelegramTargetsMessage({
  targets,
  twitterHandle,
}: {
  targets: Array<{ username: string; buyAmountEth: string; enabled: boolean }>
  twitterHandle?: string
}): string {
  const userTag = twitterHandle ? `@${twitterHandle}` : 'User'

  if (!targets || targets.length === 0) {
    return `🎯 <b>Monitored Target Accounts (${userTag})</b>\n\n` +
      `Belum ada akun Twitter yang dipantau.\n\n` +
      `💡 <i>Ketik <code>/add elonmusk 0.005</code> untuk menambahkan target pertama Anda!</i>`
  }

  const targetList = targets
    .map(
      (t, i) =>
        `${i + 1}. <b>@${t.username}</b> — <b>${t.buyAmountEth} ETH</b> ${
          t.enabled ? '🟢 (Active)' : '⏸️ (Paused)'
        }`
    )
    .join('\n')

  return `🎯 <b>Monitored Target Accounts (${targets.length})</b>\n\n` +
    `👤 <b>User:</b> ${userTag}\n\n` +
    targetList +
    `\n\n💡 <i>Tambah: <code>/add &lt;username&gt; &lt;amount&gt;</code>\nHapus: <code>/remove &lt;username&gt;</code></i>`
}

export function formatTelegramTargetAddedMessage({
  username,
  buyAmountEth,
  totalTargets,
}: {
  username: string
  buyAmountEth: string
  totalTargets: number
}): string {
  return `✅ <b>Target Berhasil Ditambahkan!</b>\n\n` +
    `🎯 <b>Account:</b> @${username}\n` +
    `💰 <b>Auto-Buy Amount:</b> <b>${buyAmountEth} ETH</b>\n` +
    `🟢 <b>Status:</b> Active & Monitored\n` +
    `📊 <b>Total Targets:</b> ${totalTargets} Accounts\n\n` +
    `⚡ <i>Setiap kali @${username} memposting Contract Address (0x...), sistem akan otomatis mengeksekusi pembelian ${buyAmountEth} ETH menggunakan wallet Anda!</i>`
}

export function formatTelegramTargetRemovedMessage({
  username,
  totalTargets,
}: {
  username: string
  totalTargets: number
}): string {
  return `🗑️ <b>Target Dihapus</b>\n\n` +
    `Akun <b>@${username}</b> telah dihapus dari daftar pantauan.\n` +
    `📊 <b>Sisa Target:</b> ${totalTargets} Accounts.`
}

export function formatTelegramStatusMessage({
  walletAddress,
  twitterHandle,
  targetsCount,
  isMonitoring,
}: {
  walletAddress?: string
  twitterHandle?: string
  targetsCount: number
  isMonitoring: boolean
}): string {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Disconnected'
  const userTag = twitterHandle ? `@${twitterHandle}` : 'User'

  return `⚡ <b>PONSEye Engine Status</b>\n\n` +
    `🟢 <b>Sniper Engine:</b> ${isMonitoring ? 'ACTIVE & LISTENING 🛰️' : 'PAUSED ⏸️'}\n` +
    `👤 <b>Account:</b> ${userTag}\n` +
    `👛 <b>Wallet:</b> <code>${shortWallet}</code>\n` +
    `🎯 <b>Targets Monitored:</b> ${targetsCount} Accounts\n` +
    `🌐 <b>Network:</b> Robinhood Chain (4663)`
}

// Inline Keyboard Builders
export function getBalanceInlineKeyboard(walletAddress?: string): { inline_keyboard: TelegramInlineButton[][] } {
  const explorerUrl = walletAddress
    ? `https://explorer.robinhood.com/address/${walletAddress}`
    : 'https://explorer.robinhood.com'

  return {
    inline_keyboard: [
      [
        { text: '🔄 Refresh Balance', callback_data: 'cmd_refresh_balance' },
        { text: '🎯 My Targets', callback_data: 'cmd_targets' },
      ],
      [
        { text: '➕ Add Target', callback_data: 'cmd_add_help' },
        { text: '🌐 Explorer', url: explorerUrl },
      ],
    ],
  }
}

export function getHelpInlineKeyboard(): { inline_keyboard: TelegramInlineButton[][] } {
  return {
    inline_keyboard: [
      [
        { text: '💰 Check Balance', callback_data: 'cmd_refresh_balance' },
        { text: '🎯 View Targets', callback_data: 'cmd_targets' },
      ],
      [
        { text: '➕ Add Target Guide', callback_data: 'cmd_add_help' },
        { text: '⚡ Engine Status', callback_data: 'cmd_status' },
      ],
    ],
  }
}

export function getTargetsInlineKeyboard(): { inline_keyboard: TelegramInlineButton[][] } {
  return {
    inline_keyboard: [
      [
        { text: '➕ Add New Target', callback_data: 'cmd_add_help' },
        { text: '🔄 Refresh List', callback_data: 'cmd_targets' },
      ],
      [
        { text: '💰 Check Balance', callback_data: 'cmd_refresh_balance' },
      ],
    ],
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
