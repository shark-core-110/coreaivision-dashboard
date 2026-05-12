'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id:               string
  initials:         string
  name:             string
  role:             string
  short_role:       string | null
  capacity_pct:     number
  contractor:       boolean
  inactive:         boolean
  blue_indicator:   boolean
  task_description: string | null
  task_chips:       string[]
  display_order:    number
}

type EditDraft = Omit<Member, 'id'>

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

function chipsFromString(s: string): string[] {
  return s.split(',').map(c => c.trim()).filter(Boolean)
}

function chipsToString(chips: string[]): string {
  return chips.join(', ')
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ fontSize: 12, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
      {label}
    </label>
  )
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

export default function AdminTeam() {
  const { user, loading } = useCurrentUser()
  const router = useRouter()

  const [items,       setItems]       = useState<Member[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [draft,       setDraft]       = useState<EditDraft | null>(null)
  const [draftChips,  setDraftChips]  = useState('')

  // Create form fields
  const [initials,   setInitials]   = useState('')
  const [name,       setName]       = useState('')
  const [role,       setRole]       = useState('')
  const [shortRole,  setShortRole]  = useState('')
  const [capacity,   setCapacity]   = useState(0)
  const [contractor, setContractor] = useState(false)
  const [inactive,   setInactive]   = useState(false)
  const [blueInd,    setBlueInd]    = useState(false)
  const [taskDesc,   setTaskDesc]   = useState('')
  const [chips,      setChips]      = useState('')
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
      .from('dashboard_team')
      .select('id, initials, name, role, short_role, capacity_pct, contractor, inactive, blue_indicator, task_description, task_chips, display_order')
      .order('display_order', { ascending: true })
    setItems((data as Member[]) ?? [])
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
    if (!name.trim() || !initials.trim()) return
    setSubmitting(true)
    const sb = createClient()
    const { error } = await sb.from('dashboard_team').insert({
      initials:         initials.trim().toUpperCase(),
      name:             name.trim(),
      role:             role.trim(),
      short_role:       shortRole.trim() || null,
      capacity_pct:     capacity,
      contractor,
      inactive,
      blue_indicator:   blueInd,
      task_description: taskDesc.trim() || null,
      task_chips:       chipsFromString(chips),
      display_order:    order,
    })
    setSubmitting(false)
    if (error) {
      setFeedback({ ok: false, msg: error.message })
    } else {
      setFeedback({ ok: true, msg: `${name.trim()} added to team` })
      setInitials(''); setName(''); setRole(''); setShortRole(''); setCapacity(0)
      setContractor(false); setInactive(false); setBlueInd(false)
      setTaskDesc(''); setChips(''); setOrder(0)
      await fetchItems()
    }
  }

  function startEdit(m: Member) {
    setEditingId(m.id)
    setDraft({
      initials:         m.initials,
      name:             m.name,
      role:             m.role,
      short_role:       m.short_role,
      capacity_pct:     m.capacity_pct,
      contractor:       m.contractor,
      inactive:         m.inactive,
      blue_indicator:   m.blue_indicator,
      task_description: m.task_description,
      task_chips:       m.task_chips,
      display_order:    m.display_order,
    })
    setDraftChips(chipsToString(m.task_chips))
  }

  async function saveEdit(id: string) {
    if (!draft) return
    const payload = { ...draft, task_chips: chipsFromString(draftChips) }
    const sb = createClient()
    const { error } = await sb.from('dashboard_team').update(payload).eq('id', id)
    if (error) { setFeedback({ ok: false, msg: error.message }); return }
    setFeedback({ ok: true, msg: 'Saved' })
    setEditingId(null); setDraft(null); setDraftChips('')
    await fetchItems()
  }

  async function deleteItem(id: string, memberName: string) {
    if (!window.confirm(`Remove ${memberName} from the team? This cannot be undone.`)) return
    const sb = createClient()
    await sb.from('dashboard_team').delete().eq('id', id)
    setItems(prev => prev.filter(m => m.id !== id))
    setFeedback({ ok: true, msg: `${memberName} removed` })
  }

  if (loading || !user?.isAdmin) return null

  return (
    <>
      <FeedbackBanner fb={feedback} />

      <div className="grid2" style={{ alignItems: 'start', gap: 20 }}>
        {/* ── Left: list ── */}
        <div>
          <div className="sec" style={{ marginTop: 0 }}>Team Members ({items.length})</div>

          {dataLoading ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>No team members yet.</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((m, i) => {
                const isEditing = editingId === m.id
                return (
                  <div key={m.id} style={{ borderBottom: i < items.length - 1 ? '0.5px solid var(--b1)' : 'none' }}>
                    {isEditing && draft ? (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr', gap: 8 }}>
                          <input value={draft.initials} onChange={e => setDraft(d => d ? { ...d, initials: e.target.value.toUpperCase() } : d)} maxLength={3} placeholder="KR" style={{ ...inp, fontSize: 12, textAlign: 'center', textTransform: 'uppercase' }} />
                          <input value={draft.name} onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)} placeholder="Full name" style={{ ...inp, fontSize: 12 }} />
                          <input value={draft.role} onChange={e => setDraft(d => d ? { ...d, role: e.target.value } : d)} placeholder="Role" style={{ ...inp, fontSize: 12 }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 56px', gap: 8 }}>
                          <input value={draft.short_role ?? ''} onChange={e => setDraft(d => d ? { ...d, short_role: e.target.value || null } : d)} placeholder="Short role" style={{ ...inp, fontSize: 12 }} />
                          <input type="number" value={draft.capacity_pct} onChange={e => setDraft(d => d ? { ...d, capacity_pct: Number(e.target.value) } : d)} min={0} max={100} placeholder="%" style={{ ...inp, fontSize: 12 }} />
                          <input type="number" value={draft.display_order} onChange={e => setDraft(d => d ? { ...d, display_order: Number(e.target.value) } : d)} placeholder="#" style={{ ...inp, fontSize: 12 }} />
                        </div>
                        <input value={draft.task_description ?? ''} onChange={e => setDraft(d => d ? { ...d, task_description: e.target.value || null } : d)} placeholder="Task description" style={{ ...inp, fontSize: 12 }} />
                        <input value={draftChips} onChange={e => setDraftChips(e.target.value)} placeholder="Chips (comma-separated): Kling, Lipsync" style={{ ...inp, fontSize: 12 }} />
                        <div style={{ display: 'flex', gap: 16 }}>
                          <CheckField label="Contractor"     checked={draft.contractor}     onChange={v => setDraft(d => d ? { ...d, contractor: v }     : d)} />
                          <CheckField label="Inactive"       checked={draft.inactive}       onChange={v => setDraft(d => d ? { ...d, inactive: v }       : d)} />
                          <CheckField label="Blue indicator" checked={draft.blue_indicator} onChange={v => setDraft(d => d ? { ...d, blue_indicator: v } : d)} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingId(null); setDraft(null); setDraftChips('') }} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>Cancel</button>
                          <button onClick={() => saveEdit(m.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '0.5px solid rgba(26,112,173,.4)', background: 'rgba(26,112,173,.1)', color: 'var(--blue)', fontWeight: 600 }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, opacity: m.inactive ? 0.5 : 1 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(255,255,255,.07)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                          color: m.blue_indicator ? 'var(--blue)' : 'var(--ink2)',
                        }}>
                          {m.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--ink1)', fontWeight: 500 }}>
                            {m.name}
                            {m.contractor && <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 6, padding: '1px 5px', border: '0.5px solid var(--b1)', borderRadius: 4 }}>contractor</span>}
                            {m.inactive   && <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 6, padding: '1px 5px', border: '0.5px solid var(--b1)', borderRadius: 4 }}>inactive</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{m.role}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span>{m.capacity_pct}%</span>
                            {m.task_chips.length > 0 && <span>{m.task_chips.join(' · ')}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingTop: 2 }}>
                          <button onClick={() => startEdit(m)} title="Edit" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid var(--b1)', background: 'var(--s2)', color: 'var(--ink3)' }}>✎</button>
                          <button onClick={() => deleteItem(m.id, m.name)} title="Delete" style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '0.5px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.07)', color: '#ef4444' }}>✕</button>
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
          <div className="sec" style={{ marginTop: 0 }}>Add Team Member</div>
          <div className="card">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Init *</label>
                  <input value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} required maxLength={3} placeholder="KR" style={{ ...inp, textAlign: 'center', textTransform: 'uppercase', fontSize: 14 }} />
                </div>
                <div>
                  <label style={lbl}>Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="Full name" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Role</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="AI Visual Artist" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
                <div>
                  <label style={lbl}>Short Role</label>
                  <input value={shortRole} onChange={e => setShortRole(e.target.value)} placeholder="AI Creator" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Capacity %</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} min={0} max={100} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Task Description</label>
                <input value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="What they're working on…" style={inp} />
              </div>
              <div>
                <label style={lbl}>Task Chips (comma-separated)</label>
                <input value={chips} onChange={e => setChips(e.target.value)} placeholder="Kling, Lipsync" style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <CheckField label="Contractor"     checked={contractor} onChange={setContractor} />
                <CheckField label="Inactive"       checked={inactive}   onChange={setInactive}   />
                <CheckField label="Blue indicator" checked={blueInd}    onChange={setBlueInd}    />
              </div>
              <div>
                <label style={lbl}>Display Order</label>
                <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} min={0} style={inp} />
              </div>
              <button type="submit" disabled={submitting || !name.trim() || !initials.trim()} style={{ padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(26,112,173,.15)', border: '0.5px solid rgba(26,112,173,.4)', color: 'var(--blue)', opacity: submitting || !name.trim() || !initials.trim() ? 0.45 : 1, transition: 'opacity .15s' }}>
                {submitting ? 'Adding…' : '+ Add Member'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
