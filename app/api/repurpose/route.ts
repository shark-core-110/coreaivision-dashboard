import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a content strategist for CoreAI Vision — an AI-driven creative studio producing short-form video content (Reels, TikToks, YouTube Shorts) and AI-generated content. The brand voice is sharp, confident, and direct. No fluff. The team uses AI tools: Seedance, Kling, HeyGen, Lyra (AI influencer), Claude Ops.

Content framework:
- Hook types: Pattern Interrupt, Bold Claim, Question, Curiosity Gap, Controversy, Relatability, Before/After
- Content types: Hook / Viral, Educational, Product Demo, Brand Story, Behind the Scenes, Trending Audio
- Platforms: Reel, YouTube Short, TikTok, Carousel, Long-form, Story

When restructuring content for CoreAI Vision:
1. Hook must stop the scroll in the first 3 seconds — bold, specific, arresting
2. Body delivers value fast — no padding, no filler phrases
3. CTA is direct — one clear instruction
4. Write for spoken delivery, short punchy sentences
5. Adapt the original concept to an AI / creative / tech angle where relevant`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in .env.local' },
      { status: 500 }
    )
  }

  const body = await req.json()
  const { mode, reelUrl, description, platform, contentType, hookType, messages } = body

  if (mode === 'restructure') {
    const userPrompt = `Restructure this Instagram reel for CoreAI Vision's account.

Original reel URL: ${reelUrl || 'not provided'}
What the reel covers: ${description}
Target platform: ${platform}
Content type: ${contentType}
Hook style to use: ${hookType}

Return ONLY valid JSON in this exact shape with no extra text:
{
  "title": "short working title for the script",
  "hook": "opening line — stops scroll in 3 seconds, max 2 sentences",
  "body": "main content — 3-6 punchy sentences, adapted for AI/creative angle",
  "cta": "call to action — one direct sentence",
  "caption": "suggested social caption with relevant hashtags"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    try {
      const match = text.match(/\{[\s\S]*\}/)
      const parsed = match ? JSON.parse(match[0]) : null
      if (!parsed) throw new Error('no JSON')
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
    }
  }

  if (mode === 'chat') {
    const chatMessages = (messages ?? []).map(
      (m: { role: string; content: string }) => ({ role: m.role, content: m.content })
    )

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1024,
        system:     SYSTEM_PROMPT + '\n\nYou are helping the CoreAI Vision team refine scripts, generate new ideas, write hook variations, and prepare content for the production pipeline. Be concise and actionable. Format scripts and hooks clearly with labels like HOOK:, BODY:, CTA: when writing full scripts.',
        messages:   chatMessages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? ''
    return NextResponse.json({ reply })
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
}
