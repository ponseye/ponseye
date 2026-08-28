import { NextRequest, NextResponse } from 'next/server'
import { isAddress, createPublicClient, http, erc20Abi, getAddress } from 'viem'
import { robinhoodChain } from '@/lib/chains'

export const dynamic = 'force-dynamic'

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http('https://robinhood-rpc.publicnode.com'),
})

const GECKOTERMINAL_BASE = 'https://api.geckoterminal.com/api/v2'
const GT_NETWORK = 'robinhood'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Contract address tidak valid' }, { status: 400 })
    }

    const cleanAddress = getAddress(address)
    const addrLower = cleanAddress.toLowerCase()

    let name = ''
    let symbol = ''
    let decimals = 18
    let priceNative = 0 // ETH per 1 Token
    let priceUsd = 0
    let ethPriceUsd = 2500
    let poolFee = 10000 // default 1%

    // 1. Baca on-chain metadata (name, symbol, decimals)
    try {
      const [onChainDecimals, onChainName, onChainSymbol] = await Promise.all([
        client.readContract({ address: cleanAddress, abi: erc20Abi, functionName: 'decimals' }).catch(() => 18),
        client.readContract({ address: cleanAddress, abi: erc20Abi, functionName: 'name' }).catch(() => ''),
        client.readContract({ address: cleanAddress, abi: erc20Abi, functionName: 'symbol' }).catch(() => ''),
      ])
      decimals = Number(onChainDecimals) || 18
      name = String(onChainName)
      symbol = String(onChainSymbol)
    } catch { /* ignore */ }

    // 2. Ambil data token dari GeckoTerminal (harga USD + pool list)
    try {
      const tokenRes = await fetch(`${GECKOTERMINAL_BASE}/networks/${GT_NETWORK}/tokens/${addrLower}`, {
        headers: { 'Accept': 'application/json;version=20230302' },
        cache: 'no-store',
      })

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json()
        const attrs = tokenData?.data?.attributes

        if (attrs) {
          if (!name && attrs.name) name = attrs.name
          if (!symbol && attrs.symbol) symbol = attrs.symbol
          if (attrs.decimals) decimals = Number(attrs.decimals)
          if (attrs.price_usd) priceUsd = parseFloat(attrs.price_usd) || 0

          // Ambil data pool terbaik untuk harga native dan fee tier
          const topPools: Array<{ id: string }> = tokenData?.data?.relationships?.top_pools?.data || []

          if (topPools.length > 0) {
            // Pool pertama = pool dengan likuiditas terbesar
            const poolId = topPools[0].id // format: "robinhood_0x..."
            const poolAddr = poolId.replace(`${GT_NETWORK}_`, '')

            try {
              const poolRes = await fetch(`${GECKOTERMINAL_BASE}/networks/${GT_NETWORK}/pools/${poolAddr}`, {
                headers: { 'Accept': 'application/json;version=20230302' },
                cache: 'no-store',
              })

              if (poolRes.ok) {
                const poolData = await poolRes.json()
                const poolAttrs = poolData?.data?.attributes

                if (poolAttrs) {
                  // Harga ETH dari quote_token_price_usd (WETH = quote token)
                  if (poolAttrs.quote_token_price_usd) {
                    ethPriceUsd = parseFloat(poolAttrs.quote_token_price_usd) || 2500
                  }

                  // Cek apakah token kita adalah base atau quote
                  const baseTokenId: string = poolData?.data?.relationships?.base_token?.data?.id || ''
                  const isBase = baseTokenId.toLowerCase().includes(addrLower.toLowerCase())

                  if (isBase && poolAttrs.base_token_price_native_currency) {
                    priceNative = parseFloat(poolAttrs.base_token_price_native_currency) || 0
                  } else if (!isBase && poolAttrs.quote_token_price_native_currency) {
                    priceNative = parseFloat(poolAttrs.quote_token_price_native_currency) || 0
                  }

                  // Ambil fee tier dari pool_fee_percentage (1 => 10000, 0.3 => 3000, 0.05 => 500)
                  if (poolAttrs.pool_fee_percentage !== undefined) {
                    const feePct = parseFloat(poolAttrs.pool_fee_percentage)
                    poolFee = Math.round(feePct * 10000)
                  }
                }
              }
            } catch { /* ignore pool fetch error */ }
          }
        }
      }
    } catch { /* ignore GeckoTerminal error */ }

    // Fallback: hitung dari USD jika priceNative masih 0
    if (priceNative === 0 && priceUsd > 0 && ethPriceUsd > 0) {
      priceNative = priceUsd / ethPriceUsd
    }

    return NextResponse.json({
      address: cleanAddress,
      name: name || `Token ${cleanAddress.slice(0, 6)}...`,
      symbol: symbol || 'TOKEN',
      decimals,
      priceNative,
      priceUsd,
      ethPriceUsd,
      poolFee,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil info token'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
