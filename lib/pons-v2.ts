import {
  createPublicClient,
  http,
  getAddress,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  parseAbi,
  zeroAddress,
} from 'viem'
import { robinhoodChain } from './chains'

export const PONS_V2_FACTORY = '0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e' as `0x${string}`
export const MEME_HOOK        = '0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044' as `0x${string}`
export const WETH             = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73' as `0x${string}`
export const USDG             = '0x5fc5360d0400a0fd4f2af552add042d716f1d168' as `0x${string}`
export const WETH_USDG_POOL   = '0x52e65b17fb6e5ba00ed806f37afcd2daa50271ca' as `0x${string}`

export const FACTORY_ABI = parseAbi([
  'struct LaunchedToken { address token; address curve; address deployer; address creatorFeeRecipient; address pairToken; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; uint16 creatorTaxBps; bool buybackEnabled; uint8 phase; uint256 sweptQuote; uint256 sweptTokens; uint256 sweptAt; bool exists; }',
  'function getLaunchedToken(address token) view returns (LaunchedToken)',
])

export const PONS_CURVE_ABI = parseAbi([
  'function buy(uint256 quoteIn, uint256 minTokensOut, address recipient) payable returns (uint256 tokensOut)',
  'function sell(uint256 tokensIn, uint256 minQuoteOut, address recipient) returns (uint256 quoteOut)',
  'function isNativeQuote() view returns (bool)',
  'function pairToken() view returns (address)',
  'function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)',
  'function sellableTokens() view returns (uint256)',
  'function feeBps() view returns (uint256)',
  'function creatorTaxBps() view returns (uint256)',
  'function currentSnipeTaxBps(address recipient) view returns (uint256)',
])

const rpcClient = createPublicClient({
  chain: robinhoodChain,
  transport: http('https://robinhood-rpc.publicnode.com'),
})

export interface PonsV2PoolKey {
  currency0: `0x${string}`
  currency1: `0x${string}`
  fee: number
  tickSpacing: number
  hooks: `0x${string}`
}

export interface PonsV2TokenInfo {
  tokenAddress: `0x${string}`
  dexType: 'pons-v2'
  phase: number // 0 = NotGraduated (bonding curve), 1 = Swept (transition), 2 = PoolCreated (Uniswap V4), 3 = Rescued
  curveAddress: `0x${string}`
  creatorAddress: `0x${string}`
  pairToken: `0x${string}`
  poolFee: number
  tickSpacing: number
  creatorTaxBps: number
  graduationThreshold: string
  poolAddress: `0x${string}` | null
  poolId: `0x${string}` | null
  poolKey: PonsV2PoolKey | null
  route: 'BONDING_CURVE' | 'UNISWAP_V4' | 'TRANSITION' | 'RESCUED'
  isUsdgPaired: boolean
  isNative: boolean
  priceNative: number
  priceUsd: number
  quoteReserve?: string
  tokenReserve?: string
}

/**
 * Derives Uniswap V4 PoolKey with strictly sorted currency0 < currency1
 */
export function getPonsV2PoolKey(
  tokenA: string,
  tokenB: string,
  poolFee: number,
  tickSpacing: number,
  hooks: string = MEME_HOOK
): PonsV2PoolKey {
  const addrA = getAddress(tokenA)
  const addrB = getAddress(tokenB)
  const isLower = addrA.toLowerCase() < addrB.toLowerCase()

  return {
    currency0: isLower ? addrA : addrB,
    currency1: isLower ? addrB : addrA,
    fee: poolFee,
    tickSpacing: tickSpacing,
    hooks: getAddress(hooks),
  }
}

/**
 * Derives Uniswap V4 PoolId = keccak256(abi.encode(poolKey))
 */
export function getPonsV2PoolId(poolKey: PonsV2PoolKey): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters('address, address, uint24, int24, address'),
    [
      poolKey.currency0,
      poolKey.currency1,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks,
    ]
  )
  return keccak256(encoded)
}

/**
 * Resolves Pons V2 Token Info directly on-chain via getLaunchedToken(tokenAddress)
 */
export async function getPonsTokenInfo(tokenAddress: string): Promise<PonsV2TokenInfo | null> {
  try {
    const cleanToken = getAddress(tokenAddress)

    const launched = await rpcClient.readContract({
      address: PONS_V2_FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getLaunchedToken',
      args: [cleanToken],
    }).catch(() => null)

    if (
      !launched ||
      !launched.exists ||
      !launched.curve ||
      launched.curve === zeroAddress ||
      launched.curve === '0x0000000000000000000000000000000000000000'
    ) {
      return null
    }

    const token = getAddress(launched.token)
    const curveAddress = getAddress(launched.curve)
    const creatorAddress = getAddress(launched.deployer)
    const pairToken = getAddress(launched.pairToken)
    const poolFee = Number(launched.poolFee)
    const tickSpacing = Number(launched.tickSpacing)
    const creatorTaxBps = Number(launched.creatorTaxBps)
    const phase = Number(launched.phase)
    const graduationThreshold = launched.graduationThreshold.toString()

    const isNative = pairToken === zeroAddress || pairToken === '0x0000000000000000000000000000000000000000'
    const isUsdgPaired = pairToken.toLowerCase() === USDG.toLowerCase()

    let poolAddress: `0x${string}` | null = null
    let poolId: `0x${string}` | null = null
    let poolKey: PonsV2PoolKey | null = null
    let route: 'BONDING_CURVE' | 'UNISWAP_V4' | 'TRANSITION' | 'RESCUED' = 'BONDING_CURVE'

    if (phase === 0) {
      route = 'BONDING_CURVE'
    } else if (phase === 2) {
      route = 'UNISWAP_V4'
      const pair = isNative ? WETH : pairToken
      poolKey = getPonsV2PoolKey(token, pair, poolFee, tickSpacing, MEME_HOOK)
      poolId = getPonsV2PoolId(poolKey)
      poolAddress = poolId
    } else if (phase === 1) {
      route = 'TRANSITION'
    } else if (phase === 3) {
      route = 'RESCUED'
    }

    // Read price and reserves from bonding curve
    let priceNative = 0
    let priceUsd = 0
    const ethPriceUsd = 2500
    let quoteResStr = '0'
    let tokResStr = '0'

    try {
      const reserves = await rpcClient.readContract({
        address: curveAddress,
        abi: PONS_CURVE_ABI,
        functionName: 'getReserves',
      }).catch(() => null)

      if (reserves && reserves[0] > 0n && reserves[1] > 0n) {
        quoteResStr = reserves[0].toString()
        tokResStr = reserves[1].toString()

        if (isNative) {
          // Native ETH quote: quoteReserve is in wei (18 decimals), tokenReserve is 18 decimals
          priceNative = Number(reserves[0]) / Number(reserves[1])
          priceUsd = priceNative * ethPriceUsd
        } else if (isUsdgPaired) {
          // USDG quote: quoteReserve is 6 decimals, tokenReserve is 18 decimals
          const quoteUsd = Number(reserves[0]) / 1e6
          const tokens = Number(reserves[1]) / 1e18
          if (tokens > 0) {
            priceUsd = quoteUsd / tokens
            priceNative = priceUsd / ethPriceUsd
          }
        } else {
          priceNative = Number(reserves[0]) / Number(reserves[1])
          priceUsd = priceNative * ethPriceUsd
        }
      }
    } catch { /* ignore */ }

    if (priceNative === 0) {
      priceNative = 0.000000001
      priceUsd = priceNative * ethPriceUsd
    }

    const info: PonsV2TokenInfo = {
      tokenAddress: token,
      dexType: 'pons-v2',
      phase,
      curveAddress,
      creatorAddress,
      pairToken,
      poolFee,
      tickSpacing,
      creatorTaxBps,
      graduationThreshold,
      poolAddress,
      poolId,
      poolKey,
      route,
      isUsdgPaired,
      isNative,
      priceNative,
      priceUsd,
      quoteReserve: quoteResStr,
      tokenReserve: tokResStr,
    }

    console.log(`[PONS V2]
Token: ${info.tokenAddress}
Phase: ${info.phase}
Curve: ${info.curveAddress}
Pair Token: ${info.pairToken} (isNative: ${info.isNative})
Pool Fee: ${info.poolFee}
Tick Spacing: ${info.tickSpacing}
Price Native: ${info.priceNative} ETH
Price USD: $${info.priceUsd}
Route: ${info.route}`)

    return info
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[PONS V2] Error fetching info for ${tokenAddress}:`, msg)
    return null
  }
}
