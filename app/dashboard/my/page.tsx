'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Task {
  id: string
  title: string
  section: string
  status: string
  due_date: string | null
  project_name: string | null
}

interface CalItem {
  id: string
  title: string
  date: string
  platform: string
  prod_status: string
  client: string | null
  content_type: string
}

const STATUS_COLOR: Record<string, string> = {
  done:          '#22c55e',
  posted:        '#22c55e',
  'in-progress': '#1a70ad',
  filming:       '#1a70ad',
  editing:       '#1a70ad',
  scheduled:     '#f59e0b',
  draft:         'var(--ink3)',
  todo:          'var(--ink3)',
}

const STATUS_LABEL: Record<string, string> = {
  todo:          'To Do',
  'in-progress': 'In Progress',
  done:          'Done',
  draft:         'Draft',
  filming:       'Filming',
  editing:       'Editing',
  scheduled:     'Scheduled',
  posted:        'Posted',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? 'var(--ink3)'
  return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap',
      background: `${color}22`, color,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export default function MyDashboard() {
  const [name, setName]       = useState('')
  const [tasks, setTasks]     = useState<Task[]>([])
  const [cal, setCal]         = useState<CalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const userName = (data.user?.user_metadata?.full_name as string) ?? ''
      setName(userName)
      if (!userName) { setLoading(false); return }

      const [tasksRes, calRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, section, status, due_date, project_name')
          .ilike('assigned_to', userName)
          .not('status', 'eq', 'done')
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('content_calendar')
          .select('id, title, date, platform, prod_status, client, content_type')
          .ilike('assigned_to', userName)
          .order('date', { ascending: true }),
      ])

      setTasks((tasksRes.data as Task[]) ?? [])
      setCal((calRes.data as CalItem[]) ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
        Loading your dashboard…
      </div>
    )
  }

  const todayISO  = new Date().toISOString().split('T')[0]
  const overdue   = tasks.filter(t => t.due_date && t.due_date < todayISO)
  const dueToday  = tasks.filter(t => t.due_date === todayISO)
  const upcoming  = tasks.filter(t => !t.due_date || t.due_date > todayISO)
  const activeCal = cal.filter(c => c.prod_status !== 'posted')
  const postedCal = cal.filter(c => c.prod_status === 'posted')

  const taskSummary = tasks.length === 0
    ? 'No open tasks — check back after your next sync with Shark.'
    : `${tasks.length} open task${tasks.length !== 1 ? 's' : ''} · ${activeCal.length} active pipeline item${activeCal.length !== 1 ? 's' : ''}`

  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>My Dashboard</strong>
        &nbsp;·&nbsp; Read-only view
        &nbsp;·&nbsp; All edits happen in the main dashboard
        &nbsp;·&nbsp; Tasks refresh on page load
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink1)' }}>
          {getGreeting()}, {name} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>{taskSummary}</div>
      </div>

      <div className="kpi-strip" style={{ marginBottom: 28 }}>
        <div className="kpi">
          <div className="kpi-label">Open Tasks</div>
          <div className="kpi-val">{tasks.length}</div>
          <div className="kpi-sub">assigned to you</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill prog-blue" style={{ width: `${Math.min(tasks.length * 10, 100)}%` }} />
          </div>
        </div>
        <div className={`kpi${overdue.length > 0 ? ' kpi-gold' : ''}`}>
          <div className="kpi-label">Due Today</div>
          <div className="kpi-val">{dueToday.length}</div>
          <div className="kpi-sub">
            {overdue.length > 0 ? `⚠ ${overdue.length} overdue` : 'on schedule'}
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill prog-gold" style={{ width: `${Math.min(dueToday.length * 25, 100)}%` }} />
          </div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-label">In Pipeline</div>
          <div className="kpi-val">{activeCal.length}</div>
          <div className="kpi-sub">{postedCal.length} already posted</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill prog-green" style={{ width: `${Math.min(activeCal.length * 15, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid2">
        <div>
          {overdue.length > 0 && (
            <>
              <div className="sec" style={{ color: '#ef4444' }}>⚠ Overdue</div>
              <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(239,68,68,.3)' }}>
                {overdue.map(t => (
                  <div key={t.id} className="bn-row">
                    <div className="bn-dot" style={{ background: '#ef4444' }} />
                    <div className="bn-text">{t.title}</div>
                    <div className="bn-owner" style={{ color: '#ef4444' }}>{fmtDate(t.due_date)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sec">Due Today</div>
          <div className="card" style={{ marginBottom: 16 }}>
            {dueToday.length === 0
              ? <div style={{ color: 'var(--ink3)', fontSize: 13 }}>Nothing due today — you&apos;re clear.</div>
              : dueToday.map(t => (
                <div key={t.id} className="bn-row">
                  <div className="bn-dot bn-crit" />
                  <div className="bn-text">{t.title}</div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            }
          </div>

          <div className="sec">Upcoming</div>
          <div className="card">
            {upcoming.length === 0
              ? <div style={{ color: 'var(--ink3)', fontSize: 13 }}>No upcoming tasks.</div>
              : upcoming.map(t => (
                <div key={t.id} className="bn-row">
                  <div className="bn-dot" style={{ background: 'var(--ink4)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="bn-text">{t.title}</div>
                    {t.project_name && (
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{t.project_name}</div>
                    )}
                  </div>
                  <div className="bn-owner">{fmtDate(t.due_date)}</div>
                </div>
              ))
            }
          </div>
        </div>

        <div>
          <div className="sec">My Pipeline</div>
          <div className="card" style={{ marginBottom: 16 }}>
            {activeCal.length === 0
              ? <div style={{ color: 'var(--ink3)', fontSize: 13 }}>No active pipeline items yet.</div>
              : activeCal.map(item => (
                <div key={item.id} className="row">
                  <div className="row-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span className="row-name">{item.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {item.platform}&nbsp;·&nbsp;{fmtDate(item.date)}
                      {item.client ? ` · ${item.client}` : ''}
                    </span>
                  </div>
                  <StatusBadge status={item.prod_status} />
                </div>
              ))
            }
          </div>

          {postedCal.length > 0 && (
            <>
              <div className="sec">Posted</div>
              <div className="card">
                {postedCal.map(item => (
                  <div key={item.id} className="row" style={{ opacity: 0.55 }}>
                    <div className="row-left">
                      <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{fmtDate(item.date)}</span>
                      <span className="row-name">{item.title}</span>
                    </div>
                    <StatusBadge status="posted" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
