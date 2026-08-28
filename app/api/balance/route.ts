import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RPC_ENDPOINTS = [
  'https://robinhood-rpc.publicnode.com',
  'https://robinhood.api.pocket.network',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const address = body?.address
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    let balanceHex = '0x0'
    let fetched = false

    for (const rpc of RPC_ENDPOINTS) {
      try {
        const res = await fetch(rpc, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
          cache: 'no-store',
        })

        if (res.ok) {
          const data = await res.json()
          if (data?.result !== undefined) {
            balanceHex = data.result
            fetched = true
            break
          }
        }
      } catch {
        // try next endpoint
      }
    }

    if (!fetched) {
      return NextResponse.json({ error: 'Failed to fetch balance from Robinhood RPCs' }, { status: 502 })
    }

    const balanceWei = BigInt(balanceHex)
    const ethValue = Number(balanceWei) / 1e18

    return NextResponse.json({
      balanceWei: balanceWei.toString(),
      balanceEth: ethValue.toFixed(6),
      address,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch balance'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
