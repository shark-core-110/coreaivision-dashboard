'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── types ────────────────────────────────────────────────────────────────────

type Platform     = 'Reel' | 'YouTube Short' | 'TikTok' | 'Carousel' | 'Story'
type ContentType  = 'Hook / Viral' | 'Educational' | 'Product Demo' | 'Brand Story' | 'Behind the Scenes' | 'Trending Audio'
type HookType     = 'Pattern Interrupt' | 'Bold Claim' | 'Question' | 'Curiosity Gap' | 'Controversy' | 'Relatability' | 'Before/After'
type ScriptStatus = 'idea' | 'shortlisted'

interface Output {
  title:   string
  hook:    string
  body:    string
  cta:     string
  caption: string
}

interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}

// ─── hook starters ────────────────────────────────────────────────────────────

const HOOK_STARTERS: Record<HookType, string> = {
  'Pattern Interrupt':  'Nobody talks about this…',
  'Bold Claim':         'This one thing changed how we create content.',
  'Question':           'What if you could make viral AI videos in under 10 minutes?',
  'Curiosity Gap':      'Here\'s what we found after 90 days of AI content…',
  'Controversy':        'Hot take: most creators are using AI wrong.',
  'Relatability':       'When your AI workflow finally clicks — game changer.',
  'Before/After':       'Before AI: 3 days per reel. After: 3 hours.',
}

// ─── local template fallback ─────────────────────────────────────────────────

function useTemplate(
  description: string,
  platform: Platform,
  contentType: ContentType,
  hookType: HookType,
): Output {
  const hook = HOOK_STARTERS[hookType]
  return {
    title:   `CoreAI Vision — ${contentType}`,
    hook,
    body:    `${description.slice(0, 120)}${description.length > 120 ? '…' : ''}\n\nAdapted for CoreAI Vision's AI-driven creative studio. Tools: Seedance, Kling, HeyGen, Lyra, Claude Ops.`,
    cta:     'Follow for daily AI content breakdowns.',
    caption: `${hook} #AIContent #CoreAIVision #${platform.replace(' ', '')} #ContentStrategy #AIVideo`,
  }
}

// ─── component ───────────────────────────────────────────────────────────────

export default function RepurposePage() {
  // input state
  const [reelUrl,       setReelUrl]       = useState('')
  const [description,   setDescription]   = useState('')
  const [platform,      setPlatform]      = useState<Platform>('Reel')
  const [contentType,   setContentType]   = useState<ContentType>('Hook / Viral')
  const [hookType,      setHookType]      = useState<HookType>('Bold Claim')
  const [client,        setClient]        = useState('')

  // output state
  const [output,        setOutput]        = useState<Output | null>(null)
  const [editOutput,    setEditOutput]    = useState<Output | null>(null)

  // ui state
  const [loading,       setLoading]       = useState(false)
  const [saveMsg,       setSaveMsg]       = useState('')
  const [apiAvailable,  setApiAvailable]  = useState(true)

  // chat state
  const [messages,      setMessages]      = useState<ChatMessage[]>([])
  const [chatInput,     setChatInput]     = useState('')
  const [chatLoading,   setChatLoading]   = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── generate ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!description.trim()) return
    setLoading(true)
    setSaveMsg('')

    try {
      const res = await fetch('/api/repurpose', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ mode: 'restructure', reelUrl, description, platform, contentType, hookType }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setApiAvailable(false)
        const fallback = useTemplate(description, platform, contentType, hookType)
        setOutput(fallback)
        setEditOutput({ ...fallback })
      } else {
        setApiAvailable(true)
        setOutput(data as Output)
        setEditOutput({ ...(data as Output) })
      }
    } catch {
      setApiAvailable(false)
      const fallback = useTemplate(description, platform, contentType, hookType)
      setOutput(fallback)
      setEditOutput({ ...fallback })
    } finally {
      setLoading(false)
    }
  }

  function handleTemplate() {
    const fallback = useTemplate(description, platform, contentType, hookType)
    setOutput(fallback)
    setEditOutput({ ...fallback })
    setApiAvailable(false)
  }

  // ── save to scripts ────────────────────────────────────────────────────────

  async function saveScript(status: ScriptStatus) {
    if (!editOutput) return
    setSaveMsg('')
    const supabase = createClient()
    const { error } = await supabase.from('scripts').insert({
      title:        editOutput.title,
      hook:         editOutput.hook,
      content:      `BODY:\n${editOutput.body}\n\nCTA:\n${editOutput.cta}\n\nCAPTION:\n${editOutput.caption}`,
      platform,
      content_type: contentType,
      status,
      client:       client || null,
      submitted_by: 'Shark',
    })
    setSaveMsg(error ? `Error: ${error.message}` : status === 'idea' ? '✓ Saved as Idea' : '✓ Sent to Shortlisted')
  }

  // ── chat ───────────────────────────────────────────────────────────────────

  async function sendChat(text: string) {
    if (!text.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/repurpose', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ mode: 'chat', messages: next }),
      })
      const data = await res.json()
      const reply = data.reply ?? data.error ?? 'No response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach AI. Check your API key.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const quickPrompts = [
    'Give me 5 hook variations',
    'Rewrite for TikTok',
    'Make the hook more controversial',
    'Shorten the body to 3 sentences',
    'Write a carousel version',
    'Add Lyra as the face of this',
  ]

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', padding: '20px', minHeight: '100%' }}>

      {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Input card */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Reel Input</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label">Instagram Reel URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={reelUrl}
                onChange={e => setReelUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">What the Reel Covers <span style={{ color: 'var(--red)' }}>*</span></label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Describe the reel's topic, key points, and angle…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Platform</label>
                <select className="form-input" value={platform} onChange={e => setPlatform(e.target.value as Platform)}>
                  {(['Reel','YouTube Short','TikTok','Carousel','Story'] as Platform[]).map(p =>
                    <option key={p}>{p}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="form-label">Content Type</label>
                <select className="form-input" value={contentType} onChange={e => setContentType(e.target.value as ContentType)}>
                  {(['Hook / Viral','Educational','Product Demo','Brand Story','Behind the Scenes','Trending Audio'] as ContentType[]).map(t =>
                    <option key={t}>{t}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="form-label">Hook Style</label>
                <select className="form-input" value={hookType} onChange={e => setHookType(e.target.value as HookType)}>
                  {(['Pattern Interrupt','Bold Claim','Question','Curiosity Gap','Controversy','Relatability','Before/After'] as HookType[]).map(h =>
                    <option key={h}>{h}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Hook preview */}
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: '6px',
              padding: '10px 14px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Hook Starter — {hookType}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink1)', fontStyle: 'italic' }}>
                "{HOOK_STARTERS[hookType]}"
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading || !description.trim()}
                style={{ flex: 1 }}
              >
                {loading ? 'Generating…' : '✦ Generate with AI'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleTemplate}
                disabled={!description.trim()}
              >
                Use Template
              </button>
            </div>

            {!apiAvailable && (
              <div style={{ fontSize: '11px', color: 'var(--ink3)', background: 'var(--surface2)', borderRadius: '5px', padding: '6px 10px' }}>
                AI unavailable — showing template. Add ANTHROPIC_API_KEY to .env.local for AI generation.
              </div>
            )}
          </div>
        </div>

        {/* Output card */}
        {editOutput && (
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div className="card-title">Restructured Script</div>
              <div style={{ fontSize: '11px', color: 'var(--ink3)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>
                {platform} · {contentType}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([ ['Title', 'title'], ['Hook', 'hook'], ['Body', 'body'], ['CTA', 'cta'], ['Caption', 'caption'] ] as [string, keyof Output][]).map(([label, key]) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <textarea
                    className="form-input"
                    rows={key === 'body' ? 4 : key === 'caption' ? 3 : 2}
                    value={editOutput[key]}
                    onChange={e => setEditOutput(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                    style={{ resize: 'vertical', fontFamily: key === 'hook' ? 'inherit' : undefined, fontWeight: key === 'hook' ? 500 : undefined }}
                  />
                </div>
              ))}

              <div>
                <label className="form-label">Client (optional)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Syntx, Copyfy, internal…"
                  value={client}
                  onChange={e => setClient(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => saveScript('idea')} style={{ flex: 1 }}>
                  Save as Idea
                </button>
                <button className="btn btn-primary" onClick={() => saveScript('shortlisted')} style={{ flex: 1 }}>
                  → Send to Shortlisted
                </button>
              </div>

              {saveMsg && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: saveMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)',
                  padding: '6px 10px',
                  background: 'var(--surface2)',
                  borderRadius: '5px',
                }}>
                  {saveMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT COLUMN: AI Agent ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', height: 'fit-content', position: 'sticky', top: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '78vh', padding: '0', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink1)' }}>◈ Content Agent</div>
            <div style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '2px' }}>Refine, rewrite, generate variations</div>
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => sendChat(p)}
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--ink2)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  letterSpacing: '0.01em',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseOut={e => (e.currentTarget.style.background = 'var(--surface)')}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: '12px', marginTop: '24px', lineHeight: '1.6' }}>
                Paste a reel, generate a script,<br />then ask me to refine it.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                  color: m.role === 'user' ? '#fff' : 'var(--ink1)',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  fontWeight: m.role === 'user' ? 500 : 400,
                  whiteSpace: 'pre-wrap',
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '12px 12px 12px 2px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  color: 'var(--ink3)',
                  letterSpacing: '0.15em',
                }}>
                  ···
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Ask the agent to refine, rewrite, or generate…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendChat(chatInput)
                }
              }}
              style={{ flex: 1, resize: 'none', fontSize: '12px' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              style={{ padding: '8px 14px', fontSize: '12px', flexShrink: 0 }}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
