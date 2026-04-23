'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'err', text: error.message })
    } else {
      setMessage({ type: 'ok', text: 'Check your email for the login link.' })
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-wordmark">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          Core AI Vision
        </div>
        <div className="login-sub">Command Center · Internal Access</div>
        <form onSubmit={handleLogin}>
          <label className="login-label">Email address</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@coreaivision.com"
            required
          />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send Login Link'}
          </button>
        </form>
        {message && (
          <div className={`login-msg login-msg-${message.type}`}>{message.text}</div>
        )}
      </div>
    </div>
  )
}
