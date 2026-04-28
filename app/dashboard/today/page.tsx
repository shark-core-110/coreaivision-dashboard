'use client'

import { useEffect, useState } from 'react'

const QUICK_WINS = [
  'Draft reel production SOP',
  'Lock weekly content schedule',
  "Brief team on this week's targets",
  'Top up Claude API credits',
  'Niraj onboarding flow',
  'Decide on Inc42 partnership',
]

export default function TodayFocus() {
  const [date, setDate]             = useState('')
  const [priorities, setPriorities] = useState('')
  const [notes, setNotes]           = useState('')

  useEffect(() => {
    const now    = new Date()
    const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    setDate(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`)
    setPriorities(localStorage.getItem('cav-priorities') ?? '')
    setNotes(localStorage.getItem('cav-notes') ?? '')
  }, [])

  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Today&apos;s Focus</strong>
        &nbsp;&middot;&nbsp; Set your top 3 priorities each morning
        &nbsp;&middot;&nbsp; Click a quick win to mark it done
        &nbsp;&middot;&nbsp; Notes auto-save to browser &mdash; refresh-safe
      </div>
      <div className="focus-block">
        <div className="focus-label">Today — {date}</div>
        <div className="focus-text">Top 3 priorities that must happen today. Notes and blockers below.</div>
      </div>

      <div className="focus-grid">
        <div className="focus-card">
          <div className="fc-label">Top 3 Priorities</div>
          <div className="fc-title">What must happen today?</div>
          <textarea
            className="fc-textarea"
            placeholder={'1. \n2. \n3. '}
            value={priorities}
            onChange={(e) => { setPriorities(e.target.value); localStorage.setItem('cav-priorities', e.target.value) }}
          />
        </div>
        <div className="focus-card">
          <div className="fc-label">Quick Notes</div>
          <div className="fc-title">Thoughts & blockers</div>
          <textarea
            className="fc-textarea"
            placeholder="Add notes here…"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); localStorage.setItem('cav-notes', e.target.value) }}
          />
        </div>
      </div>

      <div className="div" />
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

      {/* Bottlenecks — surfaced daily so they stay visible */}
      <div className="focus-block" style={{ borderLeftColor: 'var(--red, #c0392b)', background: 'rgba(192,57,43,.03)' }}>
        <div className="focus-label" style={{ color: 'var(--red, #c0392b)' }}>Active Bottleneck</div>
        <div className="focus-text">Team coordination is eating your bandwidth. SOPs + async structure so the team moves without you in every loop. Every hour spent unblocking is an hour not building.</div>
      </div>

      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="metric metric-red"><div className="metric-label">Critical Blocks</div><div className="metric-val">3</div><div className="metric-sub">Fix now</div></div>
        <div className="metric metric-gold"><div className="metric-label">Medium Priority</div><div className="metric-val">2</div><div className="metric-sub">Fix this month</div></div>
        <div className="metric metric-green"><div className="metric-label">Quick Wins</div><div className="metric-val">4</div><div className="metric-sub">Unblock this week</div></div>
      </div>

      <div className="sec">Critical — Fix Now</div>
      <div className="card">
        <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">No clear content workflow / SOPs — team doesn&apos;t know the process without Shark</div><div className="bn-owner">Shark</div></div>
        <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">Team not moving fast enough — no direction without daily briefing</div><div className="bn-owner">All</div></div>
        <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">Shark&apos;s time stuck in coordination vs. strategy and client work</div><div className="bn-owner">Shark</div></div>
      </div>

      <div className="sec">Medium — Fix This Month</div>
      <div className="card">
        <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">No consistent posting schedule — content coming out irregularly, hurting algorithm</div><div className="bn-owner">Social team</div></div>
        <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">AI Skool community not built — key revenue stream blocked</div><div className="bn-owner">Shark</div></div>
      </div>

      <div className="sec">Quick Wins — Unblock This Week</div>
      <div className="tag-row">
        {QUICK_WINS.map(tag => <span key={tag} className="tag">{tag}</span>)}
      </div>
    </>
  )
}
