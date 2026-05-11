'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
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

interface TaskRef {
  id: string
  task_id: string
  label: string | null
  ref_type: string
  url: string | null
  file_path: string | null
  file_name: string | null
  file_mime: string | null
  preview_title: string | null
  preview_image: string | null
  platform: string | null
  created_at: string
}

interface PendingRef {
  tempId: string
  label: string
  ref_type: 'url' | 'file'
  url?: string
  file_name?: string
  file_mime?: string
  file_path?: string
  preview_title?: string
  preview_image?: string
  platform?: string
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

const miniInput: React.CSSProperties = {
  ...inputStyle, fontSize: 12, padding: '6px 10px',
}

function priorityColor(p: string | null) {
  if (p === 'High')   return '#ef4444'
  if (p === 'Medium') return '#f59e0b'
  return 'var(--ink4)'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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

function fmtBytes(n: number | undefined) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

export default function AssignTasksPage() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()

  const [activeMember,  setActiveMember]  = useState(MEMBERS[0].name)
  const [tasks,         setTasks]         = useState<Task[]>([])
  const [tasksLoading,  setTasksLoading]  = useState(false)

  // Create-task form fields
  const [title,      setTitle]      = useState('')
  const [section,    setSection]    = useState('')
  const [priority,   setPriority]   = useState<string>('Medium')
  const [dueDate,    setDueDate]    = useState('')
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback,   setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null)

  // Pending refs attached to the create-task form
  const [pendingRefs,  setPendingRefs]  = useState<PendingRef[]>([])
  const [refTab,       setRefTab]       = useState<'url' | 'file'>('url')
  const [refUrl,       setRefUrl]       = useState('')
  const [refLabel,     setRefLabel]     = useState('')
  const [refFile,      setRefFile]      = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Per-task inline ref panel
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [taskRefs,    setTaskRefs]    = useState<Record<string, TaskRef[]>>({})
  const [refsLoading, setRefsLoading] = useState(false)

  // State for adding ref to an existing task
  const [exTab,       setExTab]       = useState<'url' | 'file'>('url')
  const [exUrl,       setExUrl]       = useState('')
  const [exLabel,     setExLabel]     = useState('')
  const [exFile,      setExFile]      = useState<File | null>(null)
  const [addingRef,   setAddingRef]   = useState(false)
  const exFileRef = useRef<HTMLInputElement>(null)

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

  // ── Upload a file and return ref info ────────────────────────────────────
  async function uploadFile(file: File): Promise<Partial<PendingRef> | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/references/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json() as { url: string; fileName: string; fileMime: string; filePath: string }
    return {
      ref_type:  'file',
      url:       data.url,
      file_name: data.fileName,
      file_mime: data.fileMime,
      file_path: data.filePath,
    }
  }

  // ── Add a pending ref to the create-task form ────────────────────────────
  async function addPendingRef() {
    const label = refLabel.trim() || undefined
    if (refTab === 'url') {
      if (!refUrl.trim()) return
      setPendingRefs(prev => [...prev, {
        tempId:   crypto.randomUUID(),
        label:    label ?? '',
        ref_type: 'url',
        url:      refUrl.trim(),
      }])
      setRefUrl(''); setRefLabel('')
    } else {
      if (!refFile) return
      const info = await uploadFile(refFile)
      if (!info) return
      setPendingRefs(prev => [...prev, {
        tempId:   crypto.randomUUID(),
        label:    label ?? '',
        ref_type: 'file',
        ...info,
      }])
      setRefFile(null); setRefLabel('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removePendingRef(tempId: string) {
    setPendingRefs(prev => prev.filter(r => r.tempId !== tempId))
  }

  // ── Save pending refs after task creation ────────────────────────────────
  async function savePendingRefs(taskId: string) {
    for (const r of pendingRefs) {
      await fetch(`/api/admin/tasks/${taskId}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label:         r.label || null,
          ref_type:      r.ref_type,
          url:           r.url || null,
          file_path:     r.file_path || null,
          file_name:     r.file_name || null,
          file_mime:     r.file_mime || null,
          preview_title: r.preview_title || null,
          preview_image: r.preview_image || null,
          platform:      r.platform || null,
        }),
      })
    }
  }

  // ── Fetch refs for an existing task ──────────────────────────────────────
  async function toggleRefs(taskId: string) {
    if (expandedId === taskId) {
      setExpandedId(null)
      return
    }
    setExpandedId(taskId)
    setExTab('url'); setExUrl(''); setExLabel(''); setExFile(null)
    if (taskRefs[taskId]) return
    setRefsLoading(true)
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/references`)
      const json = await res.json() as { data: TaskRef[] }
      setTaskRefs(prev => ({ ...prev, [taskId]: json.data ?? [] }))
    } finally {
      setRefsLoading(false)
    }
  }

  // ── Add a ref to an existing task ────────────────────────────────────────
  async function addRefToExisting(taskId: string) {
    if (addingRef) return
    setAddingRef(true)
    try {
      let body: Record<string, string | null>
      if (exTab === 'url') {
        if (!exUrl.trim()) return
        body = {
          label:         exLabel.trim() || null,
          ref_type:      'url',
          url:           exUrl.trim(),
          preview_title: null,
          preview_image: null,
          platform:      null,
          file_path: null, file_name: null, file_mime: null,
        }
      } else {
        if (!exFile) return
        const info = await uploadFile(exFile)
        if (!info) return
        body = {
          label:     exLabel.trim() || null,
          ref_type:  'file',
          url:       info.url ?? null,
          file_path: info.file_path ?? null,
          file_name: info.file_name ?? null,
          file_mime: info.file_mime ?? null,
          preview_title: null, preview_image: null, platform: null,
        }
      }
      const res = await fetch(`/api/admin/tasks/${taskId}/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json() as { data: TaskRef }
        setTaskRefs(prev => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), json.data] }))
        setExUrl(''); setExLabel(''); setExFile(null)
        if (exFileRef.current) exFileRef.current.value = ''
      }
    } finally {
      setAddingRef(false)
    }
  }

  // ── Delete a ref from an existing task ───────────────────────────────────
  async function deleteRef(taskId: string, refId: string) {
    await fetch(`/api/admin/tasks/${taskId}/references?ref_id=${refId}`, { method: 'DELETE' })
    setTaskRefs(prev => ({ ...prev, [taskId]: (prev[taskId] ?? []).filter(r => r.id !== refId) }))
  }

  // ── Create task ──────────────────────────────────────────────────────────
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
      const created = await res.json() as { data: Task }
      if (pendingRefs.length > 0 && created.data?.id) {
        await savePendingRefs(created.data.id)
      }
      setFeedback({ ok: true, msg: `Task assigned to ${activeMember}` })
      setTitle(''); setSection(''); setDueDate(''); setNotes(''); setPriority('Medium')
      setPendingRefs([]); setRefUrl(''); setRefLabel('')
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
    if (expandedId === taskId) setExpandedId(null)
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    await fetch(`/api/admin/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== taskId))
    if (expandedId === taskId) setExpandedId(null)
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
              openTasks.map((t, i) => {
                const isExpanded = expandedId === t.id
                const refs = taskRefs[t.id] ?? []
                return (
                  <div key={t.id} style={{ borderBottom: i < openTasks.length - 1 ? '0.5px solid var(--b1)' : 'none' }}>
                    {/* Task row */}
                    <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
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
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingTop: 2 }}>
                        <button
                          onClick={() => toggleRefs(t.id)}
                          title={isExpanded ? 'Hide references' : 'View / add references'}
                          style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            border: isExpanded ? '0.5px solid rgba(26,112,173,.5)' : '0.5px solid var(--b1)',
                            background: isExpanded ? 'rgba(26,112,173,.12)' : 'var(--s2)',
                            color: isExpanded ? 'var(--blue)' : 'var(--ink3)',
                          }}
                        >
                          📎
                        </button>
                        <button
                          onClick={() => markDone(t.id)}
                          title="Mark done"
                          style={{
                            padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            border: '0.5px solid rgba(34,197,94,.3)',
                            background: 'rgba(34,197,94,.08)', color: '#22c55e',
                          }}
                        >
                          ✓
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

                    {/* Inline references panel */}
                    {isExpanded && (
                      <div style={{
                        padding: '12px 16px 14px',
                        background: 'rgba(255,255,255,.02)',
                        borderTop: '0.5px solid var(--b1)',
                      }}>
                        {/* Existing refs */}
                        {refsLoading && !taskRefs[t.id] ? (
                          <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>Loading…</div>
                        ) : refs.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                            {refs.map(r => (
                              <RefRow key={r.id} ref_={r} onDelete={() => deleteRef(t.id, r.id)} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>No references yet.</div>
                        )}

                        {/* Tab selector */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {(['url', 'file'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setExTab(tab)}
                              style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                                border: exTab === tab ? '0.5px solid rgba(26,112,173,.5)' : '0.5px solid var(--b1)',
                                background: exTab === tab ? 'rgba(26,112,173,.12)' : 'var(--s2)',
                                color: exTab === tab ? 'var(--blue)' : 'var(--ink3)',
                                fontWeight: exTab === tab ? 600 : 400,
                              }}
                            >
                              {tab === 'url' ? '🔗 URL' : '📁 File'}
                            </button>
                          ))}
                        </div>

                        {exTab === 'url' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                              value={exUrl}
                              onChange={e => setExUrl(e.target.value)}
                              placeholder="https://…"
                              style={miniInput}
                            />
                            <input
                              value={exLabel}
                              onChange={e => setExLabel(e.target.value)}
                              placeholder="Label (optional — shown instead of URL)"
                              style={miniInput}
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                              ref={exFileRef}
                              type="file"
                              onChange={e => setExFile(e.target.files?.[0] ?? null)}
                              style={{ fontSize: 12, color: 'var(--ink3)' }}
                            />
                            {exFile && <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{exFile.name} · {fmtBytes(exFile.size)}</div>}
                            <input
                              value={exLabel}
                              onChange={e => setExLabel(e.target.value)}
                              placeholder="Label (optional)"
                              style={miniInput}
                            />
                          </div>
                        )}

                        <button
                          onClick={() => addRefToExisting(t.id)}
                          disabled={addingRef || (exTab === 'url' ? !exUrl.trim() : !exFile)}
                          style={{
                            marginTop: 8, padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                            border: '0.5px solid rgba(26,112,173,.4)',
                            background: 'rgba(26,112,173,.1)', color: 'var(--blue)',
                            opacity: addingRef || (exTab === 'url' ? !exUrl.trim() : !exFile) ? 0.4 : 1,
                          }}
                        >
                          {addingRef ? 'Adding…' : '+ Add Reference'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
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

              {/* ── References section ──────────────────────────────── */}
              <div>
                <label style={labelStyle}>References</label>
                <div style={{
                  borderRadius: 8, border: '0.5px solid var(--b1)',
                  background: 'rgba(255,255,255,.02)', padding: 10,
                }}>
                  {/* Tab selector */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 9 }}>
                    {(['url', 'file'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setRefTab(tab)}
                        style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                          border: refTab === tab ? '0.5px solid rgba(26,112,173,.5)' : '0.5px solid var(--b1)',
                          background: refTab === tab ? 'rgba(26,112,173,.12)' : 'var(--s2)',
                          color: refTab === tab ? 'var(--blue)' : 'var(--ink3)',
                          fontWeight: refTab === tab ? 600 : 400,
                        }}
                      >
                        {tab === 'url' ? '🔗 URL' : '📁 File'}
                      </button>
                    ))}
                  </div>

                  {refTab === 'url' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <input
                        value={refUrl}
                        onChange={e => setRefUrl(e.target.value)}
                        placeholder="https://youtube.com/… or any URL"
                        style={miniInput}
                      />
                      <input
                        value={refLabel}
                        onChange={e => setRefLabel(e.target.value)}
                        placeholder="Label (optional — shown instead of URL)"
                        style={miniInput}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <input
                        ref={fileRef}
                        type="file"
                        onChange={e => setRefFile(e.target.files?.[0] ?? null)}
                        style={{ fontSize: 12, color: 'var(--ink3)' }}
                      />
                      {refFile && <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{refFile.name} · {fmtBytes(refFile.size)}</div>}
                      <input
                        value={refLabel}
                        onChange={e => setRefLabel(e.target.value)}
                        placeholder="Label (optional)"
                        style={miniInput}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addPendingRef}
                    disabled={refTab === 'url' ? !refUrl.trim() : !refFile}
                    style={{
                      marginTop: 9, padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      border: '0.5px solid rgba(26,112,173,.35)',
                      background: 'rgba(26,112,173,.08)', color: 'var(--blue)',
                      opacity: (refTab === 'url' ? !refUrl.trim() : !refFile) ? 0.4 : 1,
                    }}
                  >
                    + Add to task
                  </button>

                  {/* Pending refs list */}
                  {pendingRefs.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pendingRefs.map(r => (
                        <div
                          key={r.tempId}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 8px', borderRadius: 6,
                            background: 'rgba(255,255,255,.03)', border: '0.5px solid var(--b1)',
                          }}
                        >
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{r.ref_type === 'file' ? '📁' : '🔗'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {r.url ? (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {r.label || r.file_name || r.url}
                              </a>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--ink1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.label || r.file_name || '—'}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePendingRef(r.tempId)}
                            style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* ── End references section ── */}

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
                {submitting ? 'Assigning…' : `Assign to ${activeMember}${pendingRefs.length > 0 ? ` + ${pendingRefs.length} ref${pendingRefs.length > 1 ? 's' : ''}` : ''}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RefRow({ ref_, onDelete }: { ref_: TaskRef; onDelete: () => void }) {
  const href = ref_.url ?? ref_.file_path ?? undefined
  const display = ref_.label || ref_.file_name || href || '—'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px', borderRadius: 6,
      background: 'rgba(255,255,255,.02)', border: '0.5px solid var(--b1)',
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{ref_.ref_type === 'file' ? '📁' : '🔗'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {display}
          </a>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--ink1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {display}
          </div>
        )}
      </div>
      <button
        onClick={onDelete}
        title="Remove reference"
        style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}
