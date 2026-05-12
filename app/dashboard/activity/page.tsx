'use client'

import { useEffect, useState } from 'react'
import type { ActivityItem } from '@/app/api/activity/route'

type Range = 'today' | '7d' | '30d'

const RANGE_LABELS: Record<Range, string> = {
  today: 'Today',
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
}

// Map raw verbs from activity_log into friendlier display strings
function friendlyVerb(verb: string): string {
  const map: Record<string, string> = {
    created:       'created',
    status_change: 'changed status of',
    bulk_created:  'added',
    update:        'updated',
    deleted:       'deleted',
  }
  return map[verb] ?? verb
}

function actorBadge(actorType: string): string {
  switch (actorType) {
    case 'admin': return 'b-gold'
    case 'ai':    return 'b-blue'
    case 'human': return 'b-active'
    default:      return 'b-inactive'
  }
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now  = Date.now()
  const sec  = Math.floor((now - then) / 1000)
  if (sec < 60)      return `${sec}s ago`
  if (sec < 3600)    return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400)   return `${Math.floor(sec / 3600)}h ago`
  if (sec < 604800)  return `${Math.floor(sec / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// Group items by day for visual separation
function groupByDay(items: ActivityItem[]): { day: string; items: ActivityItem[] }[] {
  const groups = new Map<string, ActivityItem[]>()
  for (const item of items) {
    const d = new Date(item.at)
    const key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return Array.from(groups.entries()).map(([day, items]) => ({ day, items }))
}

export default function Activity() {
  const [range,    setRange]    = useState<Range>('7d')
  const [items,    setItems]    = useState<ActivityItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/activity?range=${range}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<{ items: ActivityItem[] }>
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.items ?? [])
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load activity')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [range])

  const groups = groupByDay(items)

  return (
    <>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="hero-num" style={{ fontSize: 38 }}>{items.length}</div>
          <div className="hero-label">events · {RANGE_LABELS[range]}</div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', '7d', '30d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="action-btn"
              style={{
                background:   r === range ? 'rgba(255,255,255,0.10)' : 'var(--s2)',
                borderColor:  r === range ? 'rgba(255,255,255,0.30)' : 'var(--b2)',
                color:        r === range ? 'var(--ink)' : 'var(--ink2)',
                fontWeight:   r === range ? 600 : 500,
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="row">
              <div className="row-left" style={{ flex: 1 }}>
                <div className="avatar ig-skeleton" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ flex: 1 }}>
                  <div className="ig-skeleton" style={{ height: 12, width: '60%', marginBottom: 6 }} />
                  <div className="ig-skeleton" style={{ height: 9,  width: '40%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="focus-block" style={{ borderLeftColor: 'var(--red)' }}>
          <div className="focus-label" style={{ color: 'var(--red)' }}>Could not load activity</div>
          <div className="focus-text">{error}</div>
          <button
            onClick={() => setRange((r) => r)}
            className="action-btn"
            style={{ marginTop: 10 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && items.length === 0 && (
        <div className="focus-block">
          <div className="focus-label">No activity yet</div>
          <div className="focus-text">
            Nothing happened in this range. Try a longer window, or trigger a task status change.
          </div>
        </div>
      )}

      {/* ── Grouped feed ── */}
      {!loading && !error && groups.map((g) => (
        <div key={g.day} style={{ marginBottom: 18 }}>
          <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>{g.day}</div>
          <div className="card" style={{ padding: '4px 16px' }}>
            {g.items.map((item) => (
              <div key={item.id} className="row" style={{ alignItems: 'flex-start' }}>
                <div className="row-left" style={{ alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <div className="avatar" style={{ marginTop: 2 }}>{item.actor.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{item.actor}</span>
                      <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>{friendlyVerb(item.verb)}</span>
                      {item.entityType && (
                        <span className="badge b-inactive" style={{ fontSize: 8 }}>{item.entityType}</span>
                      )}
                    </div>
                    <div className="row-role" style={{ marginTop: 4, lineHeight: 1.45, color: 'var(--ink2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {item.object}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${actorBadge(item.actorType)}`} style={{ fontSize: 8 }}>
                        {item.actorType}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink3)' }}>
                        {timeOfDay(item.at)} · {timeAgo(item.at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
