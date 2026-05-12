'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Bottleneck {
  id:       string
  text:     string
  severity: 'crit' | 'med' | 'low'
  owner:    string | null
  scope:    string
  resolved: boolean
}

export default function Bottlenecks() {
  const [items,      setItems]      = useState<Bottleneck[]>([])
  const [scanning,   setScanning]   = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)

  const fetchItems = () => {
    const supabase = createClient()
    return supabase
      .from('bottlenecks')
      .select('id, text, severity, owner, scope, resolved')
      .eq('scope', 'overview')
      .eq('resolved', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setItems(data as Bottleneck[]) })
  }

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('bottlenecks')
      .select('id, text, severity, owner, scope, resolved')
      .eq('scope', 'overview')
      .eq('resolved', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        if (data) setItems(data as Bottleneck[])
      })
    return () => { cancelled = true }
  }, [])

  const scanForStalled = async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/ai/detect-bottlenecks', { method: 'POST' })
      const data = await res.json() as { created: number; message?: string; tasks?: string[] }
      if (data.created > 0) {
        setScanResult(`${data.created} new bottleneck${data.created > 1 ? 's' : ''} flagged from stalled tasks`)
        await fetchItems()
      } else {
        setScanResult(data.message ?? 'No new bottlenecks found')
      }
    } catch {
      setScanResult('Scan failed — check console')
    } finally {
      setScanning(false)
    }
  }

  const crit = items.filter(i => i.severity === 'crit')
  const med  = items.filter(i => i.severity === 'med')
  const low  = items.filter(i => i.severity === 'low')

  return (
    <>
      {/* Scan button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={scanForStalled}
          disabled={scanning}
          style={{
            padding: '8px 16px', cursor: scanning ? 'not-allowed' : 'pointer',
            background: 'rgba(239,68,68,.07)', border: '0.5px solid rgba(239,68,68,.22)',
            color: '#ef4444', fontFamily: 'var(--mono)', fontSize: 9,
            fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
            opacity: scanning ? .5 : 1,
          }}
        >
          {scanning ? 'Scanning…' : '⬤ Scan for Stalled Tasks'}
        </button>
        {scanResult && (
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{scanResult}</span>
        )}
      </div>

      <div className="focus-block">
        <div className="focus-label">Your personal bottleneck</div>
        <div className="focus-text">
          Team coordination is eating your bandwidth. The fix: SOPs + async structure so
          the team moves without you in every loop. Every hour you spend unblocking is
          an hour not building.
        </div>
      </div>

      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="metric metric-red">
          <div className="metric-label">Critical Blocks</div>
          <div className="metric-val">{crit.length}</div>
          <div className="metric-sub">Fix now</div>
        </div>
        <div className="metric metric-gold">
          <div className="metric-label">Medium Priority</div>
          <div className="metric-val">{med.length}</div>
          <div className="metric-sub">Fix this month</div>
        </div>
        <div className="metric metric-green">
          <div className="metric-label">Quick Wins</div>
          <div className="metric-val">{low.length}</div>
          <div className="metric-sub">Unblock this week</div>
        </div>
      </div>

      {crit.length > 0 && (
        <>
          <div className="sec">Critical — Fix Now</div>
          <div className="card">
            {crit.map((b) => (
              <div key={b.id} className="bn-row">
                <div className="bn-dot bn-crit" />
                <div className="bn-text">{b.text}</div>
                <div className="bn-owner">{b.owner ?? ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {med.length > 0 && (
        <>
          <div className="sec">Medium — Fix This Month</div>
          <div className="card">
            {med.map((b) => (
              <div key={b.id} className="bn-row">
                <div className="bn-dot bn-med" />
                <div className="bn-text">{b.text}</div>
                <div className="bn-owner">{b.owner ?? ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {low.length > 0 && (
        <>
          <div className="sec">Quick Wins — Unblock This Week</div>
          <div className="tag-row">
            {low.map((b) => (
              <span key={b.id} className="tag">{b.text}</span>
            ))}
          </div>
        </>
      )}

      {items.length === 0 && (
        <div className="focus-block" style={{ marginTop: 12 }}>
          <div className="focus-label">No active bottlenecks</div>
          <div className="focus-text">Nothing flagged. Add new bottlenecks via the admin page (coming soon) or directly in Supabase.</div>
        </div>
      )}
    </>
  )
}
