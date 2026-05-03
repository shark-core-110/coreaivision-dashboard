'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/contexts/NotificationContext'
import { playSound } from '@/lib/sound'

type ScriptStatus = 'idea' | 'shortlisted' | 'final'
type Platform     = 'Reel' | 'YouTube Short' | 'TikTok' | 'Carousel' | 'Long-form' | 'Story'
type ContentType  = 'Hook / Viral' | 'Educational' | 'Product Demo' | 'Brand Story' | 'Behind the Scenes' | 'Trending Audio'

interface ParsedScript {
  title:        string
  hook:         string
  content:      string
  platform:     Platform
  content_type: ContentType
  client:       string | null
}

interface DocAttachment {
  label: string
  url: string
}

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
  { key: 'idea',        label: 'Ideation',   sub: 'Raw ideas & concepts',                 accent: 'var(--ink3)',  pillBg: 'var(--s3)',           pillBorder: 'var(--b2)' },
  { key: 'shortlisted', label: 'Shortlisted',sub: 'Approved for development',             accent: 'var(--amber)', pillBg: 'rgba(184,104,0,.07)', pillBorder: 'rgba(184,104,0,.25)' },
  { key: 'final',       label: 'Approved',   sub: 'Shark-approved, ready for pipeline',   accent: 'var(--green)', pillBg: 'rgba(30,138,74,.06)', pillBorder: 'rgba(30,138,74,.25)' },
]

const NEXT: Record<ScriptStatus, ScriptStatus | null> = { idea: 'shortlisted', shortlisted: 'final', final: null }
const PREV: Record<ScriptStatus, ScriptStatus | null> = { idea: null, shortlisted: 'idea', final: 'shortlisted' }

const PLATFORMS: Platform[]     = ['Reel', 'YouTube Short', 'TikTok', 'Carousel', 'Long-form', 'Story']
const CONTENT_TYPES: ContentType[] = ['Hook / Viral', 'Educational', 'Product Demo', 'Brand Story', 'Behind the Scenes', 'Trending Audio']

const PLATFORM_BG: Record<Platform, string>   = { 'Reel': 'rgba(191,139,46,.09)', 'YouTube Short': 'rgba(192,57,43,.08)', 'TikTok': 'rgba(30,30,30,.06)', 'Carousel': 'rgba(30,111,168,.07)', 'Long-form': 'rgba(30,138,74,.07)', 'Story': 'rgba(142,68,173,.07)' }
const PLATFORM_FG: Record<Platform, string>   = { 'Reel': 'var(--gold)', 'YouTube Short': 'var(--red)', 'TikTok': 'var(--ink)', 'Carousel': 'var(--blue)', 'Long-form': 'var(--green)', 'Story': '#7d3c98' }

// ─── team guide ──────────────────────────────────────────────────────────────

function TeamGuide() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('scripts_guide_collapsed') !== '1'
  })

  function toggle() {
    const next = !open
    setOpen(next)
    localStorage.setItem('scripts_guide_collapsed', next ? '0' : '1')
  }

  return (
    <div style={{
      background: 'var(--s2)', border: '0.5px solid var(--b1)',
      borderRadius: 8, marginBottom: 20, overflow: 'hidden',
    }}>
      <button onClick={toggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
        letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink2)',
      }}>
        <span>◧ Team Guide — How Scripts Work</span>
        <span style={{ color: 'var(--ink4)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Flow overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'Repurpose', color: 'var(--gold)' },
              { label: '→', color: 'var(--ink4)' },
              { label: 'Scripts', color: 'var(--blue)' },
              { label: '→', color: 'var(--ink4)' },
              { label: 'Pipeline', color: 'var(--amber)' },
              { label: '→', color: 'var(--ink4)' },
              { label: 'Content Calendar', color: 'var(--green)' },
            ].map((s, i) => (
              <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {/* Column 1 */}
            <div style={{ background: 'var(--s1)', border: '0.5px solid var(--b1)', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 8 }}>Columns</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, color: 'var(--ink2)', lineHeight: 1.5 }}>
                <div><strong style={{ color: 'var(--ink)' }}>Ideation</strong> — Dump raw ideas here. No polish needed. Title + rough concept is enough.</div>
                <div><strong style={{ color: 'var(--amber)' }}>Shortlisted</strong> — Worth developing. Needs a proper hook, voiceover, and platform assigned before it goes further.</div>
                <div><strong style={{ color: 'var(--green)' }}>Approved</strong> — Shark has signed off. Full script required. Once approved, it gets sent to Pipeline.</div>
              </div>
            </div>

            {/* Column 2 */}
            <div style={{ background: 'var(--s1)', border: '0.5px solid var(--b1)', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 8 }}>How to Add Scripts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, color: 'var(--ink2)', lineHeight: 1.5 }}>
                <div><strong style={{ color: 'var(--ink)' }}>+ New Script Idea</strong> — Manual single add. Use for one-off ideas.</div>
                <div><strong style={{ color: 'var(--ink)' }}>⬆ Bulk Import</strong> — Paste from Google Sheets or a doc with multiple scripts. Claude parses the structure automatically. Works with HOOK:/VOICEOVER: labels, numbered scripts, or plain text.</div>
                <div><strong style={{ color: 'var(--ink)' }}>Repurpose page</strong> — Generate a script from an Instagram reel and send directly to Shortlisted.</div>
              </div>
            </div>

            {/* Column 3 */}
            <div style={{ background: 'var(--s1)', border: '0.5px solid var(--b1)', borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 8 }}>Approvals & Pipeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, color: 'var(--ink2)', lineHeight: 1.5 }}>
                <div><strong style={{ color: 'var(--ink)' }}>Moving cards</strong> — Use the arrow buttons on each card or open the detail panel and use the stage buttons.</div>
                <div><strong style={{ color: 'var(--ink)' }}>Shark approves</strong> — Only Shark moves scripts to Approved. Once approved, click <strong>→ Send to Pipeline</strong> in the detail panel.</div>
                <div><strong style={{ color: 'var(--ink)' }}>Attachments</strong> — Add Google Drive, Notion, or Frame.io links inside any script detail panel. Files stay attached to the script.</div>
                <div><strong style={{ color: 'var(--green)' }}>◉ In Pipeline</strong> badge means the script has already been sent — don&apos;t send it twice.</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)', borderTop: '0.5px solid var(--b1)', paddingTop: 10 }}>
            Questions? Ping Shark on Slack or check the Pipeline page for production status.
          </div>
        </div>
      )}
    </div>
  )
}

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
  const { notify } = useNotifications()

  const [scripts, setScripts]             = useState<Script[]>([])
  const [loading, setLoading]             = useState(true)
  const [showAdd, setShowAdd]             = useState(false)
  const [detail, setDetail]               = useState<Script | null>(null)
  const [form, setForm]                   = useState({ ...EMPTY })
  const [saving, setSaving]               = useState(false)
  const [editMode, setEditMode]           = useState(false)
  const [sentToPipeline, setSentToPipeline] = useState<Set<string>>(new Set())
  const [sendingId, setSendingId]         = useState<string | null>(null)
  const [docs, setDocs]                   = useState<Record<string, DocAttachment[]>>({})
  const [docForm, setDocForm]             = useState({ label: '', url: '' })

  // Bulk import state
  const [showBulk, setShowBulk]           = useState(false)
  const [bulkText, setBulkText]           = useState('')
  const [bulkParsed, setBulkParsed]       = useState<ParsedScript[]>([])
  const [bulkStep, setBulkStep]           = useState<'paste' | 'preview' | 'importing'>('paste')
  const [bulkProgress, setBulkProgress]   = useState(0)
  const [bulkParsing, setBulkParsing]     = useState(false)

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
    setDocForm({ label: '', url: '' })
  }

  const sendToPipeline = async (script: Script) => {
    setSendingId(script.id)
    const supabase = createClient()
    await supabase.from('content_calendar').insert({
      title:        script.title,
      platform:     script.platform,
      content_type: script.content_type,
      client:       script.client,
      script_id:    script.id,
      prod_status:  'draft',
      date:         new Date().toISOString().split('T')[0],
      notes:        script.hook ?? null,
    })
    setSentToPipeline(prev => new Set(prev).add(script.id))
    setSendingId(null)
    playSound('send')
    notify('Sent to Pipeline: ' + script.title, 'success')
  }

  const addDoc = async (scriptId: string) => {
    if (!docForm.label.trim() || !docForm.url.trim()) return
    const existing = docs[scriptId] ?? []
    const updated = [...existing, { label: docForm.label.trim(), url: docForm.url.trim() }]
    setDocs(prev => ({ ...prev, [scriptId]: updated }))
    setDocForm({ label: '', url: '' })
    const supabase = createClient()
    const { error } = await supabase.from('scripts').update({ docs: updated }).eq('id', scriptId)
    if (error) {
      // docs column may not exist — keep state local silently
    }
  }

  const removeDoc = async (scriptId: string, idx: number) => {
    const existing = docs[scriptId] ?? []
    const updated = existing.filter((_, i) => i !== idx)
    setDocs(prev => ({ ...prev, [scriptId]: updated }))
    const supabase = createClient()
    const { error } = await supabase.from('scripts').update({ docs: updated }).eq('id', scriptId)
    if (error) {
      // docs column may not exist — keep state local silently
    }
  }

  const parseBulk = async () => {
    if (!bulkText.trim()) return
    setBulkParsing(true)
    try {
      const res  = await fetch('/api/scripts/parse-bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: bulkText }) })
      const data = await res.json() as { scripts?: ParsedScript[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Parse failed')
      setBulkParsed(data.scripts ?? [])
      setBulkStep('preview')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      notify('Parse failed: ' + msg, 'error')
    } finally {
      setBulkParsing(false)
    }
  }

  const importBulk = async () => {
    if (bulkParsed.length === 0) return
    setBulkStep('importing')
    setBulkProgress(0)
    const supabase = createClient()
    const BATCH = 10
    let done = 0
    for (let i = 0; i < bulkParsed.length; i += BATCH) {
      const batch = bulkParsed.slice(i, i + BATCH).map(p => ({
        title:        p.title,
        hook:         p.hook || null,
        content:      p.content || null,
        platform:     p.platform,
        content_type: p.content_type,
        client:       p.client || null,
        status:       'idea' as ScriptStatus,
        submitted_by: 'Shark',
      }))
      await supabase.from('scripts').insert(batch)
      done += batch.length
      setBulkProgress(done)
    }
    setShowBulk(false)
    setBulkText('')
    setBulkParsed([])
    setBulkStep('paste')
    setBulkProgress(0)
    fetchScripts()
    playSound('success')
    notify(`${done} scripts imported`, 'success')
  }

  const removeParsed = (i: number) => {
    setBulkParsed(prev => prev.filter((_, idx) => idx !== i))
  }

  const editParsed = (i: number, field: keyof ParsedScript, value: string) => {
    setBulkParsed(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const byStatus = (st: ScriptStatus) => scripts.filter(s => s.status === st)

  return (
    <>
      <TeamGuide />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>
          {scripts.length} total &nbsp;·&nbsp; {byStatus('idea').length} ideas &nbsp;·&nbsp; {byStatus('shortlisted').length} shortlisted &nbsp;·&nbsp; {byStatus('final').length} final
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="top-btn" onClick={() => { setBulkText(''); setBulkParsed([]); setBulkStep('paste'); setShowBulk(true) }}>
            <span style={{ fontSize: 12 }}>⬆</span> Bulk Import
          </button>
          <button className="top-btn" onClick={() => { setShowAdd(true); setForm({ ...EMPTY }) }}>
            <span style={{ fontSize: 14 }}>+</span> New Script Idea
          </button>
        </div>
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
                      inPipeline={sentToPipeline.has(s.id)}
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

      {showBulk && (
        <Modal title="Bulk Import Scripts" onClose={() => { setShowBulk(false); setBulkStep('paste') }} wide>
          {bulkStep === 'paste' && (
            <>
              <textarea
                style={{ width: '100%', minHeight: 280, fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.7, padding: '12px 14px', background: 'var(--s2)', border: '0.5px solid var(--b2)', color: 'var(--ink)', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                placeholder={"Paste from Google Sheets, Google Docs, or any text with your scripts. Works with tabs, labels like HOOK:/VOICEOVER:, numbered scripts, or free-form."}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', marginTop: 8, letterSpacing: '.03em' }}>
                Claude will extract title, hook, voiceover, platform, and content type from whatever you paste
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16 }}>
                <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => setShowBulk(false)}>Cancel</button>
                <button className="top-btn" onClick={parseBulk} disabled={bulkParsing || !bulkText.trim()}>
                  {bulkParsing ? 'Parsing with AI…' : 'Parse with AI'}
                </button>
              </div>
            </>
          )}

          {bulkStep === 'preview' && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 12, letterSpacing: '.04em' }}>
                {bulkParsed.length} script{bulkParsed.length !== 1 ? 's' : ''} detected — click a title or hook cell to edit inline
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '0.5px solid var(--b2)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--s2)', position: 'sticky', top: 0, zIndex: 1 }}>
                      {['#', 'Title', 'Hook', 'Platform', 'Content Type', 'Client', ''].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--ink3)', borderBottom: '0.5px solid var(--b2)', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulkParsed.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '0.5px solid var(--b1)' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', width: 28 }}>{i + 1}</td>
                        <td style={{ padding: '4px 6px', minWidth: 120, maxWidth: 200 }}>
                          <InlineEdit value={p.title} onChange={v => editParsed(i, 'title', v)} />
                        </td>
                        <td style={{ padding: '4px 6px', minWidth: 140, maxWidth: 220 }}>
                          <InlineEdit value={p.hook.length > 60 ? p.hook.slice(0, 60) + '…' : p.hook} fullValue={p.hook} onChange={v => editParsed(i, 'hook', v)} />
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>{p.platform}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>{p.content_type}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)' }}>{p.client ?? '—'}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          <button onClick={() => removeParsed(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', paddingTop: 16 }}>
                <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => setBulkStep('paste')}>← Back</button>
                <button className="top-btn" onClick={importBulk} disabled={bulkParsed.length === 0}>
                  Import {bulkParsed.length} Script{bulkParsed.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {bulkStep === 'importing' && (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink3)', letterSpacing: '.04em' }}>
              Importing… {bulkProgress} / {bulkParsed.length}
            </div>
          )}
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

              {/* Attachments */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Attachments</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink4)', marginBottom: 10, letterSpacing: '.04em' }}>Add Google Drive, Notion, Frame.io, or any URL</div>
                {(docs[detail.id] ?? []).length > 0 && (
                  <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(docs[detail.id] ?? []).map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--s2)', border: '0.5px solid var(--b1)', padding: '6px 10px' }}>
                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 12, color: 'var(--blue)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.label}</a>
                        <button onClick={() => removeDoc(detail.id, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: 14, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="login-input" style={{ margin: 0, flex: '0 0 100px', fontSize: 11 }}
                    placeholder="Label" value={docForm.label}
                    onChange={e => setDocForm(f => ({ ...f, label: e.target.value }))}
                  />
                  <input
                    className="login-input" style={{ margin: 0, flex: 1, fontSize: 11 }}
                    placeholder="https://…" value={docForm.url}
                    onChange={e => setDocForm(f => ({ ...f, url: e.target.value }))}
                  />
                  <button
                    className="top-btn"
                    style={{ flexShrink: 0 }}
                    disabled={!docForm.label.trim() || !docForm.url.trim()}
                    onClick={() => addDoc(detail.id)}
                  >Add</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', paddingTop: 14, borderTop: '0.5px solid var(--b1)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PREV[detail.status] && <button className="top-btn" style={{ borderColor: 'var(--b2)', color: 'var(--ink3)', background: 'none' }} onClick={() => moveScript(detail.id, 'back')}>← Move back</button>}
                  {NEXT[detail.status] && <button className="top-btn" onClick={() => moveScript(detail.id, 'forward')}>Move to {NEXT[detail.status] === 'shortlisted' ? 'Shortlisted' : 'Approved'} →</button>}
                  {detail.status === 'final' && (
                    sentToPipeline.has(detail.id)
                      ? <button className="top-btn" disabled style={{ background: 'rgba(30,138,74,.08)', borderColor: 'rgba(30,138,74,.3)', color: 'var(--green)', cursor: 'default' }}>✓ In Pipeline</button>
                      : <button
                          className="top-btn"
                          style={{ background: 'rgba(30,111,168,.08)', borderColor: 'rgba(30,111,168,.3)', color: 'var(--blue)' }}
                          disabled={sendingId === detail.id}
                          onClick={() => sendToPipeline(detail)}
                        >
                          {sendingId === detail.id ? 'Sending…' : '→ Send to Pipeline'}
                        </button>
                  )}
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

function ScriptCard({ script, isLast, colAccent, inPipeline, onOpen, onForward, onBack }: {
  script: Script; isLast: boolean; colAccent: string; inPipeline: boolean
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
        {inPipeline && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 7px', background: 'rgba(30,138,74,.08)', color: 'var(--green)', border: '0.5px solid rgba(30,138,74,.25)' }}>◉ In Pipeline</span>}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.4, marginBottom: script.hook ? 6 : 0 }}>{script.title}</div>
      {script.hook && <div style={{ fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>"{script.hook}"</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink4)' }}>{script.submitted_by} · {timeAgo(script.created_at)}</span>
        {hovered && (
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            {PREV[script.status] && <button onClick={onBack} style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '3px 8px', background: 'none', border: '0.5px solid var(--b2)', color: 'var(--ink3)', cursor: 'pointer' }}>←</button>}
            {NEXT[script.status] && !inPipeline && <button onClick={onForward} style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '3px 8px', background: 'none', border: `0.5px solid ${colAccent}`, color: colAccent, cursor: 'pointer' }}>→</button>}
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

function InlineEdit({ value, fullValue, onChange }: { value: string; fullValue?: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(fullValue ?? value)

  const commit = () => {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 6px', background: 'var(--s1)', border: '1px solid var(--blue)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      />
    )
  }

  return (
    <div
      onClick={() => { setDraft(fullValue ?? value); setEditing(true) }}
      style={{ cursor: 'text', fontSize: 11, color: 'var(--ink)', padding: '3px 6px', minHeight: 22, borderRadius: 2, lineHeight: 1.5 }}
      title="Click to edit"
    >
      {value || <span style={{ color: 'var(--ink4)', fontStyle: 'italic' }}>—</span>}
    </div>
  )
}
