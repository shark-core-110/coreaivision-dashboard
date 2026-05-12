'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Goal {
  id:            string
  title:         string
  description:   string | null
  status:        'done' | 'prog' | 'todo'
  target_label:  string | null
  display_order: number
}

const BRAND_WORDS     = ['Cinematic', 'Understated', 'Precise', 'Scroll-stopping', 'AI-native', 'Fashion-forward', 'Confident']
const CONTENT_PILLARS = ['AI tutorials', 'Lyra avatar content', 'Platform promotions', 'Micro drama reels', 'Behind the scenes', 'AI tool demos']

export default function Vision() {
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    supabase
      .from('strategic_goals')
      .select('id, title, description, status, target_label, display_order')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        if (data) setGoals(data as Goal[])
      })
    return () => { cancelled = true }
  }, [])

  const inProgress = goals.filter(g => g.status === 'prog').length
  const notStarted = goals.filter(g => g.status === 'todo').length

  return (
    <>
      {/* ── Hero stats ── */}
      <div className="hero-stat-row" style={{ marginBottom: 20 }}>
        <div className="hero-stat-block">
          <div className="hero-num">{goals.length}</div>
          <div className="hero-label">Goals</div>
          <div className="hero-trend">Q2 2026 horizon</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">{inProgress}</div>
          <div className="hero-label">In Progress</div>
          <div className="hero-trend">Reels + Lyra</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">{notStarted}</div>
          <div className="hero-label">Not Started</div>
          <div className="hero-trend hero-trend-warn">Skool · 50K · Prod house</div>
        </div>
      </div>

      {/* ── Horizontal visual timeline ── */}
      <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>Goals Timeline</div>
      <div className="htl-wrap">
        <div className="htl-track">
          {goals.map((g) => (
            <div key={g.id} className="htl-col">
              <div className="htl-date">{g.target_label ?? ''}</div>
              <div className={`htl-dot htl-dot-${g.status}`} />
              <div className={`htl-card${g.status === 'prog' ? ' htl-prog' : ''}`}>
                <div className="htl-card-title">{g.title}</div>
                <div className="htl-card-desc">{g.description ?? ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Brand DNA quote ── */}
      <div className="focus-block" style={{ borderLeftColor: 'var(--ink2)', marginBottom: 20 }}>
        <div className="focus-label">Brand DNA</div>
        <div className="focus-text" style={{ fontSize: 16, letterSpacing: '-.03em', color: 'var(--ink)', fontStyle: 'italic' }}>
          &ldquo;AI with personality. Content that doesn&apos;t bore.&rdquo;
        </div>
      </div>

      <div className="tag-row" style={{ marginBottom: 24 }}>
        {BRAND_WORDS.map(t => <span key={t} className="tag">{t}</span>)}
      </div>

      <div className="grid2">
        <div>
          <div className="sec">Tone of Voice</div>
          <div className="card">
            <div className="da-grid">
              <div className="da-card da-do">
                <div className="da-label">DO</div>
                <div className="da-item">Cinematic<br />Understated<br />Confident silence<br />Precise language<br />Not the loudest</div>
              </div>
              <div className="da-card da-avoid">
                <div className="da-label">AVOID</div>
                <div className="da-item">Hype / exclamation<br />Bold/black fonts<br />Neon gradients<br />Busy layouts<br />Lowercase everywhere</div>
              </div>
            </div>
          </div>

          <div className="sec">Content Pillars</div>
          <div className="tag-row">
            {CONTENT_PILLARS.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div>
          <div className="sec">Color Palette</div>
          <div className="card">
            <div className="swatch-row">
              <div className="swatch" style={{ background: '#0A0A0A' }}><div className="swatch-name" style={{ color: '#F0EDE8' }}>Void Black</div><div className="swatch-hex" style={{ color: '#F0EDE8' }}>#0A0A0A</div></div>
              <div className="swatch" style={{ background: '#FFFFFF', borderColor: 'rgba(0,0,0,.1)' }}><div className="swatch-name" style={{ color: '#0A0A0A' }}>Pure White</div><div className="swatch-hex" style={{ color: '#0A0A0A' }}>#FFFFFF</div></div>
              <div className="swatch" style={{ background: '#E63946' }}><div className="swatch-name">Accent Red</div><div className="swatch-hex">#E63946</div></div>
            </div>
          </div>

          <div className="sec">Visual Rules</div>
          <div className="card">
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">Never use font-weight 700+ — max is Medium 500</div></div>
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">No neon, gradient, or rainbow colors</div></div>
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">No cluttered layouts — space is intentional</div></div>
            <div className="never-item"><div className="never-x" style={{ color: 'var(--green)' }}>✓</div><div className="never-text" style={{ color: 'var(--green)' }}>Red is the only accent — used only for critical items</div></div>
            <div className="never-item"><div className="never-x" style={{ color: 'var(--green)' }}>✓</div><div className="never-text" style={{ color: 'var(--green)' }}>Every frame should feel like a still from a film</div></div>
          </div>
        </div>
      </div>
    </>
  )
}
