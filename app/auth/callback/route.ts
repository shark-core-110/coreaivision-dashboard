import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const hasName = !!(user?.user_metadata?.full_name as string | undefined)
      const isAdmin = isAdminEmail(user?.email ?? '')

      if (!hasName) return NextResponse.redirect(`${origin}/dashboard/onboarding`)
      if (isAdmin) return NextResponse.redirect(`${origin}/dashboard`)
      return NextResponse.redirect(`${origin}/dashboard/my`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
