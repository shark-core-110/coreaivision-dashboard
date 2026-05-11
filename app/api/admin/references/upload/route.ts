import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/admin'

const BUCKET = 'task-references'

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

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function ensureBucket() {
  const client = svc()
  const { error } = await client.storage.createBucket(BUCKET, { public: true })
  // ignore if bucket already exists
  if (error && !error.message.toLowerCase().includes('already exist') && !error.message.includes('duplicate')) {
    throw error
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  const bytes    = await file.arrayBuffer()
  const buffer   = Buffer.from(bytes)
  const ext      = file.name.split('.').pop() ?? 'bin'
  const safeName = `${crypto.randomUUID()}.${ext}`
  const filePath = `uploads/${safeName}`

  await ensureBucket()

  const client = svc()
  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = client.storage.from(BUCKET).getPublicUrl(filePath)

  return NextResponse.json({
    url:      publicUrl,
    fileName: file.name,
    fileMime: file.type,
    filePath,
  })
}
