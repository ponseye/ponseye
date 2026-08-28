import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { botToken, chatId, message, parseMode = 'HTML', disableWebPagePreview = false } = await req.json()

    if (!botToken || !chatId || !message) {
      return NextResponse.json(
        { error: 'botToken, chatId, and message are required' },
        { status: 400 }
      )
    }

    const cleanToken = String(botToken).trim()
    const cleanChatId = String(chatId).trim()

    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: parseMode,
        link_preview_options: {
          is_disabled: disableWebPagePreview,
        },
      }),
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        {
          error: data.description || 'Failed to send message via Telegram',
          ok: false,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      messageId: data.result?.message_id,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
