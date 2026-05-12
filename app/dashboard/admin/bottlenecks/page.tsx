'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'

interface Bottleneck {
  id:         string
  text:       string
  severity:   'crit' | 'med' | 'low'
  owner:      string | null
  scope:      string
  resolved:   boolean
  created_at: string
}

type EditDraft = Omit<Bottleneck, 'id' | 'created_at'>

const SCOPES     = ['overview', 'instagram', 'ops'] as const
const SEVERITIES = ['crit', 'med', 'low'] as const

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

function sevColor(s: string) {
  if (s === 'crit') return '#ef4444'
  if (s === 'med')  return '#f59e0b'
  return '#22c55e'
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

export default function AdminBottlenecks() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()

  const [items,       setItems]       = useState<Bottleneck[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [draft,       setDraft]       = useState<EditDraft | null>(null)

  const [text,       setText]       = useState('')
  const [severity,   setSeverity]   = useState<'crit' | 'med' | 'low'>('med')
  const [owner,      setOwner]      = useState('')
  const [scope,      setScope]      = useState('overview')
  const [submitting, setSubmitting] = useState(false)
  const [feedback,   setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace('/dashboard')
  }, [user, loading, router])

  const fetchItems = useCallback(async () => {
    setDataLoading(true)
    const sb = createClient()
    const { data } = await sb
      .from('bottlenecks')
      .select('id, text, severity, owner, scope, resolved, created_at')
      .order('created_at', { ascending: false })
    setItems((data as Bottleneck[]) ?? [])
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
    if (!text.trim()) return
    setSubmitting(true)
    const sb = createClient()
    const { error } = await sb.from('bottlenecks').insert({
      text: text.trim(), severity, owner: owner.trim() || null, scope, resolved: false,
    })
    setSubmitting(false)
    if (error) {
      setFeedback({ ok: false, msg: error.message })
    } else {
      setFeedback({ ok: true, msg: 'Bottleneck added' })
      setText(''); setOwner(''); setSeverity('med'); setScope('overview')
      await fetchItems()
    }
  }

  function startEdit(b: Bottleneck) {
    setEditingId(b.id)
    setDraft({ text: b.text, severity: b.severity, owner: b.owner, scope: b.scope, resolved: b.resolved })
  }

  async function saveEdit(id: string) {
    if (!draft) return
    const sb = createClient()
    const { error } = await sb.from('bottlenecks').update(draft).eq('id', id)
    if (error) { setFeedback({ ok: false, msg: error.message }); return }
    setFeedback({ ok: true, msg: 'Saved' })
    setEditingId(null); setDraft(null)
    await fetchItems()
  }

  async function toggleResolved(id: string, current: boolean) {
    const sb = createClient()
    await sb.from('bottlenecks').update({ resolved: !current }).eq('id', id)
    setItems(prev => prev.map(b => b.id === id ? { ...b, resolved: !current } : b))
  }

  async function deleteItem(id: string) {
    if (!window.confirm('Delete this bottleneck permanently?')) return
    const sb = createClient()
    await sb.from('bottlenecks').delete().eq('id', id)
    setItems(prev => prev.filter(b => b.id !== id))
    setFeedback({ ok: true, msg: 'Deleted' })
  }

  if (loading || !user?.isAdmin) return null

  return (
    <>
      <FeedbackBanner fb={feedback} />

      <div className="grid2" style={{ alignItems: 'start', gap: 20 }}>
        {/* ── Left: list ── */}
        <div>
          <div className="sec" style={{ marginTop: 0 }}>All Bottlenecks ({items.length})</div>

          {dataLoading ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>No bottlenecks yet.</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((b, i) => {
                const isEditing = editingId === b.id
                return (
                  <div key={b.id} style={{ borderBottom: i < items.length - 1 ? '0.5px solid var(--b1)' : 'none' }}>
                    {isEditing && draft ? (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea
                          value={draft.text}
                          onChange={e => setDraft(d => d ? { ...d, text: e.target.value } : d)}
                          rows={2}
                          style={{ ...inp, resize: 'vertical', fontSize: 12 }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <select value={draft.severity} onChange={e => setDraft(d => d ? { ...d, severity: e.target.value as 'crit'|'med'|'low' } : d)} style={{ ...inp, fontSize: 12 }}>
                            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select value={draft.scope} onChange={e => setDraft(d => d ? { ...d, scope: e.target.value } : d)} style={{ ...inp, fontSize: 12 }}>
                            {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input value={draft.owner ?? ''} onChange={e => setDraft(d => d ? { ...d, owner: e.target.value || null } : d)} placeholder="Owner" style={{ ...inp, fontSize: 12 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <label style={{ fontSize: 12, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                            <input type="checkbox" checked={draft.resolved} onChange={e => setDraft(d => d ? { ...d, resolved: e.target.checked } : d)} />
                            Resolved
                          </label>
                          <div style={{ flex: 1 }} />
                          <button onClick={() => { setEditingId(null); setDraft(null) }} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>Cancel</button>
                          <button onClick={() => saveEdit(b.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid rgba(26,112,173,.4)', background: 'rgba(26,112,173,.1)', color: 'var(--blue)', fontWeight: 600 }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: b.resolved ? 'var(--ink4)' : 'var(--ink1)', textDecoration: b.resolved ? 'line-through' : 'none', lineHeight: 1.4 }}>
                            {b.text}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ color: sevColor(b.severity) }}>{b.severity}</span>
                            <span>{b.scope}</span>
                            {b.owner && <span>{b.owner}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingTop: 2 }}>
                          <button onClick={() => toggleResolved(b.id, b.resolved)} title={b.resolved ? 'Reopen' : 'Resolve'} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid rgba(34,197,94,.3)', background: b.resolved ? 'rgba(34,197,94,.15)' : 'rgba(34,197,94,.06)', color: '#22c55e' }}>
                            {b.resolved ? '↺' : '✓'}
                          </button>
                          <button onClick={() => startEdit(b)} title="Edit" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>✎</button>
                          <button onClick={() => deleteItem(b.id)} title="Delete" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.07)', color: '#ef4444' }}>✕</button>
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
          <div className="sec" style={{ marginTop: 0 }}>Add Bottleneck</div>
          <div className="card">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Text *</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Describe the bottleneck…" required style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Severity</label>
                  <select value={severity} onChange={e => setSeverity(e.target.value as 'crit'|'med'|'low')} style={inp}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Scope</label>
                  <select value={scope} onChange={e => setScope(e.target.value)} style={inp}>
                    {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Owner (optional)</label>
                <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Team, Shark, AI Creators…" style={inp} />
              </div>
              <button type="submit" disabled={submitting || !text.trim()} style={{ padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(26,112,173,.15)', border: '0.5px solid rgba(26,112,173,.4)', color: 'var(--blue)', opacity: submitting || !text.trim() ? 0.45 : 1, transition: 'opacity .15s' }}>
                {submitting ? 'Adding…' : '+ Add Bottleneck'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
