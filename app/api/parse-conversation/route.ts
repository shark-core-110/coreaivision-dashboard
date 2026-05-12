import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

interface ExtractedTask {
  title:        string
  assigned_to:  string | null
  project_name: string | null
  section:      string
  due_date:     string | null
  priority:     'high' | 'medium' | 'low'
  notes:        string | null
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SYSTEM_PROMPT = `You extract tasks and action items from conversations.
Return ONLY valid JSON — no markdown, no explanation, no extra text.

Team members (map names/initials to these exact strings):
- Shark / owner / me / I → "Shark"
- KR / Krishanu → "Krishanu"
- PK / Pushkar → "Pushkar"
- AK / Akib → "Akib"
- PA / Padmanav → "Padmanav"
- NI / Niraj → "Niraj"
- SJ / Sanjukta → "Sanjukta"
- JO / Joyeeta → "Joyeeta"

Rules:
- If no person is mentioned, assigned_to is null
- If no project is clear, project_name is null and section is "General"
- due_date must be YYYY-MM-DD or null. Convert relative dates (tomorrow, Friday) using today: ${new Date().toISOString().split('T')[0]}
- priority: "high" if urgent/ASAP/critical/blocking, "low" if vague/nice-to-have, else "medium"
- section options: Content, Client Work, Ops, Marketing, Tech, General
- Only extract real action items — skip casual chat or questions with no follow-up

Return this exact JSON structure:
{
  "tasks": [
    {
      "title": "clear imperative action item",
      "assigned_to": "Name or null",
      "project_name": "project name or null",
      "section": "one of the section options above",
      "due_date": "YYYY-MM-DD or null",
      "priority": "high|medium|low",
      "notes": "brief extra context or null"
    }
  ]
}`

export async function POST(request: Request) {
  const body = await request.json() as {
    action:        'parse' | 'save'
    conversation?: string
    source?:       string
    tasks?:        ExtractedTask[]
  }

  // ── Save confirmed tasks to Supabase ──────────────────────────────────────
  if (body.action === 'save') {
    if (!body.tasks?.length) {
      return NextResponse.json({ error: 'No tasks provided' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const rows = body.tasks.map(t => ({
      title:        t.title,
      section:      t.section || 'General',
      project_name: t.project_name ?? t.section ?? 'General',
      assigned_to:  t.assigned_to,
      due_date:     t.due_date,
      status:       'todo',
      created_by:   'AI Parse',
    }))

    const { data, error } = await supabase.from('tasks').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('activity_log').insert({
      entity_type:     'task',
      entity_id:       (data as {id: string}[])[0]?.id ?? null,
      action:          'bulk_created',
      description:     `${rows.length} task${rows.length !== 1 ? 's' : ''} added via AI conversation parser`,
      changed_by:      'AI Parse',
      changed_by_type: 'ai',
    })

    return NextResponse.json({ count: rows.length }, { status: 201 })
  }

  // ── Parse conversation with Claude ────────────────────────────────────────
  if (!body.conversation?.trim()) {
    return NextResponse.json({ error: 'Conversation text is required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured on this server' },
      { status: 500 }
    )
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 2048,
    system:     SYSTEM_PROMPT,
    messages: [{
      role:    'user',
      content: `Source: ${body.source ?? 'unknown'}\n\n${body.conversation.trim()}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  let parsed: { tasks: ExtractedTask[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json(
      { error: 'AI returned malformed JSON — try again', raw },
      { status: 500 }
    )
  }

  return NextResponse.json({ tasks: parsed.tasks ?? [] })
}
