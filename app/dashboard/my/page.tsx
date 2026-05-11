'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Task {
  id: string
  title: string
  section: string
  status: string
  due_date: string | null
  project_name: string | null
  source?: 'supabase' | 'notion'
  type?: string | null
  notes?: string | null
  notion_url?: string
}

interface TaskRef {
  id: string
  task_id: string
  label: string | null
  ref_type: string
  url: string | null
  file_name: string | null
  preview_title: string | null
  preview_image: string | null
  platform: string | null
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

// Dark theme tokens — distinct from the light cream main dashboard
const D = {
  bg:      '#0B0907',
  surface: '#14110D',
  card:    '#1A1510',
  border:  'rgba(191,139,46,0.14)',
  borderStrong: 'rgba(191,139,46,0.28)',
  gold:    '#BF8B2E',
  goldDim: 'rgba(191,139,46,0.7)',
  text:    '#EDE8DE',
  sub:     '#8A7E6E',
  dim:     '#4A4235',
  green:   '#22c55e',
  blue:    '#1a70ad',
  amber:   '#f59e0b',
  red:     '#ef4444',
}

const STATUS_COLOR: Record<string, string> = {
  done:          D.green,
  posted:        D.green,
  'in-progress': D.blue,
  filming:       D.blue,
  editing:       D.blue,
  scheduled:     D.amber,
  draft:         D.sub,
  todo:          D.sub,
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

function DarkBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? D.sub
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
      background: `${color}18`, color, border: `0.5px solid ${color}40`,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
      textTransform: 'uppercase', color: color ?? D.goldDim,
      marginBottom: 10, marginTop: 4,
    }}>
      {children}
    </div>
  )
}

function DarkCard({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      background: D.card,
      border: `0.5px solid ${danger ? 'rgba(239,68,68,.25)' : D.border}`,
      borderRadius: 10, overflow: 'hidden', marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

function DarkRow({
  children, last,
}: { children: React.ReactNode; last: boolean }) {
  return (
    <div style={{
      padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
      borderBottom: last ? 'none' : `0.5px solid ${D.border}`,
    }}>
      {children}
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: color, flexShrink: 0, marginTop: 5,
    }} />
  )
}

function platformIcon(platform: string | null) {
  if (!platform) return '🔗'
  const p = platform.toLowerCase()
  if (p === 'youtube')   return '▶'
  if (p === 'tiktok')    return '♪'
  if (p === 'instagram') return '◈'
  if (p === 'figma')     return '◎'
  if (p === 'notion')    return '◻'
  return '🔗'
}

export default function MyDashboard() {
  const { user } = useCurrentUser()
  const [name, setName]         = useState('')
  const [tasks, setTasks]       = useState<Task[]>([])
  const [cal, setCal]           = useState<CalItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastSync, setLastSync] = useState('')
  const [refsMap, setRefsMap]   = useState<Record<string, TaskRef[]>>({})
  const [expandedRef, setExpandedRef] = useState<string | null>(null)

  const fetchData = useCallback(async (userName: string) => {
    const supabase = createClient()
    const [tasksRes, calRes, notionRes] = await Promise.all([
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
      fetch(`/api/notion/tasks?name=${encodeURIComponent(userName)}`).then(r => r.json()).catch(() => ({ tasks: [] })),
    ])

    const supabaseTasks = ((tasksRes.data as Task[]) ?? []).map(t => ({ ...t, source: 'supabase' as const }))
    const notionTasks   = ((notionRes.tasks ?? []) as Task[]).map((t: Task) => ({ ...t, section: t.type ?? 'Notion', source: 'notion' as const }))

    const allTasks = [...supabaseTasks, ...notionTasks]
    setTasks(allTasks)
    setCal((calRes.data as CalItem[]) ?? [])
    setLastSync(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    setLoading(false)

    // Fetch all references for Supabase tasks in one query
    const sbIds = supabaseTasks.map(t => t.id).filter(Boolean)
    if (sbIds.length > 0) {
      const { data: refs } = await supabase
        .from('task_references')
        .select('id, task_id, label, ref_type, url, file_name, preview_title, preview_image, platform')
        .in('task_id', sbIds)
        .order('created_at', { ascending: true })
      if (refs) {
        const map: Record<string, TaskRef[]> = {}
        for (const r of refs as TaskRef[]) {
          if (!map[r.task_id]) map[r.task_id] = []
          map[r.task_id].push(r)
        }
        setRefsMap(map)
      }
    }
  }, [])

  // Initial load
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const userName = (data.user?.user_metadata?.full_name as string) ?? ''
      setName(userName)
      if (userName) fetchData(userName)
      else setLoading(false)
    })
  }, [fetchData])

  // Presence — broadcast that this user is active on their personal dashboard
  useEffect(() => {
    if (!name) return
    const supabase = createClient()
    const presence = supabase.channel('team-presence')
    presence.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presence.track({
          name,
          page: 'personal-dashboard',
          online_at: new Date().toISOString(),
        })
      }
    })
    return () => { supabase.removeChannel(presence) }
  }, [name])

  // Real-time sync — re-fetch on any change to tasks or content_calendar
  useEffect(() => {
    if (!name) return
    const supabase = createClient()
    const channel = supabase
      .channel('my-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchData(name)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_calendar' }, () => {
        fetchData(name)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [name, fetchData])

  // Full-bleed dark wrapper — covers the light .main background
  const wrapStyle: React.CSSProperties = {
    margin: '-32px -36px -64px -32px',
    padding: '32px 36px 64px 32px',
    background: D.bg,
    minHeight: '100vh',
    color: D.text,
  }

  if (loading) {
    return (
      <div style={wrapStyle}>
        <div style={{ padding: 60, textAlign: 'center', color: D.sub, fontSize: 14 }}>
          Loading your dashboard…
        </div>
      </div>
    )
  }

  const todayISO  = new Date().toISOString().split('T')[0]
  const overdue   = tasks.filter(t => t.due_date && t.due_date < todayISO)
  const dueToday  = tasks.filter(t => t.due_date === todayISO)
  const upcoming  = tasks.filter(t => !t.due_date || t.due_date > todayISO)
  const activeCal = cal.filter(c => c.prod_status !== 'posted')
  const postedCal = cal.filter(c => c.prod_status === 'posted')

  return (
    <div style={wrapStyle}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28,
        paddingBottom: 20,
        borderBottom: `0.5px solid ${D.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, color: D.gold }}>◈</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: D.text }}>
              {getGreeting()}, {name} 👋
            </div>
            <div style={{ fontSize: 12, color: D.sub, marginTop: 2 }}>
              Personal Dashboard &nbsp;·&nbsp; Live sync
              {lastSync && <span style={{ color: D.dim }}> &nbsp;·&nbsp; Updated {lastSync}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: `${D.gold}18`, color: D.goldDim,
            border: `0.5px solid ${D.gold}30`,
          }}>
            ◉ Live
          </span>
          {user?.isAdmin && (
            <Link href="/dashboard" style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 8,
              background: D.surface, border: `0.5px solid ${D.border}`,
              color: D.sub, textDecoration: 'none',
            }}>
              ← Main Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 28,
      }}>
        {[
          { label: 'Open Tasks', val: tasks.length, sub: 'assigned to you', pct: Math.min(tasks.length * 10, 100), color: D.blue },
          {
            label: 'Due Today', val: dueToday.length,
            sub: overdue.length > 0 ? `⚠ ${overdue.length} overdue` : 'on schedule',
            pct: Math.min(dueToday.length * 25, 100),
            color: overdue.length > 0 ? D.amber : D.gold,
          },
          { label: 'In Pipeline', val: activeCal.length, sub: `${postedCal.length} posted`, pct: Math.min(activeCal.length * 15, 100), color: D.green },
        ].map(k => (
          <div key={k.label} style={{
            background: D.surface, border: `0.5px solid ${D.border}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, color: D.sub, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: D.text, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: D.sub, margin: '4px 0 8px' }}>{k.sub}</div>
            <div style={{ height: 3, background: D.card, borderRadius: 2 }}>
              <div style={{ height: 3, borderRadius: 2, background: k.color, width: `${k.pct}%`, transition: 'width .4s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left — Tasks */}
        <div>
          {overdue.length > 0 && (
            <>
              <SectionLabel color={D.red}>⚠ Overdue</SectionLabel>
              <DarkCard danger>
                {overdue.map((t, i) => (
                  <TaskRowWithRefs
                    key={t.id}
                    task={t}
                    last={i === overdue.length - 1}
                    dot={D.red}
                    right={<span style={{ fontSize: 11, color: D.red, whiteSpace: 'nowrap' }}>{fmtDate(t.due_date)}</span>}
                    refs={refsMap[t.id] ?? []}
                    expanded={expandedRef === t.id}
                    onToggle={() => setExpandedRef(prev => prev === t.id ? null : t.id)}
                  />
                ))}
              </DarkCard>
            </>
          )}

          <SectionLabel>Due Today</SectionLabel>
          <DarkCard>
            {dueToday.length === 0
              ? <div style={{ padding: '12px 14px', fontSize: 13, color: D.sub }}>Nothing due today — you&apos;re clear.</div>
              : dueToday.map((t, i) => (
                <TaskRowWithRefs
                  key={t.id}
                  task={t}
                  last={i === dueToday.length - 1}
                  dot={D.amber}
                  right={<DarkBadge status={t.status} />}
                  refs={refsMap[t.id] ?? []}
                  expanded={expandedRef === t.id}
                  onToggle={() => setExpandedRef(prev => prev === t.id ? null : t.id)}
                />
              ))
            }
          </DarkCard>

          <SectionLabel>Upcoming</SectionLabel>
          <DarkCard>
            {upcoming.length === 0
              ? <div style={{ padding: '12px 14px', fontSize: 13, color: D.sub }}>No upcoming tasks.</div>
              : upcoming.map((t, i) => (
                <TaskRowWithRefs
                  key={t.id}
                  task={t}
                  last={i === upcoming.length - 1}
                  dot={D.dim}
                  right={<span style={{ fontSize: 11, color: D.dim, whiteSpace: 'nowrap' }}>{fmtDate(t.due_date)}</span>}
                  refs={refsMap[t.id] ?? []}
                  expanded={expandedRef === t.id}
                  onToggle={() => setExpandedRef(prev => prev === t.id ? null : t.id)}
                />
              ))
            }
          </DarkCard>
        </div>

        {/* Right — Pipeline */}
        <div>
          <SectionLabel>My Pipeline</SectionLabel>
          <DarkCard>
            {activeCal.length === 0
              ? <div style={{ padding: '12px 14px', fontSize: 13, color: D.sub }}>No active pipeline items yet.</div>
              : activeCal.map((item, i) => (
                <DarkRow key={item.id} last={i === activeCal.length - 1}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: D.sub, marginTop: 2 }}>
                      {item.platform}&nbsp;·&nbsp;{fmtDate(item.date)}
                      {item.client ? ` · ${item.client}` : ''}
                    </div>
                  </div>
                  <DarkBadge status={item.prod_status} />
                </DarkRow>
              ))
            }
          </DarkCard>

          {postedCal.length > 0 && (
            <>
              <SectionLabel>Posted</SectionLabel>
              <DarkCard>
                {postedCal.map((item, i) => (
                  <DarkRow key={item.id} last={i === postedCal.length - 1}>
                    <div style={{ flex: 1, opacity: 0.5 }}>
                      <div style={{ fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: D.sub, marginTop: 2 }}>{fmtDate(item.date)}</div>
                    </div>
                    <DarkBadge status="posted" />
                  </DarkRow>
                ))}
              </DarkCard>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: D.dim }}>
        Core AI Vision · Personal Mode · All edits happen in the main dashboard
      </div>
    </div>
  )
}

// ── TaskRowWithRefs ──────────────────────────────────────────────────────────

interface TaskRowWithRefsProps {
  task: Task
  last: boolean
  dot: string
  right: React.ReactNode
  refs: TaskRef[]
  expanded: boolean
  onToggle: () => void
}

function TaskRowWithRefs({ task: t, last, dot, right, refs, expanded, onToggle }: TaskRowWithRefsProps) {
  const hasRefs = refs.length > 0
  return (
    <div style={{ borderBottom: last && !expanded ? 'none' : `0.5px solid ${D.border}` }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Dot color={dot} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>{t.title}</span>
            {t.source === 'notion' && (
              <a href={t.notion_url} target="_blank" rel="noreferrer" style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                background: 'rgba(255,255,255,.06)', color: D.sub,
                textDecoration: 'none', border: `0.5px solid ${D.dim}`,
              }}>N</a>
            )}
            {hasRefs && (
              <button
                onClick={onToggle}
                style={{
                  fontSize: 10, padding: '1px 7px', borderRadius: 10, cursor: 'pointer',
                  background: expanded ? `${D.gold}18` : 'rgba(255,255,255,.04)',
                  border: `0.5px solid ${expanded ? D.gold + '50' : D.dim}`,
                  color: expanded ? D.goldDim : D.sub,
                }}
              >
                📎 {refs.length}
              </button>
            )}
          </div>
          {(t.project_name || t.type) && (
            <div style={{ fontSize: 11, color: D.sub, marginTop: 2 }}>{t.project_name ?? t.type}</div>
          )}
          {t.notes && (
            <div style={{ fontSize: 11, color: D.dim, marginTop: 1 }}>{t.notes}</div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>{right}</div>
      </div>

      {/* Inline refs panel */}
      {expanded && hasRefs && (
        <div style={{
          padding: '8px 14px 10px 30px',
          background: 'rgba(191,139,46,.03)',
          borderTop: `0.5px solid ${D.border}`,
          borderBottom: last ? 'none' : undefined,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {refs.map(r => {
              const href = r.url ?? undefined
              const display = r.label || r.file_name || href || '—'
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{r.ref_type === 'file' ? '📁' : '🔗'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12, color: D.goldDim, textDecoration: 'none',
                          display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {display}
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: D.text, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {display}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
