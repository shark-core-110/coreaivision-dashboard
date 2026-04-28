'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type ScriptStatus = 'idea' | 'shortlisted' | 'final'
type Platform     = 'Reel' | 'YouTube Short' | 'TikTok' | 'Carousel' | 'Long-form' | 'Story'
type ContentType  = 'Hook / Viral' | 'Educational' | 'Product Demo' | 'Brand Story' | 'Behind the Scenes' | 'Trending Audio'

interface Script {
  id: string
  title: string
  hook: string | null
  content: string | null
  platform: Platform
  content_type: ContentType
  status: ScriptStatus
  client: string | null
  submitted_by: string
  reviewed_by: string | null
  created_at: string
}

const COLUMNS: { key: ScriptStatus; label: string; sub: string; accent: string; pillBg: string; pillBorder: string }[] = [
  { key: 'idea',        label: 'Ideation',      sub: 'Raw ideas & concepts',       accent: 'var(--ink3)',  pillBg: 'var(--s3)',                   pillBorder: 'var(--b2)' },
  { key: 'shortlisted', label: 'Shortlisted',   sub: 'Approved for development',   accent: 'var(--amber)', pillBg: 'rgba(184,104,0,.07)',          pillBorder: 'rgba(184,104,0,.25)' },
  { key: 'final',       label: 'Final Scripts', sub: 'Ready to record & post',     accent: 'var(--green)', pillBg: 'rgba(30,138,74,.06)',          pillBorder: 'rgba(30,138,74,.25)' },
]

const NEXT: Record<ScriptStatus, ScriptStatus | null> = { idea: 'shortlisted', shortlisted: 'final', final: null }
const PREV: Record<ScriptStatus, ScriptStatus | null> = { idea: null, shortlisted: 'idea', final: 'shortlisted' }

const PLATFORMS: Platform[]     = ['Reel', 'YouTube Short', 'TikTok', 'Carousel', 'Long-form', 'Story']
const CONTENT_TYPES: ContentType[] = ['Hook / Viral', 'Educational', 'Product Demo', 'Brand Story', 'Behind the Scenes', 'Trending Audio']

const PLATFORM_BG: Record<Platform, string>   = { 'Reel': 'rgba(191,139,46,.09)', 'YouTube Short': 'rgba(192,57,43,.08)', 'TikTok': 'rgba(30,30,30,.06)', 'Carousel': 'rgba(30,111,168,.07)', 'Long-form': 'rgba(30,138,74,.07)', 'Story': 'rgba(142,68,173,.07)' }
const PLATFORM_FG: Record<Platform, string>   = { 'Reel': 'var(--gold)', 'YouTube Short': 'var(--red)', 'TikTok': 'var(--ink)', 'Carousel': 'var(--blue)', 'Long-form': 'var(--green)', 'Story': '#7d3c98' }

function timeAgo(ts: string): string {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

const EMPTY: { title: string; hook: string; content: string; platform: Platform; content_type: ContentType; client: string; submitted_by: string } = {
  title: '', hook: '', content: '', platform: 'Reel', content_type: 'Hook / Viral', client: '', submitted_by: 'Shariq',
}

export default function ScriptsPage() {
  const [scripts, setScripts]   = useState<Script[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [detail, setDetail]     = useState<Script | null>(null)
  const [form, setForm]         = useState({ ...EMPTY })
  const [saving, setSaving]     = useState(false)
  const [editMode, setEditMode] = useState(false)

  const fetchScripts = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('scripts').select('*').order('created_at', { ascending: false })
    setScripts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchScripts() }, [fetchScripts])

  const addScript = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('scripts').insert({
      title: form.title.trim(), hook: form.hook.trim() || null, content: form.content.trim() || null,
      platform: form.platform, content_type: form.content_type,
      client: form.client.trim() || null, submitted_by: form.submitted_by.trim() || 'Team', status: 'idea',
    })
    setForm({ ...EMPTY })
    setShowAdd(false)
    setSaving(false)
    fetchScripts()
  }

  const moveScript = async (id: string, dir: 'forward' | 'back') => {
    const s = scripts.find(x => x.id === id)
    if (!s) return
    const next = dir === 'forward' ? NEXT[s.status] : PREV[s.status]
    if (!next) return
    setScripts(prev => prev.map(x => x.id === id ? { ...x, status: next } : x))
    if (detail?.id === id) setDetail(d => d ? { ...d, status: next } : d)
    const supabase = createClient()
    await supabase.from('scripts').update({ status: next }).eq('id', id)
    await supabase.from('activity_log').insert({ entity_type: 'script', entity_id: id, action: 'status_change', description: `"${s.title}" moved to ${next}`, changed_by: 'User', changed_by_type: 'human' })
  }

  const deleteScript = async (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id))
    setDetail(null)
    const supabase = createClient()
    await supabase.from('scripts').delete().eq('id', id)
  }

  const saveEdit = async () => {
    if (!detail) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('scripts').update({ title: form.title.trim(), hook: form.hook.trim() || null, content: form.content.trim() || null, platform: form.platform, content_type: form.content_type, client: form.client.trim() || null }).eq('id', detail.id)
    setSaving(false)
    setEditMode(false)
    setDetail(null)
    fetchScripts()
  }

  const openDetail = (s: Script) => {
    setDetail(s)
    setForm({ title: s.title, hook: s.hook ?? '', content: s.content ?? '', platform: s.platform, content_type: s.content_type, client: s.client ?? '', submitted_by: s.submitted_by })
    setEditMode(false)
  }

  const byStatus = (st: ScriptStatus) => scripts.filter(s => s.status === st)

  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Script Pipeline</strong>
        &nbsp;&middot;&nbsp; Add ideas in Ideation
        &nbsp;&middot;&nbsp; Move to Shortlisted when worth developing
        &nbsp;&middot;&nbsp; Final scripts are ready to film and will appear in the Content Calendar
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>
          {scripts.length} total &nbsp;·&nbsp; {byStatus('idea').length} ideas &nbsp;·&nbsp; {byStatus('shortlisted').length} shortlisted &nbsp;·&nbsp; {byStatus('final').length} final
        </div>
        <button className="top-btn" onClick={() => { setShowAdd(true); setForm({ ...EMPTY }) }}>
          <span style={{ fontSize: 14 }}>+</span> New Script Idea
        </button>
      </div>

      {loading ? (
        <div className="metric-label" style={{ padding: '60px 0', textAlign: 'center' }}>Loading scripts…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const items = byStatus(col.key)
            return (
              <div key={col.key}>
                {/* Column header */}
                <div style={{ padding: '11px 14px', background: col.pillBg, border: `0.5px solid ${col.pillBorder}`, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: col.accent, fontWeight: 500 }}>{col.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink4)', marginTop: 2, letterSpacing: '.04em' }}>{col.sub}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '1px 9px', background: col.pillBg, border: `0.5px solid ${col.pillBorder}`, color: col.accent }}>{items.length}</span>
                </div>

                {/* Card list */}
                <div style={{ border: `0.5px solid ${col.pillBorder}`, borderTop: `1.5px solid ${col.accent}`, minHeight: 100, maxHeight: 'calc(100vh - 290px)', overflowY: 'auto' }}>
                  {items.length === 0 ? (
                    <div style={{ padding: '28px 14px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      {col.key === 'idea' ? 'Add the first idea below' : 'Nothing here yet'}
                    </div>
                  ) : items.map((s, i) => (
                    <ScriptCard key={s.id} script={s} isLast={i === items.length - 1} colAccent={col.accent}
                      onOpen={() => openDetail(s)}
                      onForward={() => moveScript(s.id, 'forward')}
                      onBack={() => moveScript(s.id, 'back')}
                    />
                  ))}
                </div>

                {col.key === 'idea' && (
                  <button onClick={() => { setShowAdd(true); setForm({ ...EMPTY }) }} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)', background: 'none', border: `0.5px solid ${col.pillBorder}`, borderTop: 'none', padding: '9px 14px', cursor: 'pointer', textAlign: 'left', transition: 'color .15s' }}>
                    + Add idea
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="New Script Idea" onClose={() => setShowAdd(false)}>
          <FormGrid>
            <FormField label="Title *" span={2}><input className="login-input" style={{ margin: 0 }} placeholder="e.g. 5 AI tools that replaced my entire team" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></FormField>
            <FormField label="Hook — opening line" span={2}><input className="login-input" style={{ margin: 0 }} placeholder="The single sentence that hooks the viewer" value={form.hook} onChange={e => setForm(f => ({ ...f, hook: e.target.value }))} /></FormField>
            <FormField label="Platform"><select className="login-input" style={{ margin: 0 }} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></FormField>
            <FormField label="Content Type"><select className="login-input" style={{ margin: 0 }} value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value as ContentType }))}>{CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></FormField>
            <FormField label="Client (optional)"><input className="login-input" style={{ margin: 0 }} placeholder="e.g. Syntx.ai" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} /></FormField>
            <FormField label="Submitted by"><input className="login-input" style={{ margin: 0 }} value={form.submitted_by} onChange={e => setForm(f => ({ ...f, submitted_by: e.target.value }))} /></FormField>
            <FormField label="Full Script (optional)" span={2}><textarea className="fc-textarea" style={{ minHeight: 110, margin: 0 }} placeholder="Paste or write the full script…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16 }}>
            <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="top-btn" onClick={addScript} disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : 'Add to Ideation'}</button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={editMode ? 'Edit Script' : detail.title} onClose={() => { setDetail(null); setEditMode(false) }} wide>
          {editMode ? (
            <>
              <FormGrid>
                <FormField label="Title" span={2}><input className="login-input" style={{ margin: 0 }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></FormField>
                <FormField label="Hook" span={2}><input className="login-input" style={{ margin: 0 }} value={form.hook} onChange={e => setForm(f => ({ ...f, hook: e.target.value }))} /></FormField>
                <FormField label="Platform"><select className="login-input" style={{ margin: 0 }} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></FormField>
                <FormField label="Content Type"><select className="login-input" style={{ margin: 0 }} value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value as ContentType }))}>{CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></FormField>
                <FormField label="Client" span={2}><input className="login-input" style={{ margin: 0 }} value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} /></FormField>
                <FormField label="Full Script" span={2}><textarea className="fc-textarea" style={{ minHeight: 180, margin: 0 }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></FormField>
              </FormGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16 }}>
                <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => setEditMode(false)}>Cancel</button>
                <button className="top-btn" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 10px', background: PLATFORM_BG[detail.platform], color: PLATFORM_FG[detail.platform], border: '0.5px solid currentColor' }}>{detail.platform}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 10px', background: 'rgba(30,111,168,.07)', color: 'var(--blue)', border: '0.5px solid rgba(30,111,168,.2)' }}>{detail.content_type}</span>
                {detail.client && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 10px', background: 'rgba(184,104,0,.07)', color: 'var(--amber)', border: '0.5px solid rgba(184,104,0,.2)' }}>{detail.client}</span>}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)' }}>by {detail.submitted_by} · {timeAgo(detail.created_at)}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                {COLUMNS.map(c => (
                  <span key={c.key} style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', padding: '3px 10px', border: '0.5px solid', background: detail.status === c.key ? c.pillBg : 'transparent', borderColor: detail.status === c.key ? c.pillBorder : 'var(--b1)', color: detail.status === c.key ? c.accent : 'var(--ink4)', fontWeight: detail.status === c.key ? 500 : 300 }}>{c.label}</span>
                ))}
              </div>

              {detail.hook && (
                <div style={{ borderLeft: '2px solid var(--gold)', paddingLeft: 14, marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--gold2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>Hook</div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.65 }}>{detail.hook}</div>
                </div>
              )}

              {detail.content ? (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Full Script</div>
                  <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--s2)', padding: '16px 18px', border: '0.5px solid var(--b1)', maxHeight: 340, overflowY: 'auto' }}>{detail.content}</div>
                </div>
              ) : (
                <div style={{ padding: '18px', marginBottom: 18, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.08em', border: '0.5px dashed var(--b2)' }}>No script yet — click Edit to add it</div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', paddingTop: 14, borderTop: '0.5px solid var(--b1)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PREV[detail.status] && <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => moveScript(detail.id, 'back')}>← Move back</button>}
                  {NEXT[detail.status] && <button className="top-btn" onClick={() => moveScript(detail.id, 'forward')}>Move to {NEXT[detail.status] === 'shortlisted' ? 'Shortlisted' : 'Final'} →</button>}
                  {detail.status === 'final' && <button className="top-btn" style={{ background: 'rgba(30,138,74,.08)', borderColor: 'rgba(30,138,74,.3)', color: 'var(--green)' }}>✓ Ready to post</button>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => setEditMode(true)}>Edit</button>
                  <button className="top-btn" style={{ borderColor: 'rgba(192,57,43,.3)', color: 'var(--red)', background: 'rgba(192,57,43,.05)' }} onClick={() => deleteScript(detail.id)}>Delete</button>
                </div>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

function ScriptCard({ script, isLast, colAccent, onOpen, onForward, onBack }: {
  script: Script; isLast: boolean; colAccent: string
  onOpen: () => void; onForward: () => void; onBack: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onOpen}
      style={{ padding: '13px 14px', background: hovered ? 'var(--s2)' : 'var(--s1)', borderBottom: isLast ? 'none' : '0.5px solid var(--b1)', cursor: 'pointer', transition: 'background .15s' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 7px', background: PLATFORM_BG[script.platform], color: PLATFORM_FG[script.platform], border: '0.5px solid currentColor' }}>{script.platform}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 7px', background: 'rgba(30,111,168,.06)', color: 'var(--blue)', border: '0.5px solid rgba(30,111,168,.18)' }}>{script.content_type}</span>
        {script.client && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 7px', background: 'rgba(184,104,0,.06)', color: 'var(--amber)', border: '0.5px solid rgba(184,104,0,.18)' }}>{script.client}</span>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.4, marginBottom: script.hook ? 6 : 0 }}>{script.title}</div>
      {script.hook && <div style={{ fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>"{script.hook}"</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink4)' }}>{script.submitted_by} · {timeAgo(script.created_at)}</span>
        {hovered && (
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            {PREV[script.status] && <button onClick={onBack} style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '3px 8px', background: 'none', border: '0.5px solid var(--b2)', color: 'var(--ink3)', cursor: 'pointer' }}>←</button>}
            {NEXT[script.status] && <button onClick={onForward} style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '3px 8px', background: 'none', border: `0.5px solid ${colAccent}`, color: colAccent, cursor: 'pointer' }}>→</button>}
          </div>
        )}
      </div>
    </div>
  )
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--s1)', border: '0.5px solid var(--b2)', width: '100%', maxWidth: wide ? 680 : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '0.5px solid var(--b1)', position: 'sticky', top: 0, background: 'var(--s1)', zIndex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-.01em', lineHeight: 1.3 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function FormField({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? `span ${span}` : undefined }}>
      <label className="login-label" style={{ margin: 0 }}>{label}</label>
      {children}
    </div>
  )
}
