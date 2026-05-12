import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in .env.local' },
      { status: 500 }
    )
  }

  const { title, platform, content_type, notes, client } = await req.json() as {
    title:        string
    platform:     string
    content_type: string
    notes?:       string | null
    client?:      string | null
  }

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const prompt = `Write 3 distinct social media captions for this content piece from CoreAI Vision.

Title: ${title}
Platform: ${platform}
Content Type: ${content_type}${client ? `\nClient: ${client}` : ''}${notes ? `\nNotes: ${notes}` : ''}

Brand voice: CoreAI Vision is an AI-driven creative studio. Sharp, confident, direct. No fluff, no generic marketing speak.

Return ONLY valid JSON — an array of exactly 3 caption objects with no extra text:
[
  { "label": "Hook-forward", "caption": "...", "hashtags": "..." },
  { "label": "Educational", "caption": "...", "hashtags": "..." },
  { "label": "Direct CTA", "caption": "...", "hashtags": "..." }
]

Rules:
- Each caption is 2-4 sentences max, written for spoken/scrolled reading
- First sentence must hook immediately — no warm-up
- Hashtags: 5-8 per option, relevant to AI, content creation, and the specific topic
- Each option must feel distinct, not just rephrased versions of each other`

  const anthropic = new Anthropic({ apiKey })
  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''

  try {
    const match   = text.match(/\[[\s\S]*\]/)
    const options = match ? JSON.parse(match[0]) : []
    return NextResponse.json({ options })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
  }
}
