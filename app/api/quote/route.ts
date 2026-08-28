import { NextRequest, NextResponse } from 'next/server'
import { isAddress, getAddress } from 'viem'

export const dynamic = 'force-dynamic'

const GECKOTERMINAL_BASE = 'https://api.geckoterminal.com/api/v2'
const GT_NETWORK = 'robinhood'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tokenAddress, amountIn, isBuy, tokenDecimals } = body

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: 'Token address tidak valid' }, { status: 400 })
    }

    const tokenAddr = getAddress(tokenAddress)
    const addrLower = tokenAddr.toLowerCase()
    const amount = parseFloat(amountIn)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount tidak valid' }, { status: 400 })
    }

    // Ambil data token dari GeckoTerminal untuk mendapatkan pool terbaik
    const tokenRes = await fetch(
      `${GECKOTERMINAL_BASE}/networks/${GT_NETWORK}/tokens/${addrLower}`,
      {
        headers: { 'Accept': 'application/json;version=20230302' },
        cache: 'no-store',
      }
    )

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Token tidak ditemukan di GeckoTerminal' }, { status: 400 })
    }

    const tokenData = await tokenRes.json()
    const topPools: Array<{ id: string }> = tokenData?.data?.relationships?.top_pools?.data || []

    if (topPools.length === 0) {
      return NextResponse.json({ error: 'Pool tidak ditemukan untuk token ini' }, { status: 400 })
    }

    // Ambil pool terbaik (likuiditas tertinggi)
    const poolId = topPools[0].id
    const poolAddr = poolId.replace(`${GT_NETWORK}_`, '')

    const poolRes = await fetch(
      `${GECKOTERMINAL_BASE}/networks/${GT_NETWORK}/pools/${poolAddr}`,
      {
        headers: { 'Accept': 'application/json;version=20230302' },
        cache: 'no-store',
      }
    )

    if (!poolRes.ok) {
      return NextResponse.json({ error: 'Data pool tidak tersedia' }, { status: 400 })
    }

    const poolData = await poolRes.json()
    const poolAttrs = poolData?.data?.attributes

    if (!poolAttrs) {
      return NextResponse.json({ error: 'Data pool kosong' }, { status: 400 })
    }

    // Tentukan apakah token kita adalah base atau quote token di pool ini
    const baseTokenId: string = poolData?.data?.relationships?.base_token?.data?.id || ''
    const isBase = baseTokenId.toLowerCase().includes(addrLower.toLowerCase())

    // Ambil fee tier pool (pool_fee_percentage: "1" = 1% = 10000 basis points)
    const feePct = parseFloat(poolAttrs.pool_fee_percentage || '1')
    const feeMultiplier = 1 - feePct / 100

    // Ambil harga ETH (quote token = WETH)
    const ethPriceUsd = parseFloat(poolAttrs.quote_token_price_usd || '2500') || 2500

    let amountOut = 0

    if (isBuy) {
      // Beli: ETH → Token
      // base_token_price_native_currency = ETH per 1 Token
      // Jadi tokens per ETH = 1 / base_token_price_native_currency
      let priceNative = 0
      if (isBase && poolAttrs.base_token_price_native_currency) {
        priceNative = parseFloat(poolAttrs.base_token_price_native_currency)
      } else if (!isBase && poolAttrs.quote_token_price_base_token) {
        // token adalah quote, ETH adalah base — tidak umum, tapi handle
        priceNative = 1 / parseFloat(poolAttrs.quote_token_price_base_token || '0')
      }

      if (priceNative > 0) {
        const tokensPerEth = 1 / priceNative
        amountOut = amount * tokensPerEth * feeMultiplier
      }
    } else {
      // Jual: Token → ETH
      let priceNative = 0
      if (isBase && poolAttrs.base_token_price_native_currency) {
        priceNative = parseFloat(poolAttrs.base_token_price_native_currency)
      } else if (!isBase && poolAttrs.quote_token_price_native_currency) {
        priceNative = parseFloat(poolAttrs.quote_token_price_native_currency)
      }

      if (priceNative > 0) {
        amountOut = amount * priceNative * feeMultiplier
      }
    }

    if (amountOut <= 0) {
      return NextResponse.json({ error: 'Tidak bisa menghitung estimasi output' }, { status: 400 })
    }

    const decimalsOut = isBuy ? (tokenDecimals || 18) : 18

    return NextResponse.json({
      amountOut: amountOut.toString(),
      ethPriceUsd,
      feePct,
      poolAddress: poolAddr,
      decimalsOut,
      source: 'geckoterminal',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quote gagal'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
