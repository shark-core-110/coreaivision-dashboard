'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const MEMBERS = [
  { name: 'Krishanu',  role: 'AI Visual Artist',        initials: 'KR' },
  { name: 'Pushkar',   role: 'AI Video Creator',         initials: 'PK' },
  { name: 'Yash',      role: 'Strategy · Claude Ops',    initials: 'YA' },
  { name: 'Akib',      role: 'In-House Editor',          initials: 'AK' },
  { name: 'Padmanav',  role: 'Cinematic Editor',         initials: 'PA' },
  { name: 'Niraj',     role: 'AI Vibe Coder',            initials: 'NI' },
  { name: 'Sanjukta',  role: 'AI Influencer · Lyra',     initials: 'SJ' },
  { name: 'Joyeeta',   role: 'LinkedIn Strategist',      initials: 'JO' },
]

const SECTIONS   = ['Video', 'Design', 'Strategy', 'Content', 'Review', 'Code', 'Ops', 'Other']
const PRIORITIES = ['High', 'Medium', 'Low'] as const

interface Task {
  id: string
  title: string
  section: string | null
  status: string
  due_date: string | null
  priority: string | null
  notes: string | null
  assigned_to: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 7,
  border: '0.5px solid var(--b1)', background: 'var(--s2)',
  color: 'var(--ink1)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--ink4)', fontWeight: 600,
  display: 'block', marginBottom: 5, textTransform: 'uppercase',
  letterSpacing: '.05em',
}

function priorityColor(p: string | null) {
  if (p === 'High')   return '#ef4444'
  if (p === 'Medium') return '#f59e0b'
  return 'var(--ink4)'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AssignTasksPage() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()

  const [activeMember,  setActiveMember]  = useState(MEMBERS[0].name)
  const [tasks,         setTasks]         = useState<Task[]>([])
  const [tasksLoading,  setTasksLoading]  = useState(false)

  const [title,      setTitle]      = useState('')
  const [section,    setSection]    = useState('')
  const [priority,   setPriority]   = useState<string>('Medium')
  const [dueDate,    setDueDate]    = useState('')
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback,   setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null)

  // Non-admins are redirected away
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.replace('/dashboard/my')
    }
  }, [user, loading, router])

  const fetchTasks = useCallback(async (name: string) => {
    setTasksLoading(true)
    try {
      const res  = await fetch(`/api/admin/tasks?assigned_to=${encodeURIComponent(name)}`)
      const json = await res.json() as { data: Task[] }
      setTasks(json.data ?? [])
    } finally {
      setTasksLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks(activeMember) }, [activeMember, fetchTasks])

  // Auto-clear feedback banner
  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(t)
  }, [feedback])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          section:     section || 'General',
          priority,
          due_date:    dueDate || null,
          notes:       notes.trim() || null,
          assigned_to: activeMember,
          created_by:  user?.name || 'Shark',
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        setFeedback({ ok: false, msg: err.error || 'Failed to create task' })
        return
      }
      setFeedback({ ok: true, msg: `Task assigned to ${activeMember}` })
      setTitle(''); setSection(''); setDueDate(''); setNotes(''); setPriority('Medium')
      await fetchTasks(activeMember)
    } finally {
      setSubmitting(false)
    }
  }

  async function markDone(taskId: string) {
    await fetch(`/api/admin/tasks/${taskId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', updated_by: user?.name || 'Shark' }),
    })
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    await fetch(`/api/admin/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  if (loading || !user?.isAdmin) return null

  const member    = MEMBERS.find(m => m.name === activeMember)!
  const openTasks = tasks.filter(t => t.status !== 'done')

  return (
    <>
      {/* Member picker */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Team Member
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MEMBERS.map(m => {
            const active = activeMember === m.name
            return (
              <button
                key={m.name}
                onClick={() => setActiveMember(m.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                  border:      active ? '1px solid rgba(26,112,173,.55)'  : '0.5px solid var(--b1)',
                  background:  active ? 'rgba(26,112,173,.12)'            : 'var(--s2)',
                  color:       active ? 'var(--blue)'                     : 'var(--ink2)',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all .15s',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: active ? 'rgba(26,112,173,.2)' : 'rgba(255,255,255,.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {m.initials}
                </div>
                {m.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid2" style={{ alignItems: 'start', gap: 20 }}>
        {/* Left — current open tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="sec" style={{ margin: 0 }}>{member.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{member.role}</div>
            </div>
            <span style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 10,
              background: openTasks.length > 0 ? 'rgba(26,112,173,.1)' : 'rgba(255,255,255,.04)',
              color:      openTasks.length > 0 ? 'var(--blue)'         : 'var(--ink4)',
              border: '0.5px solid var(--b1)',
            }}>
              {openTasks.length} open
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {tasksLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                Loading…
              </div>
            ) : openTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                No open tasks for {member.name}
              </div>
            ) : (
              openTasks.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    padding: '11px 16px',
                    borderBottom: i < openTasks.length - 1 ? '0.5px solid var(--b1)' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink1)', fontWeight: 500, lineHeight: 1.4 }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {t.section  && <span>{t.section}</span>}
                      {t.priority && <span style={{ color: priorityColor(t.priority) }}>{t.priority}</span>}
                      {t.due_date && <span>Due {fmtDate(t.due_date)}</span>}
                    </div>
                    {t.notes && (
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4, fontStyle: 'italic' }}>
                        {t.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingTop: 2 }}>
                    <button
                      onClick={() => markDone(t.id)}
                      title="Mark done"
                      style={{
                        padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                        border: '0.5px solid rgba(34,197,94,.3)',
                        background: 'rgba(34,197,94,.08)', color: '#22c55e',
                      }}
                    >
                      ✓ Done
                    </button>
                    <button
                      onClick={() => deleteTask(t.id)}
                      title="Delete task"
                      style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                        border: '0.5px solid rgba(239,68,68,.25)',
                        background: 'rgba(239,68,68,.07)', color: '#ef4444',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — assign form */}
        <div>
          <div className="sec">Assign Task to {member.name}</div>
          <div className="card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Task Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="e.g. 5 Lyra reels for this week"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Section / Type</label>
                  <input
                    list="section-opts"
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    placeholder="Video, Design…"
                    style={inputStyle}
                  />
                  <datalist id="section-opts">
                    {SECTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    style={inputStyle}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Context or instructions for this task…"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {feedback && (
                <div style={{
                  padding: '8px 12px', borderRadius: 7, fontSize: 13,
                  background: feedback.ok ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                  color:      feedback.ok ? '#22c55e'            : '#ef4444',
                  border:     `0.5px solid ${feedback.ok ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
                }}>
                  {feedback.ok ? '✓ ' : '✕ '}{feedback.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !title.trim()}
                style={{
                  padding: '10px 0', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(26,112,173,.15)',
                  border: '0.5px solid rgba(26,112,173,.4)',
                  color: 'var(--blue)',
                  opacity: submitting || !title.trim() ? 0.45 : 1,
                  transition: 'opacity .15s',
                }}
              >
                {submitting ? 'Assigning…' : `Assign to ${activeMember}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
