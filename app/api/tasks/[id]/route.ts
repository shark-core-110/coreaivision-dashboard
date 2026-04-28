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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json() as Record<string, unknown>
  const { status, title, updated_by = 'Claude' } = body

  const updates: Record<string, unknown> = {
    updated_by: String(updated_by),
    updated_at: new Date().toISOString(),
  }
  if (status !== undefined) updates.status = status
  if (title  !== undefined) updates.title  = title

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: id,
    action: status ? 'status_change' : 'update',
    description: status ? `Task status → ${status}` : `Task updated by ${updated_by}`,
    changed_by: String(updated_by),
    changed_by_type: 'ai',
    metadata: body,
  })

  return NextResponse.json({ data })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}
