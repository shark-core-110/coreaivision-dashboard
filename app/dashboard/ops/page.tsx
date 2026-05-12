'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// SVG ring circumference for r=24: 2π×24 ≈ 150.8
const CIRC = 150.8

const NOTION_URL = 'https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35'

interface Member {
  id:                string
  initials:          string
  name:              string
  role:              string
  short_role:        string | null
  capacity_pct:      number
  contractor:        boolean
  inactive:          boolean
  blue_indicator:    boolean
  task_description:  string | null
  task_chips:        string[]
  display_order:     number
}

function ringOffset(pct: number) {
  return CIRC - (pct / 100) * CIRC
}

function ringClass(pct: number, contractor: boolean, inactive: boolean) {
  if (inactive)   return 'ring-inactive'
  if (contractor) return 'ring-contractor'
  if (pct >= 100) return 'ring-full'
  return 'ring-active'
}

function CapDots({ pct, full }: { pct: number; full: boolean }) {
  return (
    <div className="capacity-dots">
      {[20, 40, 60, 80, 100].map((threshold) => {
        const filled = pct >= threshold
        const cls = filled
          ? full ? 'cap-dot cap-fill-full' : 'cap-dot cap-fill'
          : 'cap-dot'
        return <div key={threshold} className={cls} />
      })}
    </div>
  )
}

const capacitySummary = [
  { label: 'AI Creators',    pct: 80  },
  { label: 'Video Editors',  pct: 100 },
  { label: 'Marketing',      pct: 100 },
  { label: 'Strategy & Ops', pct: 100 },
]

export default function Ops() {
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase
      .from('dashboard_team')
      .select('id, initials, name, role, short_role, capacity_pct, contractor, inactive, blue_indicator, task_description, task_chips, display_order')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        if (data) setMembers(data as Member[])
      })

    return () => { cancelled = true }
  }, [])

  const activeCount   = members.filter(m => !m.inactive).length
  const inactiveLabel = members.find(m => m.inactive)?.name

  return (
    <>
      {/* ── Headline stats ── */}
      <div className="hero-stat-row" style={{ marginBottom: 20 }}>
        <div className="hero-stat-block">
          <div className="hero-num">{members.length || '—'}</div>
          <div className="hero-label">Team Members</div>
          <div className="hero-trend">
            {activeCount} active{inactiveLabel ? ` · ${inactiveLabel} inactive` : ''}
          </div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">5</div>
          <div className="hero-label">Workstreams</div>
          <div className="hero-trend">Running in parallel</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">1</div>
          <div className="hero-label">Open Role</div>
          <div className="hero-trend">Creator / Editor</div>
        </div>
      </div>

      {/* ── Member cards with SVG rings ── */}
      <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>Team</div>
      <div className="member-card-grid">
        {members.map((m) => {
          const rc = ringClass(m.capacity_pct, m.contractor, m.inactive)
          return (
            <div key={m.id} className={`member-card${m.inactive ? ' dim-card' : ''}`}>
              <div className="member-ring-wrap">
                <svg className="member-ring-svg" viewBox="0 0 56 56">
                  <circle className="member-ring-bg" cx="28" cy="28" r="24" />
                  <circle
                    className={`member-ring-fill ${rc}`}
                    cx="28" cy="28" r="24"
                    strokeDasharray={`${CIRC} ${CIRC}`}
                    strokeDashoffset={ringOffset(m.capacity_pct)}
                  />
                </svg>
                <div className="member-avatar">{m.initials}</div>
              </div>
              <div className="member-name">{m.name}</div>
              <div className="member-role-short">{m.short_role ?? m.role}</div>
              <CapDots pct={m.capacity_pct} full={m.capacity_pct >= 100 && !m.contractor} />
              {(m.task_chips ?? []).map((c) => (
                <div key={c} className="task-chip">{c}</div>
              ))}
            </div>
          )
        })}
      </div>

      {/* ── Capacity summary ── */}
      <div className="sec" style={{ marginBottom: 8 }}>Capacity</div>
      <div className="capacity-summary-strip">
        {capacitySummary.map((row) => (
          <div key={row.label} className="cap-summary-cell">
            <div className="cap-summary-label">{row.label}</div>
            <div className={`cap-summary-pct${row.pct >= 100 ? ' pct-full' : ''}`}>{row.pct}%</div>
            <CapDots pct={row.pct} full={row.pct >= 100} />
          </div>
        ))}
      </div>

      {/* ── Operations note ── */}
      <div className="focus-block">
        <div className="focus-label">Operations Note</div>
        <div className="focus-text">
          All active members at or near full capacity. SOPs being formalised to reduce founder bottleneck.
          1 open role for Content Creator / Editor.
        </div>
      </div>

      {/* ── Notion team pages ── */}
      <div className="sec" style={{ marginTop: 20, marginBottom: 4 }}>Individual Pages</div>
      <div className="focus-block" style={{ marginBottom: 12 }}>
        <div className="focus-label">Notion HQ</div>
        <div className="focus-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>Each team member has their own page in Notion with tasks, responsibilities, and weekly targets.</span>
          <a
            href={NOTION_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--hnd)',
              color: 'var(--ink2)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.11)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          >
            ↗ Open in Notion
          </a>
        </div>
      </div>

      <div className="team-grid">
        {members.map((m) => (
          <a
            key={m.id}
            className="team-card"
            href={NOTION_URL}
            target="_blank"
            rel="noreferrer"
            style={m.inactive ? { opacity: 0.4, pointerEvents: 'none' } : {}}
          >
            <div className={`tc-status${m.inactive ? ' inactive' : ''}`} style={m.blue_indicator ? { background: 'var(--blue)' } : {}} />
            <div className="tc-avatar" style={m.blue_indicator ? { color: 'var(--blue)' } : {}}>{m.initials}</div>
            <div className="tc-name" style={m.inactive ? { color: 'var(--ink3)' } : {}}>{m.name}</div>
            <div className="tc-role">{m.role}</div>
          </a>
        ))}
      </div>

      {/* ── Task summary ── */}
      <div className="sec" style={{ marginTop: 20, marginBottom: 8 }}>Task Summary</div>
      <div className="card">
        {members.filter(m => !m.inactive && m.task_description).map((m) => (
          <div className="row" key={m.id}>
            <div className="row-left">
              <div className="avatar">{m.initials}</div>
              <div>
                <div className="row-name">{m.name}</div>
                <div className="row-role">{m.task_description}</div>
              </div>
            </div>
            <span className="badge b-active">Active</span>
          </div>
        ))}
      </div>
    </>
  )
}
