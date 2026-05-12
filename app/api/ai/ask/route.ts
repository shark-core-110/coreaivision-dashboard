import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const TOOLS: Anthropic.Tool[] = [
  {
    name:        'query_tasks',
    description: 'Fetch tasks from the database. Can filter by status or assigned_to.',
    input_schema: {
      type: 'object',
      properties: {
        status:      { type: 'string', description: 'Filter by status: todo, in_progress, done, blocked' },
        assigned_to: { type: 'string', description: 'Filter by team member name' },
        limit:       { type: 'number', description: 'Max rows to return (default 20)' },
      },
    },
  },
  {
    name:        'query_clients',
    description: 'Fetch all active clients with their health and status.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name:        'query_calendar',
    description: 'Fetch content calendar items. Can filter by client, date range, or prod_status.',
    input_schema: {
      type: 'object',
      properties: {
        client:      { type: 'string', description: 'Filter by client name (partial match)' },
        date_from:   { type: 'string', description: 'ISO date YYYY-MM-DD' },
        date_to:     { type: 'string', description: 'ISO date YYYY-MM-DD' },
        prod_status: { type: 'string', description: 'Filter by prod_status: draft, filming, editing, scheduled, posted' },
        limit:       { type: 'number', description: 'Max rows to return (default 20)' },
      },
    },
  },
  {
    name:        'query_bottlenecks',
    description: 'Fetch active (unresolved) bottlenecks.',
    input_schema: {
      type: 'object',
      properties: {
        severity: { type: 'string', description: 'Filter by severity: crit, med, low' },
      },
    },
  },
]

async function runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sb          = createClient(supabaseUrl, serviceKey)

  if (name === 'query_tasks') {
    let q = sb.from('tasks').select('id, title, status, assigned_to, due_date, created_at')
    if (input.status)      q = q.eq('status', input.status as string)
    if (input.assigned_to) q = q.ilike('assigned_to', `%${input.assigned_to as string}%`)
    const { data } = await q.order('updated_at', { ascending: false }).limit((input.limit as number) ?? 20)
    return data ?? []
  }

  if (name === 'query_clients') {
    const { data } = await sb
      .from('clients')
      .select('id, name, status, health, monthly_value, contact_name')
      .order('name', { ascending: true })
    return data ?? []
  }

  if (name === 'query_calendar') {
    let q = sb.from('content_calendar').select('id, title, platform, prod_status, date, client, assigned_to')
    if (input.client)      q = q.ilike('client', `%${input.client as string}%`)
    if (input.prod_status) q = q.eq('prod_status', input.prod_status as string)
    if (input.date_from)   q = q.gte('date', input.date_from as string)
    if (input.date_to)     q = q.lte('date', input.date_to as string)
    const { data } = await q.order('date', { ascending: false }).limit((input.limit as number) ?? 20)
    return data ?? []
  }

  if (name === 'query_bottlenecks') {
    let q = sb.from('bottlenecks').select('id, text, severity, owner, scope').eq('resolved', false)
    if (input.severity) q = q.eq('severity', input.severity as string)
    const { data } = await q.order('created_at', { ascending: false })
    return data ?? []
  }

  return { error: 'Unknown tool' }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in .env.local' },
      { status: 500 }
    )
  }

  const { messages } = await req.json() as { messages: Anthropic.MessageParam[] }

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
  }

  const anthropic    = new Anthropic({ apiKey })
  const today        = new Date().toISOString().slice(0, 10)
  const systemPrompt = `You are the CoreAI Vision dashboard assistant. Today is ${today}.
You have access to live data via tools: tasks, clients, content calendar, and bottlenecks.
Answer questions concisely using real data from the tools. Include specific counts and names.
Keep answers to 1-3 short paragraphs unless a list is clearly better.
Never make up numbers — always query the data first.`

  let currentMessages: Anthropic.MessageParam[] = [...messages]

  // Agentic tool-use loop — runs server-side, client receives only the final text
  for (let turn = 0; turn < 5; turn++) {
    const response = await anthropic.messages.create({
      model:    'claude-haiku-4-5',
      max_tokens: 1024,
      system:   systemPrompt,
      tools:    TOOLS,
      messages: currentMessages,
    })

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('\n')
      return NextResponse.json({ reply: text })
    }

    if (response.stop_reason === 'tool_use') {
      const toolBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      currentMessages = [...currentMessages, { role: 'assistant', content: response.content }]

      const toolResults = await Promise.all(
        toolBlocks.map(async block => {
          const result = await runTool(block.name, block.input as Record<string, unknown>)
          return {
            type:        'tool_result' as const,
            tool_use_id: block.id,
            content:     JSON.stringify(result),
          }
        })
      )

      currentMessages = [...currentMessages, { role: 'user', content: toolResults }]
      continue
    }

    break
  }

  return NextResponse.json({ reply: 'Sorry, I could not complete that query. Try rephrasing.' })
}
