'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Bottleneck {
  id: string
  text: string
  severity: 'crit' | 'med' | 'low'
  owner: string | null
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function TodayFocus() {
  const { user } = useCurrentUser()

  const [date, setDate]             = useState('')
  const [dateKey, setDateKey]       = useState('')
  const [priorities, setPriorities] = useState('')
  const [notes, setNotes]           = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([])
  const [loaded, setLoaded]         = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Format today's date label + ISO key ──────────────────────────────────
  useEffect(() => {
    const now    = new Date()
    const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthsFull = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    setDate(`${days[now.getDay()]} ${now.getDate()} ${monthsFull[now.getMonth()]}`)
    setDateKey(now.toISOString().slice(0, 10))
  }, [])

  // ── Load saved focus from Supabase (or localStorage fallback) ────────────
  const loadFocus = useCallback(async () => {
    if (!dateKey) return

    if (user) {
      try {
        const sb = createClient()
        const { data } = await sb
          .from('daily_focus')
          .select('priorities, notes')
          .eq('user_id', user.id)
          .eq('date', dateKey)
          .maybeSingle()

        if (data) {
          setPriorities(data.priorities ?? '')
          setNotes(data.notes ?? '')
        } else {
          // First time today — fall back to any localStorage values
          setPriorities(localStorage.getItem('cav-priorities') ?? '')
          setNotes(localStorage.getItem('cav-notes') ?? '')
        }
      } catch {
        // Network error — fall back to localStorage
        setPriorities(localStorage.getItem('cav-priorities') ?? '')
        setNotes(localStorage.getItem('cav-notes') ?? '')
      }
    } else {
      // Not authenticated — use localStorage only
      setPriorities(localStorage.getItem('cav-priorities') ?? '')
      setNotes(localStorage.getItem('cav-notes') ?? '')
    }

    setLoaded(true)
  }, [user, dateKey])

  useEffect(() => {
    loadFocus()
  }, [loadFocus])

  // ── Load live bottlenecks ─────────────────────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    let cancelled = false
    sb.from('bottlenecks')
      .select('id, text, severity, owner')
      .eq('resolved', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setBottlenecks(data as Bottleneck[])
      })
    return () => { cancelled = true }
  }, [])

  // ── Debounced save (800 ms) ───────────────────────────────────────────────
  const save = useCallback((nextPriorities: string, nextNotes: string) => {
    // Always keep localStorage in sync as offline fallback
    localStorage.setItem('cav-priorities', nextPriorities)
    localStorage.setItem('cav-notes', nextNotes)

    if (!user || !dateKey) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')

    saveTimer.current = setTimeout(async () => {
      try {
        const sb = createClient()
        await sb.from('daily_focus').upsert(
          {
            user_id:    user.id,
            date:       dateKey,
            priorities: nextPriorities,
            notes:      nextNotes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        )
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 800)
  }, [user, dateKey])

  const handlePriorities = (val: string) => {
    setPriorities(val)
    if (loaded) save(val, notes)
  }

  const handleNotes = (val: string) => {
    setNotes(val)
    if (loaded) save(priorities, val)
  }

  // ── Severity counts ───────────────────────────────────────────────────────
  const critCount = bottlenecks.filter(b => b.severity === 'crit').length
  const medCount  = bottlenecks.filter(b => b.severity === 'med').length
  const lowCount  = bottlenecks.filter(b => b.severity === 'low').length

  const critBns = bottlenecks.filter(b => b.severity === 'crit')
  const medBns  = bottlenecks.filter(b => b.severity === 'med')

  // ── Save status label ─────────────────────────────────────────────────────
  const saveLabel =
    !user         ? 'Local only — not signed in' :
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'saved'  ? '✓ Saved' :
    saveStatus === 'error'  ? '⚠ Save failed' :
    ''

  return (
    <>
      {/* ── Banner ── */}
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <span>
          <strong style={{ color: 'var(--blue)' }}>Today&apos;s Focus</strong>
          &nbsp;&middot;&nbsp; Set your top 3 priorities each morning
          &nbsp;&middot;&nbsp; Notes sync across devices when signed in
        </span>
        {saveLabel && (
          <span style={{
            fontSize: 11,
            color: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#22c55e' : 'var(--ink4)',
          }}>
            {saveLabel}
          </span>
        )}
      </div>

      {/* ── Date header ── */}
      <div className="focus-block">
        <div className="focus-label">Today — {date}</div>
        <div className="focus-text">Top 3 priorities that must happen today. Notes and blockers below.</div>
      </div>

      {/* ── Input grid ── */}
      <div className="focus-grid">
        <div className="focus-card">
          <div className="fc-label">Top 3 Priorities</div>
          <div className="fc-title">What must happen today?</div>
          <textarea
            className="fc-textarea"
            placeholder={'1. \n2. \n3. '}
            value={priorities}
            onChange={e => handlePriorities(e.target.value)}
          />
        </div>
        <div className="focus-card">
          <div className="fc-label">Quick Notes</div>
          <div className="fc-title">Thoughts &amp; blockers</div>
          <textarea
            className="fc-textarea"
            placeholder="Add notes here…"
            value={notes}
            onChange={e => handleNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="div" />

      {/* ── Quick Launch ── */}
      <div className="sec">Quick Launch</div>
      <div className="qa-row">
        <a className="qa-btn" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">📋 New Standup</a>
        <a className="qa-btn" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">✅ Add Task</a>
        <a className="qa-btn" href="https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9" target="_blank" rel="noreferrer">📁 Drive</a>
        <a className="qa-btn" href="https://claude.ai" target="_blank" rel="noreferrer">🤖 Claude</a>
        <a className="qa-btn" href="https://app.slack.com" target="_blank" rel="noreferrer">💬 Slack</a>
        <a className="qa-btn" href="https://kling.ai" target="_blank" rel="noreferrer">🎬 Kling</a>
        <a className="qa-btn" href="https://www.instagram.com/core.aivision" target="_blank" rel="noreferrer">📸 Instagram</a>
      </div>

      <div className="div" />

      {/* ── Bottlenecks ── */}
      {bottlenecks.length > 0 && (
        <>
          <div className="grid3" style={{ marginBottom: 20 }}>
            <div className="metric metric-red">
              <div className="metric-label">Critical Blocks</div>
              <div className="metric-val">{critCount}</div>
              <div className="metric-sub">Fix now</div>
            </div>
            <div className="metric metric-gold">
              <div className="metric-label">Medium Priority</div>
              <div className="metric-val">{medCount}</div>
              <div className="metric-sub">Fix this month</div>
            </div>
            <div className="metric metric-green">
              <div className="metric-label">Low / Resolved Soon</div>
              <div className="metric-val">{lowCount}</div>
              <div className="metric-sub">On the radar</div>
            </div>
          </div>

          {critBns.length > 0 && (
            <>
              <div className="sec">Critical — Fix Now</div>
              <div className="card">
                {critBns.map(b => (
                  <div key={b.id} className="bn-row">
                    <div className="bn-dot bn-crit" />
                    <div className="bn-text">{b.text}</div>
                    <div className="bn-owner">{b.owner ?? ''}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {medBns.length > 0 && (
            <>
              <div className="sec">Medium — Fix This Month</div>
              <div className="card">
                {medBns.map(b => (
                  <div key={b.id} className="bn-row">
                    <div className="bn-dot bn-med" />
                    <div className="bn-text">{b.text}</div>
                    <div className="bn-owner">{b.owner ?? ''}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
