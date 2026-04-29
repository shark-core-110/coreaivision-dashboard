'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProdStatus = 'draft' | 'filming' | 'editing' | 'scheduled' | 'posted'
type Platform = 'Reel' | 'YouTube Short' | 'TikTok' | 'Carousel' | 'Long-form' | 'Story'
type ContentType = 'Hook / Viral' | 'Educational' | 'Product Demo' | 'Brand Story' | 'Behind the Scenes' | 'Trending Audio'

interface PipelineItem {
  id: string
  title: string
  script_id: string | null
  date: string
  platform: Platform
  content_type: ContentType
  assigned_to: string | null
  prod_status: ProdStatus
  client: string | null
  notes: string | null
  created_at: string
}

interface AddForm {
  title: string
  platform: Platform
  content_type: ContentType
  assigned_to: string
  client: string
  notes: string
  date: string
}

const STAGES: { key: ProdStatus; label: string; color: string; bg: string; border: string }[] = [
  { key: 'draft',     label: 'Draft',     color: '#8A857C', bg: 'rgba(138,133,124,.07)', border: 'rgba(138,133,124,.2)'  },
  { key: 'filming',   label: 'Filming',   color: '#B86800', bg: 'rgba(184,104,0,.07)',   border: 'rgba(184,104,0,.22)'  },
  { key: 'editing',   label: 'Editing',   color: '#1E6FA8', bg: 'rgba(30,111,168,.07)',  border: 'rgba(30,111,168,.22)' },
  { key: 'scheduled', label: 'Scheduled', color: '#7D3C98', bg: 'rgba(125,60,152,.07)',  border: 'rgba(125,60,152,.22)' },
  { key: 'posted',    label: 'Posted',    color: '#1E8A4A', bg: 'rgba(30,138,74,.07)',   border: 'rgba(30,138,74,.22)'  },
]

const PLATFORMS: Platform[]     = ['Reel', 'YouTube Short', 'TikTok', 'Carousel', 'Long-form', 'Story']
const CONTENT_TYPES: ContentType[] = ['Hook / Viral', 'Educational', 'Product Demo', 'Brand Story', 'Behind the Scenes', 'Trending Audio']
const ASSIGNEES                 = ['Shark', 'Yash', 'Pushkar', 'Krishanu', 'Akib', 'Padmanav', 'Niraj', 'Sanjukta', 'Joyeeta', 'Smit', 'Team']

const PLATFORM_COLOR: Record<Platform, string> = {
  'Reel':          '#BF8B2E',
  'YouTube Short': '#C0392B',
  'TikTok':        '#524E48',
  'Carousel':      '#1E6FA8',
  'Long-form':     '#1E8A4A',
  'Story':         '#7D3C98',
}

const EMPTY_FORM: AddForm = {
  title: '', platform: 'Reel', content_type: 'Hook / Viral',
  assigned_to: 'Shark', client: '', notes: '', date: '',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500,
  letterSpacing: '.1em', textTransform: 'uppercase',
  color: 'var(--ink3)', display: 'block', marginBottom: 5,
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export default function PipelinePage() {
  const [items, setItems]             = useState<PipelineItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [dragging, setDragging]       = useState<PipelineItem | null>(null)
  const [dragOver, setDragOver]       = useState<ProdStatus | null>(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [addStage, setAddStage]       = useState<ProdStatus>('draft')
  const [form, setForm]               = useState<AddForm>({ ...EMPTY_FORM })
  const [saving, setSaving]           = useState(false)
  const [detail, setDetail]           = useState<PipelineItem | null>(null)
  const [editingNote, setEditingNote] = useState('')

  const loadItems = useCallback(async () => {
    const sb = createClient()
    setLoading(true)
    const { data } = await sb
      .from('content_calendar')
      .select('*')
      .order('date', { ascending: true })
    setItems((data as PipelineItem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const byStage = (stage: ProdStatus) => items.filter(i => i.prod_status === stage)

  function onDragStart(item: PipelineItem) { setDragging(item) }
  function onDragOver(e: React.DragEvent, stage: ProdStatus) { e.preventDefault(); setDragOver(stage) }
  function onDragLeave() { setDragOver(null) }

  async function onDrop(e: React.DragEvent, stage: ProdStatus) {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.prod_status === stage) { setDragging(null); return }
    const sb = createClient()
    setItems(prev => prev.map(i => i.id === dragging.id ? { ...i, prod_status: stage } : i))
    await sb.from('content_calendar').update({ prod_status: stage }).eq('id', dragging.id)
    setDragging(null)
  }

  async function moveItem(item: PipelineItem, dir: 1 | -1) {
    const idx  = STAGES.findIndex(s => s.key === item.prod_status)
    const next = STAGES[idx + dir]?.key
    if (!next) return
    const sb = createClient()
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, prod_status: next } : i))
    if (detail?.id === item.id) setDetail(prev => prev ? { ...prev, prod_status: next } : null)
    await sb.from('content_calendar').update({ prod_status: next }).eq('id', item.id)
  }

  async function setStage(item: PipelineItem, stage: ProdStatus) {
    const sb = createClient()
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, prod_status: stage } : i))
    setDetail(prev => prev ? { ...prev, prod_status: stage } : null)
    await sb.from('content_calendar').update({ prod_status: stage }).eq('id', item.id)
  }

  function openAdd(stage: ProdStatus) {
    setAddStage(stage)
    setForm({ ...EMPTY_FORM, date: todayStr() })
    setShowAdd(true)
  }

  async function saveAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    const sb = createClient()
    const { data, error } = await sb
      .from('content_calendar')
      .insert({
        title:        form.title.trim(),
        platform:     form.platform,
        content_type: form.content_type,
        assigned_to:  form.assigned_to || null,
        client:       form.client.trim() || null,
        notes:        form.notes.trim() || null,
        date:         form.date || todayStr(),
        prod_status:  addStage,
        script_id:    null,
      })
      .select()
      .single()
    if (!error && data) setItems(prev => [...prev, data as PipelineItem])
    setSaving(false)
    setShowAdd(false)
    setForm({ ...EMPTY_FORM })
  }

  async function saveNote() {
    if (!detail) return
    const sb = createClient()
    setItems(prev => prev.map(i => i.id === detail.id ? { ...i, notes: editingNote } : i))
    setDetail(prev => prev ? { ...prev, notes: editingNote } : null)
    await sb.from('content_calendar').update({ notes: editingNote }).eq('id', detail.id)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item from the pipeline?')) return
    const sb = createClient()
    setItems(prev => prev.filter(i => i.id !== id))
    setDetail(null)
    await sb.from('content_calendar').delete().eq('id', id)
  }

  const totalPosted = items.filter(i => i.prod_status === 'posted').length
  const totalActive = items.filter(i => i.prod_status !== 'posted' && i.prod_status !== 'draft').length

  return (
    <div>
      <div className="guide-bar">
        <strong>Production Pipeline</strong> · Drag cards between columns to move status · Click a card to open its detail panel · <strong>→ ←</strong> arrows step one stage · <strong>+</strong> adds directly to any stage
      </div>

      {/* summary strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {STAGES.map(s => {
          const count = byStage(s.key).length
          return (
            <div key={s.key} style={{ background: s.bg, border: `0.5px solid ${s.border}`, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: s.color, fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: s.color, letterSpacing: '-.02em', lineHeight: 1 }}>{count}</span>
            </div>
          )
        })}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', letterSpacing: '.06em' }}>
          {totalPosted} posted · {totalActive} active
        </span>
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3)', padding: '48px 0' }}>Loading pipeline…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, alignItems: 'start' }}>
          {STAGES.map(stage => {
            const cards = byStage(stage.key)
            const isOver = dragOver === stage.key
            return (
              <div
                key={stage.key}
                onDragOver={e => onDragOver(e, stage.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, stage.key)}
                style={{
                  background: isOver ? stage.bg : 'var(--s2)',
                  border: `0.5px solid ${isOver ? stage.border : 'var(--b1)'}`,
                  minHeight: 420,
                  transition: 'background .15s, border-color .15s',
                }}
              >
                {/* column header */}
                <div style={{ padding: '12px 12px 10px', borderBottom: `1.5px solid ${stage.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: stage.color }}>{stage.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: stage.color, background: stage.bg, border: `0.5px solid ${stage.border}`, padding: '1px 6px' }}>{cards.length}</span>
                  </div>
                  <button
                    onClick={() => openAdd(stage.key)}
                    title={`Add to ${stage.label}`}
                    style={{ width: 22, height: 22, background: stage.bg, border: `0.5px solid ${stage.border}`, color: stage.color, fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >+</button>
                </div>

                {/* cards */}
                <div style={{ padding: '8px 8px 4px' }}>
                  {cards.length === 0 && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', textAlign: 'center', padding: '28px 0', letterSpacing: '.06em', border: `1px dashed ${stage.border}`, margin: '4px 0' }}>
                      Drop here
                    </div>
                  )}
                  {cards.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => onDragStart(item)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => { setDetail(item); setEditingNote(item.notes ?? '') }}
                      style={{ background: 'var(--s1)', border: '0.5px solid var(--b1)', padding: '10px 11px', marginBottom: 6, cursor: 'grab', userSelect: 'none', opacity: dragging?.id === item.id ? 0.35 : 1, transition: 'opacity .12s, box-shadow .15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
                    >
                      {/* platform + client */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase', color: PLATFORM_COLOR[item.platform], background: 'var(--s2)', border: '0.5px solid var(--b2)', padding: '2px 5px' }}>{item.platform}</span>
                        {item.client && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--gold)', letterSpacing: '.03em' }}>{item.client}</span>}
                      </div>

                      {/* title */}
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 8 }}>{item.title}</div>

                      {/* bottom: avatar + date + step buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.assigned_to && (
                            <span title={item.assigned_to} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--s3)', border: '0.5px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 500, color: 'var(--ink2)', flexShrink: 0 }}>
                              {item.assigned_to.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          {item.date && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)' }}>{item.date.slice(5)}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 3 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => moveItem(item, -1)} disabled={item.prod_status === 'draft'} title="Move back"
                            style={{ width: 20, height: 20, background: 'var(--s3)', border: '0.5px solid var(--b2)', color: 'var(--ink3)', fontFamily: 'var(--mono)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: item.prod_status === 'draft' ? 'not-allowed' : 'pointer', opacity: item.prod_status === 'draft' ? .25 : 1 }}>←</button>
                          <button onClick={() => moveItem(item, 1)} disabled={item.prod_status === 'posted'} title="Advance"
                            style={{ width: 20, height: 20, background: stage.bg, border: `0.5px solid ${stage.border}`, color: stage.color, fontFamily: 'var(--mono)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: item.prod_status === 'posted' ? 'not-allowed' : 'pointer', opacity: item.prod_status === 'posted' ? .25 : 1 }}>→</button>
                        </div>
                      </div>

                      {/* notes preview */}
                      {item.notes && (
                        <div style={{ marginTop: 7, paddingTop: 6, borderTop: '0.5px solid var(--b1)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--s1)', border: '0.5px solid var(--b1)', padding: 28, width: 420, position: 'relative', boxShadow: '0 20px 56px rgba(0,0,0,0.18)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: STAGES.find(s => s.key === addStage)?.color }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: STAGES.find(s => s.key === addStage)?.color, marginBottom: 18, fontWeight: 500 }}>
              Add to {STAGES.find(s => s.key === addStage)?.label}
            </div>

            <label style={labelStyle}>Title</label>
            <input type="text" value={form.title} autoFocus onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && saveAdd()} style={{ width: '100%', marginBottom: 12 }} placeholder="Content title…" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Platform</label>
                <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))} style={{ width: '100%' }}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assigned To</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ width: '100%' }}>
                  {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Content Type</label>
                <select value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value as ContentType }))} style={{ width: '100%' }}>
                  {CONTENT_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Client</label>
              <input type="text" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} style={{ width: '100%' }} placeholder="Optional" />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', resize: 'vertical' }} placeholder="Optional" />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveAdd} disabled={!form.title.trim() || saving} style={{ flex: 1, padding: '11px 0', background: STAGES.find(s => s.key === addStage)?.color, color: '#FAF8F4', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.title.trim() ? .5 : 1 }}>
                {saving ? 'Saving…' : 'Add'}
              </button>
              <button onClick={() => setShowAdd(false)} style={{ padding: '11px 20px', background: 'var(--s2)', border: '0.5px solid var(--b2)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, color: 'var(--ink3)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL SIDE PANEL ── */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 360, background: 'var(--s1)', borderLeft: '0.5px solid var(--b1)', height: '100vh', overflowY: 'auto', padding: 28, boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>
            {(() => {
              const s = STAGES.find(st => st.key === detail.prod_status)!
              return <div style={{ background: s.bg, border: `0.5px solid ${s.border}`, padding: '5px 12px', marginBottom: 18, display: 'inline-block' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: s.color }}>{s.label}</span></div>
            })()}

            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.45, marginBottom: 22 }}>{detail.title}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
              {([['Platform', detail.platform], ['Type', detail.content_type], ['Assigned', detail.assigned_to ?? '—'], ['Client', detail.client ?? '—'], ['Date', detail.date ?? '—'], ['Added', detail.created_at?.slice(0, 10) ?? '—']] as [string, string][]).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* pipeline progress — click segment to jump */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 8 }}>Pipeline Stage</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {STAGES.map((s, idx) => {
                  const currentIdx = STAGES.findIndex(st => st.key === detail.prod_status)
                  return <div key={s.key} onClick={() => setStage(detail, s.key)} title={`Set to ${s.label}`} style={{ flex: 1, height: 7, background: idx <= currentIdx ? s.color : 'var(--b2)', cursor: 'pointer', transition: 'background .15s' }} />
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                {STAGES.map(s => (
                  <span key={s.key} style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.04em', color: detail.prod_status === s.key ? s.color : 'var(--ink4)', fontWeight: detail.prod_status === s.key ? 600 : 400 }}>
                    {s.label.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* notes */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 8 }}>Notes</div>
              <textarea value={editingNote} onChange={e => setEditingNote(e.target.value)} rows={4} style={{ width: '100%', resize: 'vertical' }} placeholder="Add notes…" />
              <button onClick={saveNote} style={{ marginTop: 6, padding: '7px 16px', background: 'var(--gold-glow)', border: '0.5px solid var(--gold-line)', color: 'var(--gold)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Save Note</button>
            </div>

            {/* move */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
              <button onClick={() => moveItem(detail, -1)} disabled={detail.prod_status === 'draft'} style={{ flex: 1, padding: '10px 0', background: 'var(--s2)', border: '0.5px solid var(--b2)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.06em', color: detail.prod_status === 'draft' ? 'var(--ink4)' : 'var(--ink2)', cursor: detail.prod_status === 'draft' ? 'not-allowed' : 'pointer', opacity: detail.prod_status === 'draft' ? .35 : 1 }}>← Move Back</button>
              <button onClick={() => moveItem(detail, 1)} disabled={detail.prod_status === 'posted'} style={{ flex: 1, padding: '10px 0', background: 'var(--gold-glow)', border: '0.5px solid var(--gold-line)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.06em', color: detail.prod_status === 'posted' ? 'var(--ink4)' : 'var(--gold)', cursor: detail.prod_status === 'posted' ? 'not-allowed' : 'pointer', opacity: detail.prod_status === 'posted' ? .35 : 1 }}>Advance →</button>
            </div>

            <div style={{ height: '0.5px', background: 'var(--b1)', marginBottom: 18 }} />

            <button onClick={() => deleteItem(detail.id)} style={{ width: '100%', padding: '10px 0', background: 'rgba(192,57,43,.05)', border: '0.5px solid rgba(192,57,43,.22)', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--red)', cursor: 'pointer' }}>
              Delete Item
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
