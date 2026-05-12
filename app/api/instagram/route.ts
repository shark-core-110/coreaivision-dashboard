import { NextResponse } from 'next/server'

// Cache at CDN layer for 30 minutes — avoids hammering the API on every visit
export const revalidate = 1800

const IG_BASE = 'https://graph.instagram.com'

export interface IGAccount {
  id:              string
  username:        string
  followers_count: number
  following_count: number
  media_count:     number
}

export interface IGPost {
  id:             string
  media_type:     'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url:      string
  thumbnail_url?: string
  permalink:      string
  caption?:       string
  timestamp:      string   // ISO 8601 from Instagram
  like_count:     number
  comments_count: number
}

export interface IGResponse {
  configured: boolean
  account?:   IGAccount
  posts?:     IGPost[]
  error?:     string
}

export async function GET(): Promise<NextResponse<IGResponse>> {
  const token  = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID

  // Return configured:false so the page can show a setup prompt
  if (!token || !userId) {
    return NextResponse.json({ configured: false })
  }

  try {
    const accountFields = 'id,username,followers_count,following_count,media_count'
    const mediaFields   = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'

    const [accountRes, mediaRes] = await Promise.all([
      fetch(`${IG_BASE}/${userId}?fields=${accountFields}&access_token=${token}`, { next: { revalidate: 1800 } }),
      fetch(`${IG_BASE}/${userId}/media?fields=${mediaFields}&limit=12&access_token=${token}`, { next: { revalidate: 1800 } }),
    ])

    if (!accountRes.ok) {
      const errBody = await accountRes.json() as { error?: { message?: string } }
      return NextResponse.json(
        { configured: true, error: errBody.error?.message ?? 'Instagram API error' },
        { status: 502 }
      )
    }

    const account = await accountRes.json() as IGAccount
    const media   = mediaRes.ok
      ? (await mediaRes.json() as { data?: IGPost[] }).data ?? []
      : []

    return NextResponse.json({ configured: true, account, posts: media })

  } catch (e) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : 'Fetch failed' },
      { status: 500 }
    )
  }
}
