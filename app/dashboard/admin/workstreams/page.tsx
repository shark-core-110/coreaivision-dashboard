'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'

interface Workstream {
  id:            string
  name:          string
  status:        string
  icon:          string
  badge_class:   string
  display_order: number
}

type EditDraft = Omit<Workstream, 'id'>

const STATUSES = ['active', 'building', 'planning', 'starting', 'paused', 'done'] as const

const BADGE_MAP: Record<string, string> = {
  active:   'b-active',
  building: 'b-blue',
  planning: 'b-pending',
  starting: 'b-pending',
  paused:   'b-inactive',
  done:     'b-active',
}

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

export default function AdminWorkstreams() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()

  const [items,       setItems]       = useState<Workstream[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [draft,       setDraft]       = useState<EditDraft | null>(null)

  const [name,       setName]       = useState('')
  const [status,     setStatus]     = useState('active')
  const [icon,       setIcon]       = useState('◈')
  const [order,      setOrder]      = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [feedback,   setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace('/dashboard')
  }, [user, loading, router])

  const fetchItems = useCallback(async () => {
    setDataLoading(true)
    const sb = createClient()
    const { data } = await sb
      .from('workstreams')
      .select('id, name, status, icon, badge_class, display_order')
      .order('display_order', { ascending: true })
    setItems((data as Workstream[]) ?? [])
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
    if (!name.trim()) return
    setSubmitting(true)
    const sb = createClient()
    const { error } = await sb.from('workstreams').insert({
      name: name.trim(),
      status,
      icon: icon.trim() || '◈',
      badge_class: BADGE_MAP[status] ?? 'b-active',
      display_order: order,
    })
    setSubmitting(false)
    if (error) {
      setFeedback({ ok: false, msg: error.message })
    } else {
      setFeedback({ ok: true, msg: 'Workstream added' })
      setName(''); setStatus('active'); setIcon('◈'); setOrder(0)
      await fetchItems()
    }
  }

  function startEdit(w: Workstream) {
    setEditingId(w.id)
    setDraft({ name: w.name, status: w.status, icon: w.icon, badge_class: w.badge_class, display_order: w.display_order })
  }

  async function saveEdit(id: string) {
    if (!draft) return
    const updated = { ...draft, badge_class: BADGE_MAP[draft.status] ?? draft.badge_class }
    const sb = createClient()
    const { error } = await sb.from('workstreams').update(updated).eq('id', id)
    if (error) { setFeedback({ ok: false, msg: error.message }); return }
    setFeedback({ ok: true, msg: 'Saved' })
    setEditingId(null); setDraft(null)
    await fetchItems()
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this workstream?')) return
    const sb = createClient()
    await sb.from('workstreams').delete().eq('id', id)
    setItems(prev => prev.filter(w => w.id !== id))
    setFeedback({ ok: true, msg: 'Deleted' })
  }

  if (loading || !user?.isAdmin) return null

  return (
    <>
      <FeedbackBanner fb={feedback} />

      <div className="grid2" style={{ alignItems: 'start', gap: 20 }}>
        {/* ── Left: list ── */}
        <div>
          <div className="sec" style={{ marginTop: 0 }}>All Workstreams ({items.length})</div>

          {dataLoading ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>No workstreams yet.</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((w, i) => {
                const isEditing = editingId === w.id
                return (
                  <div key={w.id} style={{ borderBottom: i < items.length - 1 ? '0.5px solid var(--b1)' : 'none' }}>
                    {isEditing && draft ? (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 42px 56px', gap: 8 }}>
                          <input value={draft.name} onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)} placeholder="Name" style={{ ...inp, fontSize: 12 }} />
                          <select value={draft.status} onChange={e => setDraft(d => d ? { ...d, status: e.target.value } : d)} style={{ ...inp, fontSize: 12 }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input value={draft.icon} onChange={e => setDraft(d => d ? { ...d, icon: e.target.value } : d)} placeholder="◈" maxLength={4} style={{ ...inp, fontSize: 16, textAlign: 'center', padding: '8px 4px' }} />
                          <input type="number" value={draft.display_order} onChange={e => setDraft(d => d ? { ...d, display_order: Number(e.target.value) } : d)} style={{ ...inp, fontSize: 12 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingId(null); setDraft(null) }} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>Cancel</button>
                          <button onClick={() => saveEdit(w.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid rgba(26,112,173,.4)', background: 'rgba(26,112,173,.1)', color: 'var(--blue)', fontWeight: 600 }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{w.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--ink1)', fontWeight: 500 }}>{w.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>order {w.display_order}</div>
                        </div>
                        <span className={`badge ${w.badge_class}`} style={{ flexShrink: 0, marginRight: 8 }}>{w.status}</span>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          <button onClick={() => startEdit(w)} title="Edit" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>✎</button>
                          <button onClick={() => deleteItem(w.id)} title="Delete" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.07)', color: '#ef4444' }}>✕</button>
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
          <div className="sec" style={{ marginTop: 0 }}>Add Workstream</div>
          <div className="card">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Micro drama series" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Icon</label>
                  <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} placeholder="◈" style={{ ...inp, fontSize: 18 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Display Order</label>
                <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={0} style={inp} />
              </div>
              <button type="submit" disabled={submitting || !name.trim()} style={{ padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(26,112,173,.15)', border: '0.5px solid rgba(26,112,173,.4)', color: 'var(--blue)', opacity: submitting || !name.trim() ? 0.45 : 1, transition: 'opacity .15s' }}>
                {submitting ? 'Adding…' : '+ Add Workstream'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
