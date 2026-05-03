'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const router = useRouter()

  // Already named → skip straight to personal dashboard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const existing = data.user?.user_metadata?.full_name as string | undefined
      if (existing) router.replace('/dashboard/my')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setErr('Enter your first name'); return }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } })

    if (error) {
      setErr('Could not save — try again')
      setSaving(false)
      return
    }

    router.push('/dashboard/my')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--s2)',
        border: '1px solid var(--b1)',
        borderRadius: 16,
        padding: '52px 44px',
        width: '100%',
        maxWidth: 440,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>◈</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink1)', marginBottom: 6 }}>
          Welcome to Core AI Vision
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 36, lineHeight: 1.6 }}>
          Enter your first name so Shark can assign tasks to you
          and your personal dashboard loads correctly.
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your first name — e.g. Niraj"
            value={name}
            onChange={(e) => { setName(e.target.value); setErr('') }}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg)',
              border: `1px solid ${err ? 'var(--red)' : 'var(--b1)'}`,
              borderRadius: 8,
              color: 'var(--ink1)',
              fontSize: 15,
              marginBottom: 10,
              boxSizing: 'border-box' as const,
              outline: 'none',
            }}
          />

          {err && (
            <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '13px',
              background: saving ? 'var(--b1)' : 'var(--blue)',
              border: 'none',
              borderRadius: 8,
              color: saving ? 'var(--ink3)' : '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Saving…' : 'Enter Dashboard →'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ink4)' }}>
          You only do this once. Next time you visit, you go straight in.
        </div>
      </div>
    </div>
  )
}
