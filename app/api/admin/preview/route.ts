import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email ?? '') ? user : null
}

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url))  return 'youtube'
  if (/tiktok\.com/.test(url))             return 'tiktok'
  if (/instagram\.com/.test(url))          return 'instagram'
  if (/drive\.google\.com/.test(url))      return 'drive'
  if (/docs\.google\.com/.test(url))       return 'docs'
  if (/notion\.so/.test(url))              return 'notion'
  if (/figma\.com/.test(url))              return 'figma'
  return 'web'
}

async function fetchYouTube(url: string) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  const d = await res.json() as { title: string; thumbnail_url: string }
  return { title: d.title, thumbnail: d.thumbnail_url }
}

async function fetchTikTok(url: string) {
  const res = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  const d = await res.json() as { title: string; thumbnail_url: string }
  return { title: d.title, thumbnail: d.thumbnail_url }
}

async function fetchOGTags(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CoreAIBot/1.0)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) return null
  const html = await res.text()

  const get = (prop: string) => {
    const m =
      html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`)) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`))
    return m?.[1] ?? null
  }

  const titleTag = html.match(/<title>([^<]{1,120})<\/title>/)?.[1] ?? null

  return {
    title:     get('title') || titleTag || new URL(url).hostname,
    thumbnail: get('image') || null,
  }
}

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('url')?.trim()
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const url = raw.startsWith('http') ? raw : `https://${raw}`
  const platform = detectPlatform(url)

  try {
    let result: { title: string; thumbnail: string | null } | null = null

    if (platform === 'youtube')      result = await fetchYouTube(url)
    else if (platform === 'tiktok')  result = await fetchTikTok(url)
    else                             result = await fetchOGTags(url)

    return NextResponse.json({
      title:     result?.title     ?? new URL(url).hostname,
      thumbnail: result?.thumbnail ?? null,
      platform,
    })
  } catch {
    return NextResponse.json({ title: new URL(url).hostname, thumbnail: null, platform })
  }
}
