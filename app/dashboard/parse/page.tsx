'use client'

import { useState } from 'react'

type Source   = 'WhatsApp' | 'Slack' | 'Notes' | 'Other'
type Priority = 'high' | 'medium' | 'low'
type Step     = 'input' | 'loading' | 'review' | 'done'

interface ParsedTask {
  id:           number
  selected:     boolean
  title:        string
  assigned_to:  string
  project_name: string
  section:      string
  due_date:     string
  priority:     Priority
  notes:        string
}

const TEAM     = ['Shark', 'Krishanu', 'Pushkar', 'Akib', 'Padmanav', 'Niraj', 'Sanjukta', 'Joyeeta']
const SECTIONS = ['Content', 'Client Work', 'Ops', 'Marketing', 'Tech', 'General']
const SOURCES: Source[] = ['WhatsApp', 'Slack', 'Notes', 'Other']

const PRIORITY_COLOR: Record<Priority, string> = {
  high:   'var(--red)',
  medium: 'rgba(255,255,255,0.4)',
  low:    'var(--b2)',
}

function PriorityDot({ p }: { p: Priority }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: PRIORITY_COLOR[p], flexShrink: 0, marginTop: 4,
    }} />
  )
}

export default function ParsePage() {
  const [step,         setStep]         = useState<Step>('input')
  const [source,       setSource]       = useState<Source>('WhatsApp')
  const [conversation, setConversation] = useState('')
  const [tasks,        setTasks]        = useState<ParsedTask[]>([])
  const [error,        setError]        = useState<string | null>(null)
  const [savedCount,   setSavedCount]   = useState(0)

  async function handleParse() {
    if (!conversation.trim()) return
    setStep('loading')
    setError(null)
    try {
      const res  = await fetch('/api/parse-conversation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'parse', conversation, source }),
      })
      const json = await res.json() as {
        tasks?: Omit<ParsedTask, 'id' | 'selected'>[]
        error?: string
      }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Parse failed')
      if (!json.tasks?.length) {
        setError('No tasks found. Try pasting a longer or more specific conversation excerpt.')
        setStep('input')
        return
      }
      setTasks(json.tasks.map((t, i) => ({
        ...t,
        id:           i,
        selected:     true,
        assigned_to:  t.assigned_to  ?? '',
        project_name: t.project_name ?? '',
        due_date:     t.due_date     ?? '',
        notes:        t.notes        ?? '',
      })))
      setStep('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStep('input')
    }
  }

  async function handleSave() {
    const selected = tasks.filter(t => t.selected)
    if (!selected.length) return
    setStep('loading')
    setError(null)
    try {
      const payload = selected.map(({ id: _id, selected: _sel, ...rest }) => rest)
      const res  = await fetch('/api/parse-conversation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'save', tasks: payload }),
      })
      const json = await res.json() as { count?: number; error?: string }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Save failed')
      setSavedCount(json.count ?? selected.length)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStep('review')
    }
  }

  function reset() {
    setStep('input')
    setConversation('')
    setTasks([])
    setError(null)
    setSavedCount(0)
  }

  function updateTask(id: number, field: keyof ParsedTask, value: string | boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const selectedCount = tasks.filter(t => t.selected).length

  return (
    <div style={{ maxWidth: 680 }}>

      {/* ── Step indicator ── */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 28 }}>
        {(['input', 'review', 'done'] as const).map((s, i) => {
          const label  = ['Paste', 'Review', 'Done'][i]
          const active = step === s || (step === 'loading' && i < 2)
          const done   = (step === 'review' && i === 0) || (step === 'done' && i < 2)
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: done ? 'var(--green)' : active ? 'rgba(255,255,255,0.12)' : 'var(--s2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600, fontFamily: 'var(--hnd)',
                color: done ? '#000' : active ? 'var(--ink)' : 'var(--ink4)',
                boxShadow: active && !done ? '0 0 0 1px rgba(255,255,255,0.15)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontFamily: 'var(--hnd)',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--ink)' : 'var(--ink4)',
              }}>
                {label}
              </span>
              {i < 2 && <div style={{ width: 28, height: 1, background: 'var(--b2)' }} />}
            </div>
          )
        })}
      </div>

      {/* ── INPUT ── */}
      {(step === 'input' || (step === 'loading' && tasks.length === 0)) && (
        <>
          <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>Source</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {SOURCES.map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                style={{
                  padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--hnd)', fontSize: 11, fontWeight: 500,
                  background: source === s ? 'rgba(255,255,255,0.12)' : 'var(--s2)',
                  color: source === s ? 'var(--ink)' : 'var(--ink3)',
                  boxShadow: source === s ? '0 0 0 0.5px rgba(255,255,255,0.2)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="sec" style={{ marginBottom: 8 }}>Paste Conversation</div>
          <textarea
            value={conversation}
            onChange={e => setConversation(e.target.value)}
            placeholder={`Paste your ${source} conversation here…\n\nExample:\nShark: Akib, edit the Syntx batch by Thursday\nAkib: Done, will also prep the TapNow brief\nShark: Niraj can you look at the website bug today`}
            rows={10}
            style={{
              width: '100%', resize: 'vertical', boxSizing: 'border-box',
              background: 'var(--s1)', border: '0.5px solid var(--b2)',
              borderRadius: 12, padding: '14px 16px',
              fontFamily: 'var(--hnd)', fontSize: 13, color: 'var(--ink)',
              lineHeight: 1.6, outline: 'none',
            }}
            onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.1)' }}
            onBlur={e  => { e.target.style.boxShadow = 'none' }}
          />

          {error && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)',
              fontSize: 12, color: 'var(--red)', fontFamily: 'var(--hnd)',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={!conversation.trim() || step === 'loading'}
            style={{
              marginTop: 14, padding: '12px 28px', borderRadius: 20,
              background: conversation.trim() ? 'rgba(255,255,255,0.1)' : 'var(--s2)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              cursor: conversation.trim() ? 'pointer' : 'default',
              fontFamily: 'var(--hnd)', fontSize: 13, fontWeight: 600,
              color: conversation.trim() ? 'var(--ink)' : 'var(--ink4)',
            }}
          >
            {step === 'loading' ? 'Extracting…' : 'Extract Tasks →'}
          </button>
        </>
      )}

      {/* ── LOADING (saving) ── */}
      {step === 'loading' && tasks.length > 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          color: 'var(--ink3)', fontFamily: 'var(--hnd)', fontSize: 13,
        }}>
          Saving tasks…
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div className="sec" style={{ marginTop: 0, marginBottom: 0 }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} found — edit before saving
            </div>
            <button
              onClick={() => setStep('input')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--hnd)',
              }}
            >
              ← Edit conversation
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  background: task.selected ? 'var(--s1)' : 'var(--void)',
                  borderRadius: 12, padding: '14px 16px',
                  boxShadow: task.selected
                    ? '0 0 0 0.5px rgba(255,255,255,0.1)'
                    : '0 0 0 0.5px var(--b1)',
                  opacity: task.selected ? 1 : 0.4,
                  transition: 'opacity 0.15s, background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={task.selected}
                    onChange={e => updateTask(task.id, 'selected', e.target.checked)}
                    style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0, accentColor: 'white' }}
                  />
                  <input
                    type="text"
                    value={task.title}
                    onChange={e => updateTask(task.id, 'title', e.target.value)}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'var(--hnd)', fontSize: 13, fontWeight: 500,
                      color: 'var(--ink)', padding: 0,
                    }}
                  />
                  <PriorityDot p={task.priority} />
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 26 }}>
                  <select
                    value={task.assigned_to}
                    onChange={e => updateTask(task.id, 'assigned_to', e.target.value)}
                    style={{
                      background: 'var(--s2)', border: 'none', borderRadius: 20,
                      padding: '4px 10px', fontSize: 10, fontFamily: 'var(--hnd)',
                      color: task.assigned_to ? 'var(--ink2)' : 'var(--ink4)', cursor: 'pointer',
                    }}
                  >
                    <option value="">No assignee</option>
                    {TEAM.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>

                  <select
                    value={task.section}
                    onChange={e => updateTask(task.id, 'section', e.target.value)}
                    style={{
                      background: 'var(--s2)', border: 'none', borderRadius: 20,
                      padding: '4px 10px', fontSize: 10, fontFamily: 'var(--hnd)',
                      color: 'var(--ink2)', cursor: 'pointer',
                    }}
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <select
                    value={task.priority}
                    onChange={e => updateTask(task.id, 'priority', e.target.value as Priority)}
                    style={{
                      background: 'var(--s2)', border: 'none', borderRadius: 20,
                      padding: '4px 10px', fontSize: 10, fontFamily: 'var(--hnd)',
                      color: task.priority === 'high' ? 'var(--red)' : 'var(--ink3)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <input
                    type="date"
                    value={task.due_date}
                    onChange={e => updateTask(task.id, 'due_date', e.target.value)}
                    style={{
                      background: 'var(--s2)', border: 'none', borderRadius: 20,
                      padding: '4px 10px', fontSize: 10, fontFamily: 'var(--hnd)',
                      color: task.due_date ? 'var(--ink2)' : 'var(--ink4)', cursor: 'pointer',
                    }}
                  />

                  {task.project_name && (
                    <span style={{
                      background: 'var(--s2)', borderRadius: 20, padding: '4px 10px',
                      fontSize: 10, fontFamily: 'var(--hnd)', color: 'var(--ink4)',
                    }}>
                      {task.project_name}
                    </span>
                  )}
                </div>

                {task.notes && (
                  <div style={{
                    marginTop: 8, paddingLeft: 26,
                    fontSize: 11, color: 'var(--ink4)',
                    fontFamily: 'var(--hnd)', lineHeight: 1.4,
                    fontStyle: 'italic',
                  }}>
                    {task.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              marginBottom: 12, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.2)',
              fontSize: 12, color: 'var(--red)', fontFamily: 'var(--hnd)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleSave}
              disabled={selectedCount === 0}
              style={{
                padding: '12px 28px', borderRadius: 20,
                background: selectedCount > 0 ? 'rgba(255,255,255,0.1)' : 'var(--s2)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                cursor: selectedCount > 0 ? 'pointer' : 'default',
                fontFamily: 'var(--hnd)', fontSize: 13, fontWeight: 600,
                color: selectedCount > 0 ? 'var(--ink)' : 'var(--ink4)',
              }}
            >
              Save {selectedCount} Task{selectedCount !== 1 ? 's' : ''} →
            </button>
            <button
              onClick={() => setTasks(prev => prev.map(t => ({ ...t, selected: false })))}
              style={{
                padding: '12px 16px', borderRadius: 20,
                background: 'none', border: '0.5px solid var(--b1)',
                cursor: 'pointer', fontFamily: 'var(--hnd)',
                fontSize: 12, color: 'var(--ink4)',
              }}
            >
              Deselect all
            </button>
          </div>
        </>
      )}

      {/* ── DONE ── */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{
            fontSize: 56, fontWeight: 300, letterSpacing: '-0.06em',
            fontFamily: 'var(--hnd)', color: 'var(--green)', marginBottom: 8,
          }}>
            {savedCount}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink3)', fontFamily: 'var(--hnd)', marginBottom: 4 }}>
            task{savedCount !== 1 ? 's' : ''} added to the dashboard
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--hnd)', marginBottom: 36 }}>
            Visible now in Projects and Team &amp; Ops
          </div>
          <button
            onClick={reset}
            style={{
              padding: '12px 28px', borderRadius: 20,
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', fontFamily: 'var(--hnd)',
              fontSize: 13, fontWeight: 500, color: 'var(--ink2)',
            }}
          >
            Parse another conversation →
          </button>
        </div>
      )}

    </div>
  )
}
