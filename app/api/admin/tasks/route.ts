import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/admin'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email ?? '') ? user : null
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const assignedTo = searchParams.get('assigned_to')

  let query = db()
    .from('tasks')
    .select('id, title, section, status, due_date, priority, notes, assigned_to')
    .neq('status', 'done')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (assignedTo) query = query.ilike('assigned_to', assignedTo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>
  const { title, section, priority, due_date, notes, assigned_to, created_by } = body

  if (!title || typeof title !== 'string' || !String(title).trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const svc = db()
  const { data, error } = await svc
    .from('tasks')
    .insert({
      title:        String(title).trim(),
      project_name: section || 'General',
      section:      section || 'General',
      status:       'todo',
      priority:     priority ?? 'Medium',
      due_date:     due_date ?? null,
      notes:        notes   ?? null,
      assigned_to:  assigned_to ?? null,
      created_by:   created_by  ?? 'Shark',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await svc.from('activity_log').insert({
    entity_type:     'task',
    entity_id:       data.id,
    action:          'created',
    description:     `Task assigned to ${assigned_to ?? 'unassigned'}: "${title}"`,
    changed_by:      String(created_by ?? 'Shark'),
    changed_by_type: 'admin',
  }).then(() => {}).catch(() => {})

  return NextResponse.json({ data }, { status: 201 })
}
