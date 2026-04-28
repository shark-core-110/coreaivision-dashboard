'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type HealthStatus = 'green' | 'amber' | 'red'
type ClientStatus = 'active' | 'at-risk' | 'churned' | 'prospecting'

interface Client {
  id: string
  name: string
  type: string | null
  mrr: number
  status: ClientStatus
  health: HealthStatus
  renewal_date: string | null
  last_contact: string | null
  notes: string | null
  created_at: string
}

const HEALTH_COLOR: Record<HealthStatus, string> = {
  green: '#1e8a4a',
  amber: '#b86800',
  red:   '#c0392b',
}

const HEALTH_BG: Record<HealthStatus, string> = {
  green: 'rgba(30,138,74,.08)',
  amber: 'rgba(184,104,0,.08)',
  red:   'rgba(192,57,43,.08)',
}

const STATUS_LABEL: Record<ClientStatus, string> = {
  active:       'Active',
  'at-risk':    'At Risk',
  churned:      'Churned',
  prospecting:  'Prospect',
}

const STATUS_CYCLE: Record<ClientStatus, ClientStatus> = {
  active:      'at-risk',
  'at-risk':   'churned',
  churned:     'prospecting',
  prospecting: 'active',
}

const HEALTH_CYCLE: Record<HealthStatus, HealthStatus> = {
  green: 'amber',
  amber: 'red',
  red:   'green',
}

const CLIENT_TYPES = ['Brand', 'Agency', 'Startup', 'Creator', 'Enterprise', 'SMB']
const STATUSES: ClientStatus[] = ['active', 'at-risk', 'churned', 'prospecting']
const HEALTHS: HealthStatus[]  = ['green', 'amber', 'red']

const EMPTY_FORM = {
  name: '', type: 'Brand', mrr: '', status: 'active' as ClientStatus,
  health: 'green' as HealthStatus, renewal_date: '', last_contact: '', notes: '',
}

function renewalBadge(dateStr: string | null): { label: string; color: string } | null {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0)  return { label: `Overdue ${Math.abs(diff)}d`, color: 'var(--red, #c0392b)' }
  if (diff <= 30) return { label: `${diff}d left`,              color: 'var(--amber, #b86800)' }
  return { label: `${diff}d`,                                   color: 'var(--ink3, #666)' }
}

export default function ClientHealthPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState<ClientStatus | 'all'>('all')

  const fetchClients = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('client_health')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditClient(null); setShowAdd(true) }
  const openEdit = (c: Client) => {
    setForm({
      name: c.name, type: c.type ?? 'Brand', mrr: String(c.mrr),
      status: c.status, health: c.health,
      renewal_date: c.renewal_date ?? '', last_contact: c.last_contact ?? '',
      notes: c.notes ?? '',
    })
    setEditClient(c)
    setShowAdd(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name:          form.name.trim(),
      type:          form.type || null,
      mrr:           Number(form.mrr) || 0,
      status:        form.status,
      health:        form.health,
      renewal_date:  form.renewal_date || null,
      last_contact:  form.last_contact || null,
      notes:         form.notes || null,
    }
    if (editClient) {
      const { data } = await supabase.from('client_health').update(payload).eq('id', editClient.id).select().single()
      if (data) setClients(prev => prev.map(c => c.id === editClient.id ? data : c))
    } else {
      const { data } = await supabase.from('client_health').insert(payload).select().single()
      if (data) setClients(prev => [data, ...prev])
    }
    setSaving(false)
    setShowAdd(false)
  }

  const cycleHealth = async (client: Client) => {
    const next = HEALTH_CYCLE[client.health]
    const supabase = createClient()
    await supabase.from('client_health').update({ health: next }).eq('id', client.id)
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, health: next } : c))
  }

  const cycleStatus = async (client: Client) => {
    const next = STATUS_CYCLE[client.status]
    const supabase = createClient()
    await supabase.from('client_health').update({ status: next }).eq('id', client.id)
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: next } : c))
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Remove this client?')) return
    const supabase = createClient()
    await supabase.from('client_health').delete().eq('id', id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const visible = filter === 'all' ? clients : clients.filter(c => c.status === filter)

  const totalMrr    = clients.filter(c => c.status === 'active').reduce((s, c) => s + c.mrr, 0)
  const activeCount = clients.filter(c => c.status === 'active').length
  const atRiskCount = clients.filter(c => c.status === 'at-risk').length
  const prospCount  = clients.filter(c => c.status === 'prospecting').length

  return (
    <div style={{ padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.4px' }}>Client Health</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink3, #666)' }}>
            Revenue tracker · relationship pulse · renewal radar
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: 'var(--ink, #111)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Client
        </button>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Monthly MRR',    value: `$${totalMrr.toLocaleString()}`,  sub: 'active clients',     color: 'var(--green, #1e8a4a)' },
          { label: 'Active',         value: activeCount,                       sub: 'contracted',          color: 'var(--blue, #1a70ad)' },
          { label: 'At Risk',        value: atRiskCount,                       sub: 'needs attention',     color: 'var(--amber, #b86800)' },
          { label: 'Prospecting',    value: prospCount,                        sub: 'in pipeline',         color: 'var(--ink3, #666)' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--s2, #f8f8f8)', border: '1px solid var(--b1, #eee)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink3, #888)', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3, #888)', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background:   filter === s ? 'var(--ink, #111)' : 'transparent',
              color:        filter === s ? '#fff' : 'var(--ink3, #666)',
              border:       `1px solid ${filter === s ? 'transparent' : 'var(--b2, #ddd)'}`,
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Client grid */}
      {loading ? (
        <div style={{ color: 'var(--ink3)', padding: 40, textAlign: 'center' }}>Loading clients…</div>
      ) : visible.length === 0 ? (
        <div style={{ color: 'var(--ink3)', padding: 40, textAlign: 'center', border: '1px dashed var(--b2)', borderRadius: 12 }}>
          No clients yet. Add your first client above.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {visible.map(client => {
            const rb = renewalBadge(client.renewal_date)
            return (
              <div
                key={client.id}
                style={{
                  background: 'var(--s1, #fff)', border: '1px solid var(--b1, #eee)',
                  borderRadius: 12, padding: '18px 20px',
                  borderLeft: `3px solid ${HEALTH_COLOR[client.health]}`,
                  transition: 'box-shadow .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{client.name}</div>
                    {client.type && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{client.type}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Health dot — click to cycle */}
                    <button
                      onClick={() => cycleHealth(client)}
                      title={`Health: ${client.health}  (click to change)`}
                      style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: HEALTH_COLOR[client.health],
                        border: 'none', cursor: 'pointer', flexShrink: 0,
                        boxShadow: `0 0 0 3px ${HEALTH_BG[client.health]}`,
                      }}
                    />
                    {/* Status pill */}
                    <button
                      onClick={() => cycleStatus(client)}
                      title="Click to change status"
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: HEALTH_BG[client.health],
                        color: HEALTH_COLOR[client.health],
                        border: `1px solid ${HEALTH_COLOR[client.health]}33`,
                        cursor: 'pointer',
                      }}
                    >
                      {STATUS_LABEL[client.status]}
                    </button>
                  </div>
                </div>

                {/* MRR */}
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
                  ${client.mrr.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink3)' }}>/mo</span>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink3)', flexWrap: 'wrap' }}>
                  {rb && (
                    <span style={{ color: rb.color, fontWeight: 600 }}>🔁 {rb.label}</span>
                  )}
                  {client.last_contact && (
                    <span>Last contact: {client.last_contact}</span>
                  )}
                </div>

                {client.notes && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5, borderTop: '1px solid var(--b1)', paddingTop: 10 }}>
                    {client.notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button
                    onClick={() => openEdit(client)}
                    style={{ flex: 1, padding: '6px 0', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteClient(client.id)}
                    style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(192,57,43,.25)', color: 'var(--red, #c0392b)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {showAdd && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div style={{ background: 'var(--s1, #fff)', borderRadius: 14, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editClient ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink3)' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ gridColumn: '1/-1' }}>
                <span style={labelStyle}>Client Name *</span>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ACME Corp" />
              </label>
              <label>
                <span style={labelStyle}>Type</span>
                <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span style={labelStyle}>MRR (USD)</span>
                <input style={inputStyle} type="number" value={form.mrr} onChange={e => setForm(f => ({ ...f, mrr: e.target.value }))} placeholder="0" />
              </label>
              <label>
                <span style={labelStyle}>Status</span>
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ClientStatus }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <label>
                <span style={labelStyle}>Health</span>
                <select style={inputStyle} value={form.health} onChange={e => setForm(f => ({ ...f, health: e.target.value as HealthStatus }))}>
                  {HEALTHS.map(h => <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>)}
                </select>
              </label>
              <label>
                <span style={labelStyle}>Renewal Date</span>
                <input style={inputStyle} type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} />
              </label>
              <label>
                <span style={labelStyle}>Last Contact</span>
                <input style={inputStyle} type="date" value={form.last_contact} onChange={e => setForm(f => ({ ...f, last_contact: e.target.value }))} />
              </label>
              <label style={{ gridColumn: '1/-1' }}>
                <span style={labelStyle}>Notes</span>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Relationship context, goals…" />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px 0', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                style={{ flex: 2, padding: '10px 0', background: 'var(--ink, #111)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .6 : 1 }}
              >
                {saving ? 'Saving…' : editClient ? 'Update Client' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.05em',
  textTransform: 'uppercase', color: 'var(--ink3, #888)', marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
  background: 'var(--s2, #f8f8f8)', border: '1px solid var(--b2, #ddd)',
  borderRadius: 7, fontSize: 13, color: 'var(--ink)', outline: 'none',
  fontFamily: 'inherit',
}
