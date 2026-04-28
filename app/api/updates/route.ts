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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const type  = searchParams.get('type')

  const supabase = getServiceClient()
  let query = supabase
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('update_type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as Record<string, unknown>
  const {
    content,
    author      = 'Claude',
    author_type = 'ai',
    update_type = 'daily',
  } = body

  if (!content || String(content).trim() === '') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('updates')
    .insert({
      content:     String(content).trim(),
      author:      String(author),
      author_type: String(author_type),
      update_type: String(update_type),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
