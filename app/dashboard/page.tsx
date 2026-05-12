'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Workstream {
  id: string
  name: string
  status: string
  icon: string
  badge_class: string
  display_order: number
}

interface Bottleneck {
  id: string
  text: string
  severity: 'crit' | 'med' | 'low'
  owner: string | null
  scope: string
  resolved: boolean
}

// Map status text to a human label for the badge
const STATUS_LABEL: Record<string, string> = {
  active:   'Active',
  building: 'Building',
  planning: 'Planning',
  starting: 'Starting',
  paused:   'Paused',
  done:     'Done',
}

const pipeline = [
  { count: 2,  label: 'Filming',   dot: 'ps-filming' },
  { count: 3,  label: 'Editing',   dot: 'ps-editing' },
  { count: 5,  label: 'Scheduled', dot: 'ps-sched'   },
  { count: 12, label: 'Posted',    dot: 'ps-posted'  },
]

const teamNow = [
  { init: 'KR', online: true  },
  { init: 'PK', online: true  },
  { init: 'AK', online: true  },
  { init: 'PA', online: false },
  { init: 'NI', online: false },
  { init: 'SJ', online: false },
  { init: 'JO', online: false },
  { init: 'SM', online: false },
]

const quickLinks = [
  { label: '◈ Notion',     href: 'https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35' },
  { label: '🤖 Claude',    href: 'https://claude.ai' },
  { label: '📁 Drive',     href: 'https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9' },
  { label: '💬 Slack',     href: 'https://app.slack.com' },
  { label: '📸 Instagram', href: 'https://www.instagram.com/core.aivision' },
]

export default function Overview() {
  const [critOpen,      setCritOpen]      = useState(false)
  const [wsOpen,        setWsOpen]        = useState(false)
  const [workstreams,   setWorkstreams]   = useState<Workstream[]>([])
  const [bottlenecks,   setBottlenecks]   = useState<Bottleneck[]>([])
  const [tasksDueToday, setTasksDueToday] = useState<{ id: string; title: string; assigned_to: string | null }[]>([])
  const [calToday,      setCalToday]      = useState<{ id: string; title: string; prod_status: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const today = new Date().toISOString().slice(0, 10)

    Promise.all([
      supabase
        .from('workstreams')
        .select('id, name, status, icon, badge_class, display_order')
        .order('display_order', { ascending: true }),
      supabase
        .from('bottlenecks')
        .select('id, text, severity, owner, scope, resolved')
        .eq('scope', 'overview')
        .eq('resolved', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, title, assigned_to')
        .eq('due_date', today)
        .neq('status', 'done')
        .order('created_at', { ascending: true }),
      supabase
        .from('content_calendar')
        .select('id, title, prod_status')
        .eq('date', today)
        .order('created_at', { ascending: true }),
    ]).then(([wsRes, bnRes, tasksRes, calRes]) => {
      if (cancelled) return
      if (wsRes.data)    setWorkstreams(wsRes.data as Workstream[])
      if (bnRes.data)    setBottlenecks(bnRes.data as Bottleneck[])
      if (tasksRes.data) setTasksDueToday(tasksRes.data as { id: string; title: string; assigned_to: string | null }[])
      if (calRes.data)   setCalToday(calRes.data as { id: string; title: string; prod_status: string }[])
    })

    return () => { cancelled = true }
  }, [])

  const critCount   = bottlenecks.filter(b => b.severity === 'crit').length
  const onlineCount = teamNow.filter(m => m.online).length

  const hasDigest = critCount > 0 || tasksDueToday.length > 0 || calToday.length > 0

  return (
    <>
      {/* ── Daily Digest Banner ── */}
      {hasDigest && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16,
          padding: '10px 14px',
          background: 'rgba(255,255,255,.03)',
          border: '0.5px solid rgba(255,255,255,.08)',
          borderRadius: 9,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.06em', alignSelf: 'center', marginRight: 4 }}>Today</span>

          {critCount > 0 && (
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(239,68,68,.1)', border: '0.5px solid rgba(239,68,68,.25)', color: '#ef4444' }}>
              {critCount} critical block{critCount > 1 ? 's' : ''}
            </span>
          )}

          {tasksDueToday.length > 0 && (
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(26,112,173,.1)', border: '0.5px solid rgba(26,112,173,.25)', color: 'var(--blue)' }}>
              {tasksDueToday.length} task{tasksDueToday.length > 1 ? 's' : ''} due
              {tasksDueToday.length <= 2 && ': ' + tasksDueToday.map(t => t.title).join(', ')}
            </span>
          )}

          {calToday.length > 0 && (
            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(191,90,242,.08)', border: '0.5px solid rgba(191,90,242,.25)', color: '#BF5AF2' }}>
              {calToday.length} on calendar
              {calToday.length <= 2 && ': ' + calToday.map(c => c.title).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* ── Hero Stats ── */}
      <div className="hero-stat-row">
        <div className="hero-stat-block">
          <div className="hero-num">19.9K</div>
          <div className="hero-label">Followers</div>
          <div className="hero-trend hero-trend-warn">39.8% → 50K goal</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">5</div>
          <div className="hero-label">Active Clients</div>
          <div className="hero-trend">Arcads · TapNow · Syntx · Vailo · Atlabs</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">75</div>
          <div className="hero-label">Total Reels</div>
          <div className="hero-trend hero-trend-up">+14 this week</div>
        </div>
      </div>

      {/* ── Production Pipeline ── */}
      <div className="pipeline-section">
        <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>Production Pipeline</div>
        <div className="pipeline-row">
          {pipeline.map((stage) => (
            <div key={stage.label} className="pipeline-stage">
              <div className="pipeline-stage-count">{stage.count}</div>
              <div className="pipeline-stage-label">{stage.label}</div>
              <div className={`pipeline-stage-dot ${stage.dot}`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Team Now ── */}
      <div className="compact-members-row">
        {teamNow.map((m) => (
          <div
            key={m.init}
            className={`compact-member-init${m.online ? ' cm-online' : ''}`}
          >
            {m.init}
          </div>
        ))}
        <span className="compact-members-label">{onlineCount} online now</span>
      </div>

      {/* ── Quick Tool Links ── */}
      <div className="quick-links-row">
        {quickLinks.map((ql) => (
          <a key={ql.label} className="quick-link" href={ql.href} target="_blank" rel="noreferrer">
            {ql.label}
          </a>
        ))}
      </div>

      {/* ── Collapse: Critical This Week ── */}
      <button
        className="collapse-chip collapse-chip-crit"
        onClick={() => setCritOpen(o => !o)}
      >
        <span className="collapse-chip-count">{critCount}</span>
        <span>Critical This Week</span>
        <span className={`collapse-chip-arrow${critOpen ? ' open' : ''}`}>▼</span>
      </button>
      {critOpen && (
        <div className="collapse-body">
          {bottlenecks.map((item) => (
            <div key={item.id} className="bn-row">
              <div className={`bn-dot bn-${item.severity}`} />
              <div className="bn-text">{item.text}</div>
              <div className="bn-owner">{item.owner ?? ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Collapse: Active Workstreams ── */}
      <button
        className="collapse-chip"
        onClick={() => setWsOpen(o => !o)}
        style={{ marginTop: 8 }}
      >
        <span className="collapse-chip-count">{workstreams.length}</span>
        <span>Active Workstreams</span>
        <span className={`collapse-chip-arrow${wsOpen ? ' open' : ''}`}>▼</span>
      </button>
      {wsOpen && (
        <div className="collapse-body">
          {workstreams.map((ws) => (
            <div key={ws.id} className="row">
              <div className="row-left">
                <span>{ws.icon}</span>
                <span className="row-name">{ws.name}</span>
              </div>
              <span className={`badge ${ws.badge_class}`}>
                {STATUS_LABEL[ws.status] ?? ws.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="sec">Quick Actions</div>
      <div className="actions">
        <Link className="action-btn" href="/dashboard/projects">Projects →</Link>
        <Link className="action-btn" href="/dashboard/bottlenecks">Bottlenecks →</Link>
        <Link className="action-btn" href="/dashboard/clients">Clients →</Link>
        <Link className="action-btn" href="/dashboard/calendar">Content Cal →</Link>
        <Link className="action-btn" href="/dashboard/goals">Goals →</Link>
        <Link className="action-btn" href="/dashboard/today">Today →</Link>
      </div>
    </>
  )
}
