'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role:    'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'How many tasks are in progress right now?',
  'Which client has the most content scheduled this week?',
  'Show me all critical bottlenecks',
  'How many reels did we post this month?',
  'What tasks are assigned to Shark?',
]

function formatReply(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const next: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: next }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as { reply: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 720 }}>

      {/* ── Banner ── */}
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, flexShrink: 0,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Ask the Dashboard</strong>
        &nbsp;&middot;&nbsp; Queries live tasks, clients, calendar, and bottlenecks
        &nbsp;&middot;&nbsp; Shift+Enter for new line &middot; Enter to send
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>

        {isEmpty && (
          <div style={{ padding: '32px 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Try asking
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: '7px 14px', fontSize: 12, cursor: 'pointer',
                    background: 'var(--s2)', border: '0.5px solid var(--b2)',
                    color: 'var(--ink2)', fontFamily: 'inherit',
                    transition: 'border-color .15s, color .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,112,173,.4)'; e.currentTarget.style.color = 'var(--blue)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--ink2)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '84%',
              padding:  m.role === 'user' ? '10px 14px' : '12px 16px',
              fontSize: 13,
              lineHeight: 1.65,
              ...(m.role === 'user' ? {
                background: 'rgba(26,112,173,.1)',
                border:     '0.5px solid rgba(26,112,173,.25)',
                color:      'var(--ink)',
              } : {
                background: 'var(--s2)',
                border:     '0.5px solid var(--b1)',
                color:      'var(--ink)',
              }),
            }}>
              {m.role === 'assistant' ? (
                <div
                  dangerouslySetInnerHTML={{ __html: `<p>${formatReply(m.content)}</p>` }}
                  style={{ margin: 0 }}
                />
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 16px', background: 'var(--s2)', border: '0.5px solid var(--b1)',
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink4)', letterSpacing: '.04em',
            }}>
              thinking…
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px', fontSize: 12,
            background: 'rgba(239,68,68,.07)', border: '0.5px solid rgba(239,68,68,.25)',
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        flexShrink: 0, marginTop: 8,
        display: 'flex', gap: 8, alignItems: 'flex-end',
        borderTop: '0.5px solid var(--b1)', paddingTop: 12,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about tasks, clients, content, or bottlenecks…"
          rows={2}
          disabled={loading}
          style={{
            flex: 1, resize: 'none',
            fontFamily: 'inherit', fontSize: 13,
            padding: '10px 13px',
            background: 'var(--s2)', border: '0.5px solid var(--b2)',
            color: 'var(--ink)',
            lineHeight: 1.5,
            opacity: loading ? .5 : 1,
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            padding: '10px 18px', flexShrink: 0,
            background: input.trim() && !loading ? 'rgba(26,112,173,.12)' : 'var(--s2)',
            border: `0.5px solid ${input.trim() && !loading ? 'rgba(26,112,173,.35)' : 'var(--b2)'}`,
            color: input.trim() && !loading ? 'var(--blue)' : 'var(--ink4)',
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
            letterSpacing: '.06em', textTransform: 'uppercase',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'background .15s, border-color .15s, color .15s',
            alignSelf: 'stretch',
          }}
        >
          {loading ? '…' : 'Ask'}
        </button>
      </div>
    </div>
  )
}
