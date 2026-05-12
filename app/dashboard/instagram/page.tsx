'use client'

import { useState } from 'react'

// SVG ring circumference for r=52: 2π×52 ≈ 326.7
const CIRC_IG = 326.7

const contentMix = [
  { dot: 'mix-dot-prog',   name: 'AI tutorials — TimKoda / Wavy Boy style', status: 'Building'    },
  { dot: 'mix-dot-prog',   name: 'Lyra AI avatar content',                   status: 'In Progress' },
  { dot: 'mix-dot-active', name: 'Platform promos (clients)',                 status: 'Active'      },
  { dot: 'mix-dot-todo',   name: 'Micro drama series — 1-min episodes',      status: 'Starting'    },
  { dot: 'mix-dot-todo',   name: 'Behind the scenes — workflow & team',      status: 'To Do'       },
]

const criticalGaps = [
  { dot: 'bn-crit', text: 'No consistent daily posting schedule'       },
  { dot: 'bn-crit', text: 'No SOP for AI tutorial production pipeline' },
  { dot: 'bn-med',  text: 'Frequency needs to reach daily to hit 50K'  },
]

const pct    = 37.8
const offset = CIRC_IG - (pct / 100) * CIRC_IG

export default function Instagram() {
  const [gapsOpen, setGapsOpen] = useState(false)
  const critCount = criticalGaps.filter(g => g.dot === 'bn-crit').length

  return (
    <>
      {/* ── Hero: big follower count + progress ring ── */}
      <div className="ig-hero-layout">
        <div>
          <div className="ig-big-num">18.9K</div>
          <div className="ig-big-label">Followers</div>
          <div className="ig-big-sub">@core.aivision · 50K goal</div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink3)', fontFamily: 'var(--hnd)' }}>
            Need <strong style={{ color: 'var(--ink2)' }}>+1,033/week</strong> to hit 50K in 12 weeks
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--hnd)', marginTop: 3 }}>
            Currently growing ~200–400/week
          </div>
        </div>
        <div className="ig-ring-block">
          <svg className="ig-ring-svg" viewBox="0 0 120 120">
            <circle className="ig-ring-bg"   cx="60" cy="60" r="52" />
            <circle
              className="ig-ring-fill"
              cx="60" cy="60" r="52"
              strokeDasharray={`${CIRC_IG} ${CIRC_IG}`}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="ig-ring-center">
            <div className="ig-ring-pct">{pct}%</div>
            <div className="ig-ring-sub">to 50K</div>
          </div>
        </div>
      </div>

      {/* ── Content mix pills ── */}
      <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>Content Mix</div>
      <div className="mix-pills-row">
        {contentMix.map((item) => (
          <div key={item.name} className="mix-pill">
            <div className={`mix-dot ${item.dot}`} />
            <div className="mix-pill-name">{item.name}</div>
            <div className="mix-pill-badge">{item.status}</div>
          </div>
        ))}
      </div>

      {/* ── Collapse: Critical Gaps ── */}
      <button
        className="collapse-chip collapse-chip-crit"
        onClick={() => setGapsOpen(o => !o)}
      >
        <span className="collapse-chip-count">{critCount}</span>
        <span>Critical Gaps</span>
        <span className={`collapse-chip-arrow${gapsOpen ? ' open' : ''}`}>▼</span>
      </button>
      {gapsOpen && (
        <div className="collapse-body">
          {criticalGaps.map((g, i) => (
            <div key={i} className="bn-row">
              <div className={`bn-dot ${g.dot}`} />
              <div className="bn-text">{g.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="sec" style={{ marginTop: 20, marginBottom: 8 }}>Stats</div>
      <div className="hero-stat-row">
        <div className="hero-stat-block">
          <div className="hero-num">75</div>
          <div className="hero-label">Total Posts</div>
          <div className="hero-trend">Reels + Carousels</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">1–2x</div>
          <div className="hero-label">Per Week</div>
          <div className="hero-trend hero-trend-warn">Needs daily to hit 50K</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">50K</div>
          <div className="hero-label">3-Month Target</div>
          <div className="hero-trend">12 weeks from now</div>
        </div>
      </div>
    </>
  )
}
