import { NextRequest, NextResponse } from 'next/server'

interface SlackNotifyBody {
  text: string
  channel?: string
  username?: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, error: 'SLACK_WEBHOOK_URL not configured' },
      { status: 200 },
    )
  }

  let body: SlackNotifyBody
  try {
    body = (await req.json()) as SlackNotifyBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.text || typeof body.text !== 'string') {
    return NextResponse.json({ ok: false, error: 'text is required' }, { status: 400 })
  }

  try {
    const payload: Record<string, string> = { text: body.text }
    if (body.channel)  payload.channel  = body.channel
    if (body.username) payload.username = body.username

    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ ok: false, error: `Slack error: ${detail}` }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 200 })
  }
}
