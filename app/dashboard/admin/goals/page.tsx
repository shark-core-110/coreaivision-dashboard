'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'

interface Goal {
  id:            string
  title:         string
  description:   string | null
  status:        'done' | 'prog' | 'todo'
  target_label:  string | null
  display_order: number
}

type EditDraft = Omit<Goal, 'id'>

const STATUSES = ['todo', 'prog', 'done'] as const

const STATUS_LABEL: Record<string, string> = { todo: 'Not Started', prog: 'In Progress', done: 'Done' }
const STATUS_COLOR: Record<string, string> = { todo: 'var(--ink4)', prog: 'var(--blue)', done: '#22c55e' }

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 7,
  border: '0.5px solid var(--b1)', background: 'var(--s2)',
  color: 'var(--ink1)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}
const lbl: React.CSSProperties = {
  fontSize: 11, color: 'var(--ink4)', fontWeight: 600,
  display: 'block', marginBottom: 5, textTransform: 'uppercase',
  letterSpacing: '.05em',
}

function FeedbackBanner({ fb }: { fb: { ok: boolean; msg: string } | null }) {
  if (!fb) return null
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 7, fontSize: 13, marginBottom: 16,
      background: fb.ok ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
      color:      fb.ok ? '#22c55e'            : '#ef4444',
      border:     `0.5px solid ${fb.ok ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
    }}>
      {fb.ok ? '✓ ' : '✕ '}{fb.msg}
    </div>
  )
}

export default function AdminGoals() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()

  const [items,       setItems]       = useState<Goal[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [draft,       setDraft]       = useState<EditDraft | null>(null)

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [status,      setStatus]      = useState<'todo' | 'prog' | 'done'>('todo')
  const [targetLabel, setTargetLabel] = useState('')
  const [order,       setOrder]       = useState(0)
  const [submitting,  setSubmitting]  = useState(false)
  const [feedback,    setFeedback]    = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace('/dashboard')
  }, [user, loading, router])

  const fetchItems = useCallback(async () => {
    setDataLoading(true)
    const sb = createClient()
    const { data } = await sb
      .from('strategic_goals')
      .select('id, title, description, status, target_label, display_order')
      .order('display_order', { ascending: true })
    setItems((data as Goal[]) ?? [])
    setDataLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(t)
  }, [feedback])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    const sb = createClient()
    const { error } = await sb.from('strategic_goals').insert({
      title: title.trim(),
      description: description.trim() || null,
      status,
      target_label: targetLabel.trim() || null,
      display_order: order,
    })
    setSubmitting(false)
    if (error) {
      setFeedback({ ok: false, msg: error.message })
    } else {
      setFeedback({ ok: true, msg: 'Goal added' })
      setTitle(''); setDescription(''); setStatus('todo'); setTargetLabel(''); setOrder(0)
      await fetchItems()
    }
  }

  function startEdit(g: Goal) {
    setEditingId(g.id)
    setDraft({
      title:         g.title,
      description:   g.description,
      status:        g.status,
      target_label:  g.target_label,
      display_order: g.display_order,
    })
  }

  async function saveEdit(id: string) {
    if (!draft) return
    const sb = createClient()
    const { error } = await sb.from('strategic_goals').update(draft).eq('id', id)
    if (error) { setFeedback({ ok: false, msg: error.message }); return }
    setFeedback({ ok: true, msg: 'Saved' })
    setEditingId(null); setDraft(null)
    await fetchItems()
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this goal?')) return
    const sb = createClient()
    await sb.from('strategic_goals').delete().eq('id', id)
    setItems(prev => prev.filter(g => g.id !== id))
    setFeedback({ ok: true, msg: 'Deleted' })
  }

  if (loading || !user?.isAdmin) return null

  return (
    <>
      <FeedbackBanner fb={feedback} />

      <div className="grid2" style={{ alignItems: 'start', gap: 20 }}>
        {/* ── Left: list ── */}
        <div>
          <div className="sec" style={{ marginTop: 0 }}>All Goals ({items.length})</div>

          {dataLoading ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>No goals yet.</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((g, i) => {
                const isEditing = editingId === g.id
                return (
                  <div key={g.id} style={{ borderBottom: i < items.length - 1 ? '0.5px solid var(--b1)' : 'none' }}>
                    {isEditing && draft ? (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          value={draft.title}
                          onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                          placeholder="Title"
                          style={{ ...inp, fontSize: 12 }}
                        />
                        <textarea
                          value={draft.description ?? ''}
                          onChange={e => setDraft(d => d ? { ...d, description: e.target.value || null } : d)}
                          rows={2}
                          placeholder="Description"
                          style={{ ...inp, fontSize: 12, resize: 'vertical' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 56px', gap: 8 }}>
                          <select value={draft.status} onChange={e => setDraft(d => d ? { ...d, status: e.target.value as 'todo'|'prog'|'done' } : d)} style={{ ...inp, fontSize: 12 }}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                          </select>
                          <input
                            value={draft.target_label ?? ''}
                            onChange={e => setDraft(d => d ? { ...d, target_label: e.target.value || null } : d)}
                            placeholder="Jul 2026"
                            style={{ ...inp, fontSize: 12 }}
                          />
                          <input
                            type="number"
                            value={draft.display_order}
                            onChange={e => setDraft(d => d ? { ...d, display_order: Number(e.target.value) } : d)}
                            style={{ ...inp, fontSize: 12 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingId(null); setDraft(null) }} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>Cancel</button>
                          <button onClick={() => saveEdit(g.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid rgba(26,112,173,.4)', background: 'rgba(26,112,173,.1)', color: 'var(--blue)', fontWeight: 600 }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--ink1)', fontWeight: 500, lineHeight: 1.4 }}>{g.title}</div>
                          {g.description && (
                            <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3, fontStyle: 'italic' }}>{g.description}</div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4, display: 'flex', gap: 10 }}>
                            <span style={{ color: STATUS_COLOR[g.status] }}>{STATUS_LABEL[g.status]}</span>
                            {g.target_label && <span>{g.target_label}</span>}
                            <span>#{g.display_order}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingTop: 2 }}>
                          <button onClick={() => startEdit(g)} title="Edit" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>✎</button>
                          <button onClick={() => deleteItem(g.id)} title="Delete" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.07)', color: '#ef4444' }}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: create form ── */}
        <div>
          <div className="sec" style={{ marginTop: 0 }}>Add Goal</div>
          <div className="card">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Hit 50K followers" style={inp} />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief context or success criteria…" style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as 'todo'|'prog'|'done')} style={inp}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Target Date</label>
                  <input value={targetLabel} onChange={e => setTargetLabel(e.target.value)} placeholder="Jul 2026" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Display Order</label>
                <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={0} style={inp} />
              </div>
              <button type="submit" disabled={submitting || !title.trim()} style={{ padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(26,112,173,.15)', border: '0.5px solid rgba(26,112,173,.4)', color: 'var(--blue)', opacity: submitting || !title.trim() ? 0.45 : 1, transition: 'opacity .15s' }}>
                {submitting ? 'Adding…' : '+ Add Goal'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
