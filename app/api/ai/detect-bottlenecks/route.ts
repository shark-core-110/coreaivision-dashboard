import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sb          = createClient(supabaseUrl, serviceKey)

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleTasks, error: tasksError } = await sb
    .from('tasks')
    .select('id, title, assigned_to, updated_at')
    .eq('status', 'in_progress')
    .lt('updated_at', fiveDaysAgo)

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  if (!staleTasks?.length) {
    return NextResponse.json({ created: 0, message: 'No stalled tasks found — pipeline is moving.' })
  }

  // Fetch existing unresolved bottlenecks to skip duplicates
  const { data: existing } = await sb
    .from('bottlenecks')
    .select('text')
    .eq('resolved', false)

  const existingTexts = new Set(
    (existing ?? []).map(b => (b.text as string).toLowerCase())
  )

  const toInsert = staleTasks
    .filter(t => !existingTexts.has(`stalled task: ${(t.title as string).toLowerCase()}`))
    .map(t => ({
      text:     `Stalled task: ${t.title as string}`,
      severity: 'med',
      owner:    (t.assigned_to as string | null) ?? null,
      scope:    'overview',
      resolved: false,
    }))

  if (!toInsert.length) {
    return NextResponse.json({ created: 0, message: 'All stalled tasks are already flagged as bottlenecks.' })
  }

  const { error: insertError } = await sb.from('bottlenecks').insert(toInsert)
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    created: toInsert.length,
    tasks:   toInsert.map(t => t.text),
  })
}
