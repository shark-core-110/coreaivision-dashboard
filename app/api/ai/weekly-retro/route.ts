import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in .env.local' },
      { status: 500 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sb          = createClient(supabaseUrl, serviceKey)

  const sevenDaysAgo     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgoDate = sevenDaysAgo.slice(0, 10)

  const [{ data: updates }, { data: posted }, { data: activity }] = await Promise.all([
    sb
      .from('updates')
      .select('content, author, update_type, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false }),
    sb
      .from('content_calendar')
      .select('title, platform, client, prod_status, date')
      .eq('prod_status', 'posted')
      .gte('date', sevenDaysAgoDate),
    sb
      .from('activity_log')
      .select('description, changed_by, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const updateLines   = (updates ?? []).map(u => `[${u.update_type}] ${u.author}: ${u.content}`).join('\n') || 'None this week'
  const postedLines   = (posted ?? []).map(p => `${p.title} (${p.platform}${p.client ? ` for ${p.client}` : ''})`).join('\n') || 'None posted this week'
  const activityLines = (activity ?? []).slice(0, 20).map(a => `${a.changed_by}: ${a.description}`).join('\n') || 'No activity logged'

  const prompt = `Generate a weekly retro for CoreAI Vision based on real data from the past 7 days.

UPDATES POSTED:
${updateLines}

CONTENT PUBLISHED:
${postedLines}

ACTIVITY LOG:
${activityLines}

Write a structured weekly retro in markdown. Sections:
## This Week's Output
## Key Decisions & Changes
## What Moved the Needle
## Blockers & Friction Points
## Focus for Next Week

Rules: Be specific, reference the actual data above, 3-5 bullets per section, no filler language, no vague statements. If a section has no data, say so in one line.`

  const anthropic = new Anthropic({ apiKey })
  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1200,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''

  // Save as a weekly update so the team can see it in the Updates feed
  await sb.from('updates').insert({
    content:     text,
    author:      'Claude AI',
    author_type: 'ai',
    update_type: 'weekly',
  })

  return NextResponse.json({ retro: text })
}
