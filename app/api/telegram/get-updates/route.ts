import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: {
      id: number
      is_bot: boolean
      first_name?: string
      last_name?: string
      username?: string
    }
    chat?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      type: string
    }
    text?: string
    date: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const { botToken } = await req.json()

    if (!botToken || typeof botToken !== 'string' || !botToken.trim()) {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 })
    }

    const cleanToken = botToken.trim()

    // Call Telegram getUpdates API (limit to last 20 messages)
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates?limit=20&allowed_updates=["message"]`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        {
          error: data.description || 'Failed to fetch updates from Telegram',
          ok: false,
        },
        { status: 400 }
      )
    }

    const updates: TelegramUpdate[] = data.result || []
    
    // Find unique chats from messages in reverse order (most recent first)
    const chatsMap = new Map<number, {
      chatId: string
      username?: string
      firstName?: string
      lastMessageText?: string
      date: number
    }>()

    for (let i = updates.length - 1; i >= 0; i--) {
      const msg = updates[i].message
      if (msg && msg.chat) {
        const cId = msg.chat.id
        if (!chatsMap.has(cId)) {
          chatsMap.set(cId, {
            chatId: String(cId),
            username: msg.from?.username || msg.chat.username,
            firstName: msg.from?.first_name || msg.chat.first_name,
            lastMessageText: msg.text,
            date: msg.date,
          })
        }
      }
    }

    const recentChats = Array.from(chatsMap.values())

    return NextResponse.json({
      ok: true,
      recentChats,
      latestChat: recentChats[0] || null,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch updates'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
