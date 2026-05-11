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
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
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

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { data, error } = await db()
    .from('task_references')
    .select('*')
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as Record<string, unknown>

  const { data, error } = await db()
    .from('task_references')
    .insert({
      task_id:       id,
      label:         body.label         ?? null,
      ref_type:      body.ref_type      ?? 'url',
      url:           body.url           ?? null,
      file_path:     body.file_path     ?? null,
      file_name:     body.file_name     ?? null,
      file_mime:     body.file_mime     ?? null,
      preview_title: body.preview_title ?? null,
      preview_image: body.preview_image ?? null,
      platform:      body.platform      ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: taskId } = await params
  const { searchParams } = new URL(request.url)
  const refId = searchParams.get('ref_id')
  if (!refId) return NextResponse.json({ error: 'ref_id required' }, { status: 400 })

  const { error } = await db()
    .from('task_references')
    .delete()
    .eq('id', refId)
    .eq('task_id', taskId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
