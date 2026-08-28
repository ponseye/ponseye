import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { botToken } = await req.json()

    if (!botToken || typeof botToken !== 'string' || !botToken.trim()) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 })
    }

    const cleanToken = botToken.trim()

    // Call Telegram getMe API
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        {
          error: data.description || 'Invalid Telegram Bot Token',
          ok: false,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      bot: {
        id: data.result.id,
        firstName: data.result.first_name,
        username: data.result.username,
        canJoinGroups: data.result.can_join_groups,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to verify Telegram bot'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
