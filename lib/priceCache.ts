// Simple in-memory cache for token prices to prevent rate-limiting (429)
interface CachedPrice {
  priceUsd: number
  priceNative: number
  name: string
  symbol: string
  decimals: number
  timestamp: number
}

const cache = new Map<string, CachedPrice>()
const TTL = 45 * 1000 // 45 seconds cache

export function getCachedPrice(address: string): CachedPrice | null {
  const key = address.toLowerCase()
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.timestamp > TTL) {
    cache.delete(key)
    return null
  }
  return hit
}

export function setCachedPrice(
  address: string,
  data: {
    priceUsd: number
    priceNative: number
    name: string
    symbol: string
    decimals: number
  }
) {
  const key = address.toLowerCase()
  cache.set(key, {
    ...data,
    timestamp: Date.now(),
  })
}
