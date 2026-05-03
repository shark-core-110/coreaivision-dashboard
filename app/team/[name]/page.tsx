import { createClient } from '@supabase/supabase-js'

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

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const memberName = decodeURIComponent(name)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [tasksRes, calRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, section, status, due_date, project_name')
      .ilike('assigned_to', memberName)
      .not('status', 'eq', 'done')
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('content_calendar')
      .select('id, title, date, platform, prod_status, client, content_type')
      .ilike('assigned_to', memberName)
      .order('date', { ascending: true }),
  ])

  const tasks     = (tasksRes.data as Task[]) ?? []
  const cal       = (calRes.data as CalItem[]) ?? []
  const todayISO  = new Date().toISOString().split('T')[0]
  const overdue   = tasks.filter(t => t.due_date && t.due_date < todayISO)
  const dueToday  = tasks.filter(t => t.due_date === todayISO)
  const upcoming  = tasks.filter(t => !t.due_date || t.due_date > todayISO)
  const activeCal = cal.filter(c => c.prod_status !== 'posted')
  const postedCal = cal.filter(c => c.prod_status === 'posted')

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,.03)',
    border: '0.5px solid rgba(255,255,255,.08)',
    borderRadius: 10,
    overflow: 'hidden',
  }

  const row = (last: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    borderBottom: last ? 'none' : '0.5px solid rgba(255,255,255,.06)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  })

  const dot = (color: string): React.CSSProperties => ({
    width: 6, height: 6, borderRadius: '50%',
    background: color, flexShrink: 0, marginTop: 5,
  })

  const badge = (status: string): React.CSSProperties => ({
    fontSize: 10, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap',
    background: `${STATUS_COLOR[status] ?? '#475569'}22`,
    color: STATUS_COLOR[status] ?? '#94a3b8',
  })

  const sectionLabel = (label: string, color = '#94a3b8') => (
    <div style={{
      fontSize: 11, fontWeight: 600, color, letterSpacing: '.08em',
      textTransform: 'uppercase' as const, marginBottom: 10,
    }}>
      {label}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      color: '#e2e8f0',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,.08)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, color: '#1a70ad' }}>◈</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Core AI Vision</span>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: 'rgba(26,112,173,.15)', color: '#1a70ad',
          border: '0.5px solid rgba(26,112,173,.3)',
        }}>
          View Only
        </span>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
            {memberName}&apos;s Dashboard
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {tasks.length} open task{tasks.length !== 1 ? 's' : ''}
            &nbsp;·&nbsp;
            {activeCal.length} in pipeline
            {overdue.length > 0 && (
              <span style={{ color: '#ef4444', marginLeft: 8 }}>
                · ⚠ {overdue.length} overdue
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {overdue.length > 0 && (
              <div>
                {sectionLabel('⚠ Overdue', '#ef4444')}
                <div style={{ ...card, borderColor: 'rgba(239,68,68,.2)', background: 'rgba(239,68,68,.05)' }}>
                  {overdue.map((t, i) => (
                    <div key={t.id} style={row(i === overdue.length - 1)}>
                      <div style={dot('#ef4444')} />
                      <div style={{ flex: 1, fontSize: 13 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: '#ef4444', whiteSpace: 'nowrap' }}>{fmtDate(t.due_date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              {sectionLabel('Due Today')}
              <div style={card}>
                {dueToday.length === 0
                  ? <div style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>Nothing due today.</div>
                  : dueToday.map((t, i) => (
                    <div key={t.id} style={row(i === dueToday.length - 1)}>
                      <div style={dot('#f59e0b')} />
                      <div style={{ flex: 1, fontSize: 13 }}>{t.title}</div>
                      <span style={badge(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div>
              {sectionLabel('Upcoming')}
              <div style={card}>
                {upcoming.length === 0
                  ? <div style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>No upcoming tasks.</div>
                  : upcoming.map((t, i) => (
                    <div key={t.id} style={row(i === upcoming.length - 1)}>
                      <div style={dot('#334155')} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{t.title}</div>
                        {t.project_name && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.project_name}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(t.due_date)}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              {sectionLabel('Pipeline')}
              <div style={card}>
                {activeCal.length === 0
                  ? <div style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>No active pipeline items.</div>
                  : activeCal.map((item, i) => (
                    <div key={item.id} style={row(i === activeCal.length - 1)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {item.platform}&nbsp;·&nbsp;{fmtDate(item.date)}
                          {item.client ? ` · ${item.client}` : ''}
                        </div>
                      </div>
                      <span style={badge(item.prod_status)}>
                        {STATUS_LABEL[item.prod_status] ?? item.prod_status}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>

            {postedCal.length > 0 && (
              <div>
                {sectionLabel('Posted')}
                <div style={{ ...card, opacity: 0.6 }}>
                  {postedCal.map((item, i) => (
                    <div key={item.id} style={row(i === postedCal.length - 1)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{fmtDate(item.date)}</div>
                      </div>
                      <span style={badge('posted')}>Posted</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 48, textAlign: 'center', fontSize: 12, color: '#1e293b' }}>
          Core AI Vision · Read-only ·{' '}
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
