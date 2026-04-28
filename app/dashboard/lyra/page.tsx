'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type DealStage = 'prospecting' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
type DealType  = 'Brand Deal' | 'Licensing' | 'White-label' | 'Retainer' | 'Sponsorship' | 'Collab'

interface LyraDeal {
  id: string
  brand: string
  contact: string | null
  deal_type: DealType
  stage: DealStage
  value: number
  platform: string | null
  deliverables: string | null
  deadline: string | null
  notes: string | null
  created_at: string
}

const STAGES: DealStage[] = ['prospecting', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

const STAGE_META: Record<DealStage, { label: string; color: string; bg: string }> = {
  prospecting:  { label: 'Prospecting',  color: '#666',     bg: 'rgba(100,100,100,.07)' },
  proposal:     { label: 'Proposal Out', color: '#1a70ad',  bg: 'rgba(26,112,173,.08)' },
  negotiation:  { label: 'Negotiating',  color: '#b86800',  bg: 'rgba(184,104,0,.08)' },
  closed_won:   { label: 'Closed ✓',     color: '#1e8a4a',  bg: 'rgba(30,138,74,.08)' },
  closed_lost:  { label: 'Lost',         color: '#c0392b',  bg: 'rgba(192,57,43,.07)' },
}

const DEAL_TYPES: DealType[] = ['Brand Deal', 'Licensing', 'White-label', 'Retainer', 'Sponsorship', 'Collab']
const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Podcast', 'Multi-platform', 'Other']

const NEXT_STAGE: Record<DealStage, DealStage | null> = {
  prospecting: 'proposal', proposal: 'negotiation', negotiation: 'closed_won',
  closed_won: null, closed_lost: null,
}

const EMPTY_FORM = {
  brand: '', contact: '', deal_type: 'Brand Deal' as DealType,
  stage: 'prospecting' as DealStage, value: '',
  platform: 'Instagram', deliverables: '', deadline: '', notes: '',
}

function daysUntil(dateStr: string | null): { label: string; color: string } | null {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, color: '#c0392b' }
  if (diff <= 7)  return { label: `${diff}d left`,              color: '#b86800' }
  if (diff <= 30) return { label: `${diff}d`,                   color: '#1a70ad' }
  return { label: `${diff}d`,                                    color: '#888' }
}

export default function LyraPage() {
  const [deals, setDeals]       = useState<LyraDeal[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [detail, setDetail]     = useState<LyraDeal | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all')

  const fetchDeals = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('lyra_deals')
      .select('*')
      .order('created_at', { ascending: false })
    setDeals(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setShowAdd(true) }
  const openDetail = (deal: LyraDeal) => { setDetail(deal); setEditMode(false) }

  const startEdit = (deal: LyraDeal) => {
    setForm({
      brand: deal.brand, contact: deal.contact ?? '', deal_type: deal.deal_type,
      stage: deal.stage, value: String(deal.value), platform: deal.platform ?? 'Instagram',
      deliverables: deal.deliverables ?? '', deadline: deal.deadline ?? '', notes: deal.notes ?? '',
    })
    setEditMode(true)
  }

  const handleSave = async () => {
    if (!form.brand.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      brand:        form.brand.trim(),
      contact:      form.contact || null,
      deal_type:    form.deal_type,
      stage:        form.stage,
      value:        Number(form.value) || 0,
      platform:     form.platform || null,
      deliverables: form.deliverables || null,
      deadline:     form.deadline || null,
      notes:        form.notes || null,
    }
    if (editMode && detail) {
      const { data } = await supabase.from('lyra_deals').update(payload).eq('id', detail.id).select().single()
      if (data) {
        setDeals(prev => prev.map(d => d.id === detail.id ? data : d))
        setDetail(data)
      }
      setEditMode(false)
    } else {
      const { data } = await supabase.from('lyra_deals').insert(payload).select().single()
      if (data) setDeals(prev => [data, ...prev])
      setShowAdd(false)
    }
    setSaving(false)
  }

  const advanceStage = async (deal: LyraDeal) => {
    const next = NEXT_STAGE[deal.stage]
    if (!next) return
    const supabase = createClient()
    await supabase.from('lyra_deals').update({ stage: next }).eq('id', deal.id)
    const updated = { ...deal, stage: next }
    setDeals(prev => prev.map(d => d.id === deal.id ? updated : d))
    if (detail?.id === deal.id) setDetail(updated)
  }

  const markLost = async (deal: LyraDeal) => {
    if (!confirm('Mark this deal as lost?')) return
    const supabase = createClient()
    await supabase.from('lyra_deals').update({ stage: 'closed_lost' }).eq('id', deal.id)
    const updated = { ...deal, stage: 'closed_lost' as DealStage }
    setDeals(prev => prev.map(d => d.id === deal.id ? updated : d))
    if (detail?.id === deal.id) setDetail(updated)
  }

  const deleteDeal = async (id: string) => {
    if (!confirm('Delete this deal?')) return
    const supabase = createClient()
    await supabase.from('lyra_deals').delete().eq('id', id)
    setDeals(prev => prev.filter(d => d.id !== id))
    if (detail?.id === id) setDetail(null)
  }

  const visible = stageFilter === 'all' ? deals : deals.filter(d => d.stage === stageFilter)

  const totalPipeline = deals.filter(d => d.stage !== 'closed_lost').reduce((s, d) => s + d.value, 0)
  const closedWon     = deals.filter(d => d.stage === 'closed_won').reduce((s, d) => s + d.value, 0)
  const activeDeals   = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length
  const wonCount      = deals.filter(d => d.stage === 'closed_won').length

  return (
    <div style={{ padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.4px' }}>Lyra Pipeline</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink3, #666)' }}>
            Brand deals · licensing · partnerships · sponsorships
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: 'var(--ink, #111)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Deal
        </button>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Pipeline', value: `$${totalPipeline.toLocaleString()}`, sub: 'excl. lost',      color: '#1a70ad' },
          { label: 'Revenue Won',    value: `$${closedWon.toLocaleString()}`,      sub: 'closed deals',   color: '#1e8a4a' },
          { label: 'Active Deals',   value: activeDeals,                           sub: 'in progress',    color: '#b86800' },
          { label: 'Deals Closed',   value: wonCount,                              sub: 'won this period', color: 'var(--ink, #111)' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink3, #888)', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: 'var(--ink3, #888)', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Stage filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', ...STAGES] as const).map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            style={{
              background:   stageFilter === s ? 'var(--ink)' : 'transparent',
              color:        stageFilter === s ? '#fff' : 'var(--ink3)',
              border:       `1px solid ${stageFilter === s ? 'transparent' : 'var(--b2)'}`,
              borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {s === 'all' ? `All (${deals.length})` : `${STAGE_META[s].label} (${deals.filter(d => d.stage === s).length})`}
          </button>
        ))}
      </div>

      {/* Deal list */}
      {loading ? (
        <div style={{ color: 'var(--ink3)', padding: 40, textAlign: 'center' }}>Loading pipeline…</div>
      ) : visible.length === 0 ? (
        <div style={{ color: 'var(--ink3)', padding: 40, textAlign: 'center', border: '1px dashed var(--b2)', borderRadius: 12 }}>
          No deals yet. Click + New Deal to start tracking.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(deal => {
            const meta = STAGE_META[deal.stage]
            const dl   = daysUntil(deal.deadline)
            return (
              <div
                key={deal.id}
                onClick={() => openDetail(deal)}
                style={{
                  background: 'var(--s1, #fff)', border: '1px solid var(--b1)', borderRadius: 12,
                  padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'box-shadow .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{deal.brand}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1 }}>
                    {deal.deal_type}{deal.platform ? ` · ${deal.platform}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', minWidth: 90, textAlign: 'right' }}>
                  ${deal.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.color, minWidth: 100, textAlign: 'center' }}>
                  {meta.label}
                </div>
                {dl && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: dl.color, minWidth: 80, textAlign: 'right' }}>
                    {dl.label}
                  </div>
                )}
                {NEXT_STAGE[deal.stage] && (
                  <button
                    onClick={e => { e.stopPropagation(); advanceStage(deal) }}
                    title={`Move to ${STAGE_META[NEXT_STAGE[deal.stage]!].label}`}
                    style={{ padding: '5px 10px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add deal modal */}
      {showAdd && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div style={{ background: 'var(--s1, #fff)', borderRadius: 14, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>New Deal</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink3)' }}>×</button>
            </div>
            <DealForm form={form} setForm={setForm} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px 0', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.brand.trim()}
                style={{ flex: 2, padding: '10px 0', background: 'var(--ink, #111)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .6 : 1 }}
              >
                {saving ? 'Saving…' : 'Add Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail side panel */}
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) { setDetail(null); setEditMode(false) } }}
        >
          <div style={{ background: 'var(--s1, #fff)', height: '100%', width: '100%', maxWidth: 480, padding: 32, boxShadow: '-10px 0 40px rgba(0,0,0,.12)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{detail.brand}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editMode && (
                  <button onClick={() => startEdit(detail)} style={actionBtnStyle}>Edit</button>
                )}
                <button onClick={() => { setDetail(null); setEditMode(false) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--ink3)' }}>×</button>
              </div>
            </div>

            {editMode ? (
              <>
                <DealForm form={form} setForm={setForm} />
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: '10px 0', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ flex: 2, padding: '10px 0', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .6 : 1 }}
                  >
                    {saving ? 'Saving…' : 'Update Deal'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: STAGE_META[detail.stage].bg, color: STAGE_META[detail.stage].color }}>
                    {STAGE_META[detail.stage].label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>${detail.value.toLocaleString()}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <DetailField label="Deal Type" value={detail.deal_type} />
                  <DetailField label="Platform"  value={detail.platform} />
                  <DetailField label="Contact"   value={detail.contact} />
                  <DetailField
                    label="Deadline"
                    value={detail.deadline ? (() => {
                      const d = daysUntil(detail.deadline)
                      return d ? `${detail.deadline}  (${d.label})` : detail.deadline
                    })() : null}
                  />
                </div>

                {detail.deliverables && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={detailLabelStyle}>Deliverables</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{detail.deliverables}</div>
                  </div>
                )}
                {detail.notes && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={detailLabelStyle}>Notes</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{detail.notes}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                  {NEXT_STAGE[detail.stage] && (
                    <button
                      onClick={() => advanceStage(detail)}
                      style={{ flex: 1, padding: '9px 0', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Move → {STAGE_META[NEXT_STAGE[detail.stage]!].label}
                    </button>
                  )}
                  {detail.stage !== 'closed_lost' && detail.stage !== 'closed_won' && (
                    <button
                      onClick={() => markLost(detail)}
                      style={{ padding: '9px 14px', background: 'transparent', border: '1px solid rgba(192,57,43,.3)', color: '#c0392b', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Mark Lost
                    </button>
                  )}
                  <button
                    onClick={() => deleteDeal(detail.id)}
                    style={{ padding: '9px 14px', background: 'transparent', border: '1px solid var(--b2)', color: 'var(--ink3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DealForm({ form, setForm }: {
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <label style={{ gridColumn: '1/-1' }}>
        <span style={labelStyle}>Brand / Company *</span>
        <input style={inputStyle} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Brand name" />
      </label>
      <label>
        <span style={labelStyle}>Contact Person</span>
        <input style={inputStyle} value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="@handle or email" />
      </label>
      <label>
        <span style={labelStyle}>Deal Type</span>
        <select style={inputStyle} value={form.deal_type} onChange={e => setForm(f => ({ ...f, deal_type: e.target.value as DealType }))}>
          {DEAL_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label>
        <span style={labelStyle}>Stage</span>
        <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))}>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
        </select>
      </label>
      <label>
        <span style={labelStyle}>Value (USD)</span>
        <input style={inputStyle} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0" />
      </label>
      <label>
        <span style={labelStyle}>Platform</span>
        <select style={inputStyle} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label>
        <span style={labelStyle}>Deadline</span>
        <input style={inputStyle} type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
      </label>
      <label style={{ gridColumn: '1/-1' }}>
        <span style={labelStyle}>Deliverables</span>
        <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} placeholder="3x Reels, 2x Stories, 1x YouTube integration…" />
      </label>
      <label style={{ gridColumn: '1/-1' }}>
        <span style={labelStyle}>Notes</span>
        <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Context, terms, next steps…" />
      </label>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <div style={detailLabelStyle}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{value}</div>
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
  borderRadius: 7, fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
}

const actionBtnStyle: React.CSSProperties = {
  padding: '6px 14px', background: 'var(--s2)', border: '1px solid var(--b1)',
  borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

const detailLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
  color: 'var(--ink3)', marginBottom: 4,
}
