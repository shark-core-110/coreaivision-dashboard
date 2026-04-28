'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type UpdateType   = 'daily' | 'weekly' | 'note'
type AuthorType   = 'human' | 'ai'
type FilterOption = 'all' | UpdateType

interface Update {
  id: string
  content: string
  author: string
  author_type: AuthorType
  update_type: UpdateType
  created_at: string
}

interface ActivityEntry {
  id: string
  entity_type: string
  action: string
  description: string
  changed_by: string
  changed_by_type: AuthorType
  created_at: string
}

const TYPE_PILL: Record<UpdateType, string> = {
  daily:  'pill-gold',
  weekly: 'pill-green',
  note:   'pill-blue',
}

function formatTs(ts: string): string {
  const d = new Date(ts)
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function UpdatesPage() {
  const [updates, setUpdates]       = useState<Update[]>([])
  const [activity, setActivity]     = useState<ActivityEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [content, setContent]       = useState('')
  const [author, setAuthor]         = useState('Shariq')
  const [updateType, setUpdateType] = useState<UpdateType>('daily')
  const [posting, setPosting]       = useState(false)
  const [filter, setFilter]         = useState<FilterOption>('all')
  const [tab, setTab]               = useState<'updates' | 'activity'>('updates')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: upd }, { data: act }] = await Promise.all([
      supabase.from('updates').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setUpdates(upd ?? [])
    setActivity(act ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const postUpdate = async () => {
    if (!content.trim()) return
    setPosting(true)
    const supabase = createClient()
    const { error } = await supabase.from('updates').insert({
      content: content.trim(),
      author: author.trim() || 'Team',
      author_type: 'human' as AuthorType,
      update_type: updateType,
    })
    if (!error) {
      setContent('')
      fetchData()
    }
    setPosting(false)
  }

  const filtered = filter === 'all' ? updates : updates.filter(u => u.update_type === filter)

  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Updates &amp; Activity</strong>
        &nbsp;&middot;&nbsp; Log announcements, wins, and blockers here
        &nbsp;&middot;&nbsp; The team checks this for async updates
        &nbsp;&middot;&nbsp; All task status changes are auto-logged below
      </div>
      {/* Post form */}
      <div className="metric" style={{ marginBottom: 20 }}>
        <div className="metric-label">Post an Update</div>
        <textarea
          className="fc-textarea"
          placeholder="What happened today? Wins, blockers, decisions, changes to the plan…"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ marginBottom: 12, minHeight: 80 }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="login-input"
            style={{ width: 160, margin: 0, padding: '7px 12px' }}
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Your name"
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {(['daily', 'weekly', 'note'] as UpdateType[]).map(t => (
              <button
                key={t}
                onClick={() => setUpdateType(t)}
                style={{
                  fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em',
                  textTransform: 'uppercase', padding: '4px 12px', cursor: 'pointer',
                  border: '0.5px solid',
                  background: updateType === t ? 'rgba(191,139,46,.12)' : 'transparent',
                  borderColor: updateType === t ? 'var(--gold)' : 'var(--b2)',
                  color: updateType === t ? 'var(--gold)' : 'var(--ink3)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            className="top-btn"
            onClick={postUpdate}
            disabled={posting || !content.trim()}
            style={{ marginLeft: 'auto' }}
          >
            {posting ? 'Posting…' : 'Post Update'}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', marginBottom: 16, borderBottom: '0.5px solid var(--b1)' }}>
        {(['updates', 'activity'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.08em',
              textTransform: 'uppercase', padding: '8px 20px', cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: tab === t ? '1.5px solid var(--gold)' : '1.5px solid transparent',
              color: tab === t ? 'var(--gold)' : 'var(--ink3)',
              marginBottom: '-1px',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="metric-label" style={{ padding: '40px 0', textAlign: 'center' }}>Loading…</div>
      ) : tab === 'updates' ? (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {(['all', 'daily', 'weekly', 'note'] as FilterOption[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pill ${filter === f ? 'pill-gold' : 'pill-blue'}`}
                style={{ cursor: 'pointer', border: '0.5px solid' }}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="metric-label" style={{ padding: '40px 0', textAlign: 'center' }}>
              No updates yet — post the first one above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(u => (
                <div key={u.id} className="metric" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em',
                      textTransform: 'uppercase', padding: '3px 10px',
                      background: u.author_type === 'ai' ? 'rgba(30,111,168,.08)' : 'rgba(191,139,46,.07)',
                      border: `0.5px solid ${u.author_type === 'ai' ? 'rgba(30,111,168,.22)' : 'var(--gold-line)'}`,
                      color: u.author_type === 'ai' ? 'var(--blue)' : 'var(--gold)',
                    }}>
                      {u.author_type === 'ai' ? '🤖' : '👤'} {u.author}
                    </span>
                    <span className={`pill ${TYPE_PILL[u.update_type]}`} style={{ border: '0.5px solid' }}>
                      {u.update_type}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', marginLeft: 'auto' }}>
                      {formatTs(u.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {u.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        activity.length === 0 ? (
          <div className="metric-label" style={{ padding: '40px 0', textAlign: 'center' }}>
            No activity yet — toggle a task to generate the first entry.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activity.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                background: 'var(--s1)', border: '0.5px solid var(--b1)',
              }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em',
                  textTransform: 'uppercase', padding: '2px 8px', flexShrink: 0,
                  background: a.changed_by_type === 'ai' ? 'rgba(30,111,168,.07)' : 'rgba(191,139,46,.06)',
                  border: `0.5px solid ${a.changed_by_type === 'ai' ? 'rgba(30,111,168,.2)' : 'var(--gold-line)'}`,
                  color: a.changed_by_type === 'ai' ? 'var(--blue)' : 'var(--gold)',
                }}>
                  {a.changed_by_type === 'ai' ? '🤖' : '👤'} {a.changed_by}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink2)', flex: 1 }}>{a.description}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink4)', flexShrink: 0 }}>
                  {formatTs(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </>
  )
}
