'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProdStatus = 'draft' | 'filming' | 'editing' | 'scheduled' | 'posted'
type Platform = 'Reel' | 'YouTube Short' | 'TikTok' | 'Carousel' | 'Long-form' | 'Story'
type ContentType = 'Hook / Viral' | 'Educational' | 'Product Demo' | 'Brand Story' | 'Behind the Scenes' | 'Trending Audio'

interface CalendarItem {
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

interface FinalScript {
  id: string
  title: string
  hook: string | null
  content: string | null
  platform: Platform
  content_type: ContentType
  status: string
  client: string | null
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PROD_FLOW: ProdStatus[] = ['draft', 'filming', 'editing', 'scheduled', 'posted']
const ASSIGNEES = ['Shariq', 'Yash', 'Dev', 'Santhosh', 'AI Creator', 'Team']
const PLATFORMS: Platform[] = ['Reel', 'YouTube Short', 'TikTok', 'Carousel', 'Long-form', 'Story']
const CONTENT_TYPES: ContentType[] = ['Hook / Viral', 'Educational', 'Product Demo', 'Brand Story', 'Behind the Scenes', 'Trending Audio']
const PLATFORM_FILTERS: ('All' | Platform)[] = ['All', 'Reel', 'YouTube Short', 'TikTok']

const PROD_COLOR: Record<ProdStatus, { fg: string; bg: string; label: string }> = {
  draft:     { fg: '#888',    bg: 'rgba(136,136,136,.07)', label: 'Draft' },
  filming:   { fg: '#b86800', bg: 'rgba(184,104,0,.08)',   label: 'Filming' },
  editing:   { fg: '#1a70ad', bg: 'rgba(26,112,173,.08)',  label: 'Editing' },
  scheduled: { fg: '#7d3c98', bg: 'rgba(125,60,152,.08)',  label: 'Scheduled' },
  posted:    { fg: '#1e8a4a', bg: 'rgba(30,138,74,.08)',   label: 'Posted' },
}

const PLATFORM_BG: Record<Platform, string> = { 'Reel': 'rgba(191,139,46,.09)', 'YouTube Short': 'rgba(192,57,43,.08)', 'TikTok': 'rgba(30,30,30,.06)', 'Carousel': 'rgba(30,111,168,.07)', 'Long-form': 'rgba(30,138,74,.07)', 'Story': 'rgba(142,68,173,.07)' }
const PLATFORM_FG: Record<Platform, string> = { 'Reel': 'var(--gold)', 'YouTube Short': 'var(--red)', 'TikTok': 'var(--ink)', 'Carousel': 'var(--blue)', 'Long-form': 'var(--green)', 'Story': '#7d3c98' }

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

function todayKey(): string {
  const t = new Date()
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
}

interface AddForm {
  title: string
  platform: Platform
  content_type: ContentType
  assigned_to: string
  client: string
  notes: string
  date: string
  script_id: string | null
}

const EMPTY_FORM: AddForm = {
  title: '', platform: 'Reel', content_type: 'Hook / Viral', assigned_to: 'Shariq', client: '', notes: '', date: '', script_id: null,
}

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [scripts, setScripts] = useState<FinalScript[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<'All' | Platform>('All')
  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [form, setForm] = useState<AddForm>({ ...EMPTY_FORM })
  const [detail, setDetail] = useState<CalendarItem | null>(null)
  const [dragScript, setDragScript] = useState<FinalScript | null>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  const fetchAll = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    const [calRes, scrRes] = await Promise.all([
      supabase.from('content_calendar').select('*').order('date', { ascending: true }),
      supabase.from('scripts').select('*').eq('status', 'final').order('created_at', { ascending: false }),
    ])
    if (calRes.data) setItems(calRes.data as CalendarItem[])
    if (scrRes.data) setScripts(scrRes.data as FinalScript[])
    setLoading(false)
  }, [])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const tk = todayKey()

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    for (const it of items) {
      if (filter !== 'All' && it.platform !== filter) continue
      if (!map[it.date]) map[it.date] = []
      map[it.date].push(it)
    }
    return map
  }, [items, filter])

  const monthlyStats = useMemo(() => {
    const counts: Record<ProdStatus, number> = { draft: 0, filming: 0, editing: 0, scheduled: 0, posted: 0 }
    const mPrefix = `${year}-${pad2(month + 1)}-`
    for (const it of items) {
      if (it.date.startsWith(mPrefix)) counts[it.prod_status] += 1
    }
    return counts
  }, [items, year, month])

  const goPrev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) } else { setMonth(month - 1) }
  }
  const goNext = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) } else { setMonth(month + 1) }
  }

  const openAdd = (dKey: string, script?: FinalScript) => {
    setForm({
      ...EMPTY_FORM,
      date: dKey,
      title: script ? script.title : '',
      platform: script ? script.platform : 'Reel',
      content_type: script ? script.content_type : 'Hook / Viral',
      client: script?.client ?? '',
      script_id: script?.id ?? null,
    })
    setShowAdd(true)
  }

  const saveItem = async () => {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      script_id: form.script_id,
      date: form.date,
      platform: form.platform,
      content_type: form.content_type,
      assigned_to: form.assigned_to,
      client: form.client.trim() || null,
      notes: form.notes.trim() || null,
      prod_status: 'draft' as ProdStatus,
    }
    const { data, error } = await supabase.from('content_calendar').insert(payload).select().single()
    setSaving(false)
    if (!error && data) {
      setItems((prev) => [...prev, data as CalendarItem])
      setShowAdd(false)
    }
  }

  const scheduleScript = async (script: FinalScript, dKey: string) => {
    const supabase = createClient()
    const payload = {
      title: script.title,
      script_id: script.id,
      date: dKey,
      platform: script.platform,
      content_type: script.content_type,
      assigned_to: 'Shariq',
      client: script.client,
      notes: null,
      prod_status: 'draft' as ProdStatus,
    }
    const { data, error } = await supabase.from('content_calendar').insert(payload).select().single()
    if (!error && data) setItems((prev) => [...prev, data as CalendarItem])
  }

  const advanceStatus = async (it: CalendarItem) => {
    const idx = PROD_FLOW.indexOf(it.prod_status)
    if (idx < 0 || idx >= PROD_FLOW.length - 1) return
    const next = PROD_FLOW[idx + 1]
    const supabase = createClient()
    const { data, error } = await supabase.from('content_calendar').update({ prod_status: next }).eq('id', it.id).select().single()
    if (!error && data) {
      setItems((prev) => prev.map((p) => (p.id === it.id ? (data as CalendarItem) : p)))
      setDetail(data as CalendarItem)
    }
  }

  const removeItem = async (it: CalendarItem) => {
    const supabase = createClient()
    const { error } = await supabase.from('content_calendar').delete().eq('id', it.id)
    if (!error) {
      setItems((prev) => prev.filter((p) => p.id !== it.id))
      setDetail(null)
    }
  }

  const cells: ({ day: number; key: string } | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: dateKey(year, month, d) })

  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Content Production Calendar</strong>
        &nbsp;&middot;&nbsp; Click any day to add content
        &nbsp;&middot;&nbsp; Drag a Final Script from the right panel onto a day to schedule it
        &nbsp;&middot;&nbsp; Click any item to track production status (Draft &rarr; Filming &rarr; Editing &rarr; Scheduled &rarr; Posted)
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={goPrev}
                style={{ border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--ink)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12 }}
              >&larr; Prev</button>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--ink)', minWidth: 180, textAlign: 'center' }}>
                {MONTHS[month]} {year}
              </div>
              <button type="button" onClick={goNext}
                style={{ border: '0.5px solid var(--b2)', background: 'var(--s2)', color: 'var(--ink)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12 }}
              >Next &rarr;</button>
              <button type="button" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}
                style={{ border: '0.5px solid var(--b2)', background: 'transparent', color: 'var(--ink3)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11 }}
              >Today</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLATFORM_FILTERS.map((p) => (
                <button type="button" key={p} onClick={() => setFilter(p)}
                  style={{
                    border: '0.5px solid var(--b2)',
                    background: filter === p ? 'var(--ink)' : 'transparent',
                    color: filter === p ? 'var(--s1)' : 'var(--ink3)',
                    padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: 11,
                  }}
                >{p}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
            {DAY_HEADERS.map((d) => (
              <div key={d} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 6px' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {cells.map((c, i) => {
              if (!c) return <div key={`empty-${i}`} style={{ minHeight: 110 }} />
              const dayItems = itemsByDate[c.key] ?? []
              const isToday = c.key === tk
              const isDragOver = dragOverDay === c.key
              return (
                <div key={c.key}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).dataset.itemchip === '1') return
                    openAdd(c.key)
                  }}
                  onDragOver={(e) => { e.preventDefault(); if (dragOverDay !== c.key) setDragOverDay(c.key) }}
                  onDragLeave={() => { if (dragOverDay === c.key) setDragOverDay(null) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverDay(null)
                    if (dragScript) {
                      void scheduleScript(dragScript, c.key)
                      setDragScript(null)
                    }
                  }}
                  style={{
                    background: isToday ? 'rgba(184,104,0,.05)' : 'var(--s2)',
                    border: isDragOver ? '1.5px dashed var(--blue)' : isToday ? '0.5px solid var(--amber)' : '0.5px solid var(--b2)',
                    borderRadius: 8, minHeight: 110, padding: 6, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 11,
                    color: isToday ? 'var(--amber)' : 'var(--ink3)',
                    fontWeight: isToday ? 700 : 400,
                  }}>{c.day}</div>
                  {dayItems.map((it) => {
                    const c1 = PROD_COLOR[it.prod_status]
                    return (
                      <div key={it.id} data-itemchip="1"
                        onClick={(e) => { e.stopPropagation(); setDetail(it) }}
                        title={`${it.title} · ${c1.label}`}
                        style={{
                          background: c1.bg, color: c1.fg, fontSize: 10, fontFamily: 'var(--mono)',
                          padding: '3px 6px', borderRadius: 4, borderLeft: `2px solid ${c1.fg}`,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer',
                        }}
                      >{it.title}</div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {loading && (
            <div style={{ padding: 16, color: 'var(--ink4)', fontFamily: 'var(--mono)', fontSize: 12 }}>Loading calendar...</div>
          )}
        </div>

        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Final Scripts &middot; Drag to schedule</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
              {scripts.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', padding: 8, border: '0.5px dashed var(--b2)', borderRadius: 6 }}>
                  No final scripts yet. Promote scripts in the Scripts page.
                </div>
              )}
              {scripts.map((s) => (
                <div key={s.id} draggable
                  onDragStart={() => setDragScript(s)}
                  onDragEnd={() => setDragScript(null)}
                  style={{
                    background: 'var(--s2)', border: '0.5px solid var(--b2)', borderRadius: 6,
                    padding: 8, cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.3 }}>{s.title}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 3,
                      background: PLATFORM_BG[s.platform], color: PLATFORM_FG[s.platform],
                      border: `0.5px solid ${PLATFORM_FG[s.platform]}33`,
                    }}>{s.platform}</span>
                    {s.client && (
                      <span style={{
                        fontSize: 9, fontFamily: 'var(--mono)',
                        padding: '2px 6px', borderRadius: 3,
                        background: 'var(--s3)', color: 'var(--ink3)',
                        border: '0.5px solid var(--b2)',
                      }}>{s.client}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{MONTHS[month]} Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PROD_FLOW.map((s) => {
                const c1 = PROD_COLOR[s]
                return (
                  <div key={s} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: c1.bg, padding: '6px 10px', borderRadius: 6,
                    borderLeft: `2px solid ${c1.fg}`,
                  }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: c1.fg }}>{c1.label}</span>
                    <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: c1.fg, fontWeight: 600 }}>{monthlyStats[s]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <ModalShell onClose={() => setShowAdd(false)} title="Add to Calendar">
          <FormFields form={form} setForm={setForm} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={() => setShowAdd(false)}
              style={{ border: '0.5px solid var(--b2)', background: 'transparent', color: 'var(--ink3)', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12 }}
            >Cancel</button>
            <button type="button" onClick={() => void saveItem()} disabled={saving || !form.title.trim()}
              style={{ border: '0.5px solid var(--ink)', background: 'var(--ink)', color: 'var(--s1)', padding: '8px 14px', borderRadius: 6, cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 12, opacity: !form.title.trim() ? 0.5 : 1 }}
            >{saving ? 'Saving...' : 'Add'}</button>
          </div>
        </ModalShell>
      )}

      {detail && (
        <ModalShell onClose={() => setDetail(null)} title={detail.title}>
          <DetailView item={detail}
            onAdvance={() => void advanceStatus(detail)}
            onRemove={() => void removeItem(detail)}
          />
        </ModalShell>
      )}
    </>
  )
}

interface ModalShellProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--s1)', border: '0.5px solid var(--b2)',
          borderRadius: 12, padding: 22, width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{title}</h2>
          <button type="button" onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: 'var(--ink4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
          >&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface FormFieldsProps {
  form: AddForm
  setForm: (f: AddForm) => void
}

function FormFields({ form, setForm }: FormFieldsProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--s2)', border: '0.5px solid var(--b2)',
    borderRadius: 6, padding: '8px 10px', color: 'var(--ink)',
    fontFamily: 'var(--mono)', fontSize: 12, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
    color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Date</label>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Title *</label>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="e.g. Lyra teaser reel" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Platform</label>
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })} style={inputStyle}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Content Type</label>
          <select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value as ContentType })} style={inputStyle}>
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Assigned To</label>
        <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} style={inputStyle}>
          {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Client (optional)</label>
        <input type="text" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} style={inputStyle} placeholder="e.g. Syntx.ai" />
      </div>
      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
    </div>
  )
}

interface DetailViewProps {
  item: CalendarItem
  onAdvance: () => void
  onRemove: () => void
}

function DetailView({ item, onAdvance, onRemove }: DetailViewProps) {
  const idx = PROD_FLOW.indexOf(item.prod_status)
  const isLast = idx === PROD_FLOW.length - 1
  const next = !isLast ? PROD_FLOW[idx + 1] : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, fontFamily: 'var(--mono)' }}>
        <div><span style={{ color: 'var(--ink4)' }}>Date:</span> <span style={{ color: 'var(--ink)' }}>{item.date}</span></div>
        <div><span style={{ color: 'var(--ink4)' }}>Assigned:</span> <span style={{ color: 'var(--ink)' }}>{item.assigned_to ?? '—'}</span></div>
        <div><span style={{ color: 'var(--ink4)' }}>Platform:</span> <span style={{ color: 'var(--ink)' }}>{item.platform}</span></div>
        <div><span style={{ color: 'var(--ink4)' }}>Client:</span> <span style={{ color: 'var(--ink)' }}>{item.client ?? '—'}</span></div>
      </div>

      <div>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Production Pipeline</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {PROD_FLOW.map((s, i) => {
            const c = PROD_COLOR[s]
            const active = s === item.prod_status
            const done = i < idx
            return (
              <div key={s} style={{
                background: active ? c.fg : done ? c.bg : 'var(--s2)',
                color: active ? 'var(--s1)' : done ? c.fg : 'var(--ink4)',
                border: `0.5px solid ${active ? c.fg : 'var(--b2)'}`,
                borderRadius: 4, padding: '6px 4px',
                textAlign: 'center', fontSize: 10, fontFamily: 'var(--mono)',
                fontWeight: active ? 600 : 400,
              }}>{c.label}</div>
            )
          })}
        </div>
      </div>

      {item.notes && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Notes</div>
          <div style={{ background: 'var(--s2)', border: '0.5px solid var(--b2)', borderRadius: 6, padding: 10, fontSize: 12, color: 'var(--ink2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{item.notes}</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
        <button type="button" onClick={onRemove}
          style={{ border: '0.5px solid var(--red)', background: 'transparent', color: 'var(--red)', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12 }}
        >Remove</button>
        {next && (
          <button type="button" onClick={onAdvance}
            style={{ border: `0.5px solid ${PROD_COLOR[next].fg}`, background: PROD_COLOR[next].fg, color: 'var(--s1)', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12 }}
          >Mark &rarr; {PROD_COLOR[next].label}</button>
        )}
      </div>
    </div>
  )
}
