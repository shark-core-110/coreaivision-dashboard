import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/admin'

interface TaskNotifyParams {
  title:      string
  assignedTo: string
  section:    string | null
  priority:   string | null
  dueDate:    string | null
  createdBy:  string
  notes:      string | null
}

async function notifySlack(p: TaskNotifyParams): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return
  try {
    const due      = p.dueDate  ? ` · Due ${new Date(p.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''
    const section  = p.section  ? ` · ${p.section}`  : ''
    const priority = p.priority ? ` · ${p.priority}` : ''
    const notes    = p.notes    ? `\n>${p.notes}`     : ''
    const text     = `📋 *New task assigned to ${p.assignedTo}* by ${p.createdBy}\n>${p.title}${section}${priority}${due}${notes}`
    await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ text }),
    })
  } catch { /* non-fatal */ }
}

async function createNotionTask(p: TaskNotifyParams): Promise<void> {
  const token = process.env.NOTION_TOKEN
  const dbId  = process.env.NOTION_TASKS_DB_ID
  if (!token || !dbId) return
  try {
    const notionTitle = `${p.assignedTo} — ${p.title}`
    const properties: Record<string, unknown> = {
      Task:   { title:  [{ text: { content: notionTitle } }] },
      Status: { status: { name: 'Not started' } },
    }
    if (p.dueDate)  properties['Due']      = { date:      { start: p.dueDate } }
    if (p.section)  properties['Type']     = { select:    { name: p.section  } }
    if (p.priority) properties['Priority'] = { select:    { name: p.priority } }
    if (p.notes)    properties['Notes']    = { rich_text: [{ text: { content: p.notes } }] }

    await fetch('https://api.notion.com/v1/pages', {
      method:  'POST',
      headers: {
        Authorization:    `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type':   'application/json',
      },
      body: JSON.stringify({ parent: { database_id: dbId }, properties }),
    })
  } catch { /* non-fatal */ }
}

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

  // Fire-and-forget — none of these block the response
  void svc.from('activity_log').insert({
    entity_type:     'task',
    entity_id:       data.id,
    action:          'created',
    description:     `Task assigned to ${assigned_to ?? 'unassigned'}: "${title}"`,
    changed_by:      String(created_by ?? 'Shark'),
    changed_by_type: 'admin',
  })

  const notifyParams: TaskNotifyParams = {
    title:      String(title).trim(),
    assignedTo: String(assigned_to ?? 'Unassigned'),
    section:    section    ? String(section)    : null,
    priority:   priority   ? String(priority)   : null,
    dueDate:    due_date   ? String(due_date)   : null,
    notes:      notes      ? String(notes)      : null,
    createdBy:  String(created_by ?? 'Shark'),
  }

  void notifySlack(notifyParams)
  void createNotionTask(notifyParams)

  return NextResponse.json({ data }, { status: 201 })
}
