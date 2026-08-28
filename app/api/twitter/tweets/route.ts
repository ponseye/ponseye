import { NextRequest, NextResponse } from 'next/server'
import { sanitizeUsername } from '@/lib/sniper'

export const dynamic = 'force-dynamic'

interface CachedUserInfo {
  id: string
  name?: string
  profileImageUrl?: string
}

// In-memory cache for Twitter numerical User IDs and profile metadata
const USER_CACHE = new Map<string, CachedUserInfo>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, twitterUserId: clientUserId, sinceId } = body

    if (!username) {
      return NextResponse.json(
        { error: 'Username Twitter is required' },
        { status: 400 }
      )
    }

    const cleanUsername = sanitizeUsername(username)
    const serverBearerToken = process.env.TWITTER_BEARER_TOKEN?.trim()

    if (!serverBearerToken || serverBearerToken === 'your_developer_twitter_bearer_token_here') {
      return NextResponse.json({
        username: cleanUsername,
        userId: 'dev_mock_id',
        isMock: true,
        tweets: [],
        message: 'TWITTER_BEARER_TOKEN is not configured in .env.local',
      })
    }

    let cachedUser = USER_CACHE.get(cleanUsername)
    let twitterUserId = clientUserId || cachedUser?.id

    // 1. Resolve User ID and profile picture only if not already cached
    if (!twitterUserId || !cachedUser?.profileImageUrl) {
      const userRes = await fetch(
        `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=profile_image_url,name,username`,
        {
          headers: {
            Authorization: `Bearer ${serverBearerToken}`,
          },
          cache: 'no-store',
        }
      )

      if (!userRes.ok) {
        const errText = await userRes.text()
        const resetHeader = userRes.headers.get('x-rate-limit-reset')
        const resetTimestamp = resetHeader ? parseInt(resetHeader) : 0
        const resetInSeconds = resetTimestamp ? Math.max(1, resetTimestamp - Math.floor(Date.now() / 1000)) : 60

        if (userRes.status === 429) {
          return NextResponse.json(
            {
              error: `Twitter API rate limit reached. Resets in ${Math.ceil(resetInSeconds / 60)} minutes.`,
              rateLimited: true,
              resetInSeconds,
              resetTimestamp,
            },
            { status: 429 }
          )
        }

        return NextResponse.json(
          { error: `Twitter API Error (${userRes.status}): ${errText}` },
          { status: userRes.status }
        )
      }

      const userData = await userRes.json()
      const userObj = userData?.data

      if (!userObj?.id) {
        return NextResponse.json(
          { error: `Twitter account @${cleanUsername} not found` },
          { status: 404 }
        )
      }

      twitterUserId = userObj.id
      cachedUser = {
        id: userObj.id,
        name: userObj.name,
        profileImageUrl: userObj.profile_image_url?.replace('_normal', '_bigger') || userObj.profile_image_url,
      }

      USER_CACHE.set(cleanUsername, cachedUser)
    }

    // 2. Fetch latest tweets from the user's timeline with author expansions (include replies so CA in replies/threads are captured)
    let tweetsUrl = `https://api.twitter.com/2/users/${twitterUserId}/tweets?max_results=10&exclude=retweets&expansions=author_id&user.fields=profile_image_url,name,username&tweet.fields=created_at,text`
    if (sinceId) {
      tweetsUrl += `&since_id=${sinceId}`
    }

    const tweetsRes = await fetch(tweetsUrl, {
      headers: {
        Authorization: `Bearer ${serverBearerToken}`,
      },
      cache: 'no-store',
    })

    if (!tweetsRes.ok) {
      const errText = await tweetsRes.text()
      const resetHeader = tweetsRes.headers.get('x-rate-limit-reset')
      const resetTimestamp = resetHeader ? parseInt(resetHeader) : 0
      const resetInSeconds = resetTimestamp ? Math.max(1, resetTimestamp - Math.floor(Date.now() / 1000)) : 60

      if (tweetsRes.status === 429) {
        return NextResponse.json(
          {
            error: `Twitter API rate limit reached. Resets in ${Math.ceil(resetInSeconds / 60)} minutes.`,
            rateLimited: true,
            resetInSeconds,
            resetTimestamp,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Failed to fetch tweets: ${errText}` },
        { status: tweetsRes.status }
      )
    }

    const tweetsData = await tweetsRes.json()
    const tweets = tweetsData?.data || []
    const includesUsers = tweetsData?.includes?.users || []

    const authorUser = includesUsers.find((u: { id: string }) => u.id === twitterUserId) || cachedUser

    const profileImageUrl = authorUser?.profile_image_url?.replace('_normal', '_bigger') || authorUser?.profileImageUrl || cachedUser?.profileImageUrl
    const displayName = authorUser?.name || cachedUser?.name || cleanUsername

    return NextResponse.json({
      username: cleanUsername,
      userId: twitterUserId,
      displayName,
      profileImageUrl,
      tweets: tweets.map((t: { id: string; text: string; created_at: string }) => ({
        id: t.id,
        text: t.text,
        createdAt: t.created_at,
        username: cleanUsername,
        displayName,
        profileImageUrl,
      })),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
