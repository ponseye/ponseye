import { isAddress } from 'viem'

export interface SniperTarget {
  id: string
  username: string // e.g. 'elonmusk'
  displayName?: string
  profileImageUrl?: string
  twitterUserId?: string // Cached Twitter numerical ID
  buyAmountEth: string // e.g. '0.005'
  enabled: boolean
  lastSeenTweetId?: string
  lastSnipedAt?: number
  createdAt: number
}

export interface TweetFeedItem {
  id: string
  username: string
  displayName?: string
  profileImageUrl?: string
  text: string
  createdAt: number
  detectedCas: string[]
  snipedStatus?: 'idle' | 'buying' | 'success' | 'failed'
  txHash?: string
  errorMessage?: string
}

export interface SniperLog {
  id: string
  timestamp: number
  targetUsername: string
  tweetText: string
  detectedCa: string
  buyAmountEth: string
  status: 'detected' | 'buying' | 'success' | 'failed'
  txHash?: string
  errorMessage?: string
}

/**
 * Mendeteksi semua Contract Address (CA) Ethereum/EVM valid dari teks tweet.
 * Pola regex menggunakan word boundary (\b) agar tidak salah mengambil tx hash (64 hex char)
 * atau substring acak.
 */
export function extractContractAddresses(text: string): string[] {
  if (!text) return []

  // Hanya match 40 karakter hex persis dengan word boundary
  const regex = /\b(0x[a-fA-F0-9]{40})\b/g
  const matches = text.match(regex) || []

  // Validasi keabsahan format alamat EVM (checksum / length)
  const validAddresses = matches.filter((addr) => isAddress(addr))
  return Array.from(new Set(validAddresses))
}

/**
 * Format username Twitter agar bersih dari '@' dan spasi
 */
export function sanitizeUsername(username: string): string {
  return username.replace(/^@+/, '').trim().toLowerCase()
}
