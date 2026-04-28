import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function authorized(request: Request): boolean {
  return request.headers.get('x-api-key') === process.env.INTERNAL_API_KEY
}

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as Record<string, unknown>
  const { title, project_name, section, status = 'todo', due_date, assigned_to, created_by = 'Claude' } = body

  if (!title || !section) {
    return NextResponse.json({ error: 'title and section are required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, project_name: project_name ?? section, section, status, due_date, assigned_to, created_by })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: data.id,
    action: 'created',
    description: `Task created: "${title}"`,
    changed_by: String(created_by),
    changed_by_type: 'ai',
  })

  return NextResponse.json({ data }, { status: 201 })
}
