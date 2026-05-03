import { NextRequest, NextResponse } from 'next/server'

interface ParsedScript {
  title:        string
  hook:         string
  content:      string
  platform:     string
  content_type: string
  client:       string | null
}

const SYSTEM_PROMPT = `You are a script parser for CoreAI Vision, an AI-first content studio. Parse pasted content into individual scripts. Handle any format: spreadsheet rows (TSV/CSV), Google Docs with labeled sections (HOOK:, VOICEOVER:, CTA:, BODY:, SCRIPT:), numbered scripts, or free-form text.

Return ONLY a valid JSON array with no extra text. Each item:
{
  "title": "concise title (infer from content if not explicit)",
  "hook": "opening hook line or first sentence if no hook label",
  "content": "full voiceover/body/script content",
  "platform": "Reel|YouTube Short|TikTok|Carousel|Long-form|Story (guess from content or default Reel)",
  "content_type": "Hook / Viral|Educational|Product Demo|Brand Story|Behind the Scenes|Trending Audio (guess or default Hook / Viral)",
  "client": "client name if mentioned, else null"
}

If input looks like spreadsheet rows (has tabs), treat first column as title, subsequent columns as content fields. If input is a doc with multiple scripts, split them intelligently. Always return an array even for a single script.`

function mockParse(content: string): ParsedScript[] {
  const blocks = content.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)
  return blocks.map((block) => {
    const lines = block.split('\n').filter(Boolean)
    const title = lines[0]?.slice(0, 80) ?? 'Untitled Script'
    const rest  = lines.slice(1).join('\n')
    return {
      title,
      hook:         lines[1] ?? '',
      content:      rest,
      platform:     'Reel',
      content_type: 'Hook / Viral',
      client:       null,
    }
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    const scripts = mockParse(content)
    return NextResponse.json({ scripts })
  }

  let rawText = ''
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 4096,
        system:     SYSTEM_PROMPT,
        messages: [
          { role: 'user', content },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `Anthropic API error: ${response.status} ${errText}` }, { status: 502 })
    }

    const data = await response.json() as {
      content?: { type: string; text: string }[]
    }

    rawText = data.content?.find(b => b.type === 'text')?.text ?? ''
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to reach Anthropic API: ${message}` }, { status: 502 })
  }

  let scripts: ParsedScript[]
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')
    scripts = JSON.parse(jsonMatch[0]) as ParsedScript[]
    if (!Array.isArray(scripts)) throw new Error('Parsed result is not an array')
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: rawText }, { status: 502 })
  }

  return NextResponse.json({ scripts })
}
