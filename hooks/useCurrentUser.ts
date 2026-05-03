'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/admin'

export interface CurrentUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setLoading(false)
        return
      }
      const email = data.user.email ?? ''
      const name = (data.user.user_metadata?.full_name as string) ?? ''
      const isAdmin = isAdminEmail(email)
      setUser({ id: data.user.id, email, name, isAdmin })
      setLoading(false)
    })
  }, [])

  return { user, loading }
}
