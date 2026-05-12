'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode]         = useState<Mode>('signin')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.href = '/dashboard'
    })
    return () => subscription.unsubscribe()
  }, [])

  const switchMode = (next: Mode) => {
    setMode(next)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const trimmedName = name.trim()

    if (mode === 'signup') {
      if (!trimmedName) {
        setMessage({ type: 'err', text: 'Your name is required to create an account.' })
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: trimmedName } },
      })
      setLoading(false)
      if (error) {
        setMessage({ type: 'err', text: error.message })
      } else {
        setMessage({ type: 'ok', text: 'Account created — check your email to confirm, then sign in.' })
      }
      return
    }

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setMessage({ type: 'err', text: error.message })
      return
    }
    // Update display name in metadata if provided
    if (data.session && trimmedName) {
      await supabase.auth.updateUser({ data: { full_name: trimmedName } })
    }
    window.location.href = '/dashboard'
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-wordmark">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          Core AI Vision
        </div>
        <div className="login-sub">Command Center · Internal Access</div>

        <div className="login-mode-toggle">
          <button
            type="button"
            className={`login-mode-btn${mode === 'signin' ? ' active' : ''}`}
            onClick={() => switchMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`login-mode-btn${mode === 'signup' ? ' active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Join Team
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="login-label">Email Address</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@coreaivision.com"
            autoComplete="email"
            required
          />

          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />

          <label className="login-label">
            Your Name
            {mode === 'signin' && <span className="login-label-hint"> — updates your profile</span>}
          </label>
          <input
            className="login-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Krishanu"
            autoComplete="name"
            required={mode === 'signup'}
          />

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? '…'
              : mode === 'signin'
              ? 'Enter Command Center →'
              : 'Create Account →'}
          </button>
        </form>

        {message && (
          <div className={`login-msg login-msg-${message.type}`}>{message.text}</div>
        )}

        <div className="login-switch">
          {mode === 'signin' ? (
            <>New team member?{' '}
              <button type="button" className="login-switch-btn" onClick={() => switchMode('signup')}>
                Create Account
              </button>
            </>
          ) : (
            <>Already have access?{' '}
              <button type="button" className="login-switch-btn" onClick={() => switchMode('signin')}>
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
