'use client'

import { useState, useEffect } from 'react'

// ── SVG ring — circumference for r=52: 2π×52 ≈ 326.7
const CIRC_IG = 326.7
const FOLLOWERS = 18900
const TARGET    = 50000
const PCT       = Math.round((FOLLOWERS / TARGET) * 1000) / 10   // 37.8

// ── Weekly growth data (last 8 weeks)
const growthData = [
  { week: 'Mar 17', count: 14200 },
  { week: 'Mar 24', count: 14900 },
  { week: 'Mar 31', count: 15600 },
  { week: 'Apr 7',  count: 16300 },
  { week: 'Apr 14', count: 16900 },
  { week: 'Apr 21', count: 17500 },
  { week: 'Apr 28', count: 18100 },
  { week: 'May 5',  count: 18900 },
]

// ── Weekly post counts
const postsData = [
  { week: 'M 17', count: 2 },
  { week: 'M 24', count: 1 },
  { week: 'M 31', count: 3 },
  { week: 'A 7',  count: 2 },
  { week: 'A 14', count: 2 },
  { week: 'A 21', count: 3 },
  { week: 'A 28', count: 2 },
  { week: 'M 5',  count: 2 },
]

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

// ── Count-up hook
function useCountUp(target: number, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let startTime: number | null = null
    let rafId: number
    const animate = (ts: number) => {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime - delay
      if (elapsed < 0) { rafId = requestAnimationFrame(animate); return }
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setVal(Math.floor(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(animate)
      else setVal(target)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration, delay])
  return val
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

// ── Follower growth SVG line chart
function GrowthChart() {
  const W = 320, H = 72
  const pad = { top: 8, right: 12, bottom: 18, left: 12 }
  const cW  = W - pad.left - pad.right
  const cH  = H - pad.top  - pad.bottom
  const min = Math.min(...growthData.map(d => d.count))
  const max = Math.max(...growthData.map(d => d.count))
  const rng = max - min

  const cx = (i: number) => pad.left + (i / (growthData.length - 1)) * cW
  const cy = (v: number) => pad.top + (1 - (v - min) / rng) * cH

  const pts  = growthData.map((d, i) => `${cx(i)},${cy(d.count)}`).join(' ')
  const last = growthData[growthData.length - 1]
  const prev = growthData[0]
  const gain = last.count - prev.count

  const areaPath = [
    `M ${cx(0)},${cy(growthData[0].count)}`,
    ...growthData.slice(1).map((d, i) => `L ${cx(i + 1)},${cy(d.count)}`),
    `L ${cx(growthData.length - 1)},${H - pad.bottom}`,
    `L ${cx(0)},${H - pad.bottom}`,
    'Z',
  ].join(' ')

  return (
    <div className="ig-growth-chart">
      <div className="ig-growth-chart-header">
        <span className="ig-chart-title">Follower Growth — 8 Weeks</span>
        <span className="ig-chart-delta">+{fmt(gain)} since Mar 17</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Subtle grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line
            key={t}
            x1={pad.left} y1={pad.top + t * cH}
            x2={W - pad.right} y2={pad.top + t * cH}
            stroke="var(--b1)" strokeWidth="0.5"
          />
        ))}
        {/* Area */}
        <path d={areaPath} fill="rgba(255,255,255,0.04)" className="chart-area-anim" />
        {/* Line */}
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-line-anim"
        />
        {/* End dot */}
        <circle
          cx={cx(growthData.length - 1)}
          cy={cy(last.count)}
          r="3"
          fill="rgba(255,255,255,0.85)"
          className="chart-dot-anim"
        />
        {/* Week labels every 2nd */}
        {growthData.filter((_, i) => i % 2 === 0).map((d, i) => (
          <text
            key={d.week}
            x={cx(i * 2)}
            y={H - 3}
            fontSize="7"
            fill="rgba(255,255,255,0.25)"
            fontFamily="-apple-system,sans-serif"
            textAnchor="middle"
          >
            {d.week}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ── Weekly posts bar chart
function PostsChart() {
  const maxPosts = Math.max(...postsData.map(d => d.count))

  return (
    <div className="posts-chart-wrap">
      <div className="posts-chart-header">
        <span className="ig-chart-title">Posts Per Week</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--hnd)', color: 'var(--ink4)' }}>
          avg {(postsData.reduce((s, d) => s + d.count, 0) / postsData.length).toFixed(1)}/week
        </span>
      </div>
      <div className="posts-bar-row">
        {postsData.map((d, i) => (
          <div key={i} className="posts-bar-col">
            <div
              className="posts-bar"
              style={{
                height: `${(d.count / maxPosts) * 100}%`,
                animationDelay: `${0.05 * i + 0.3}s`,
                background: d.count === maxPosts
                  ? 'rgba(255,255,255,0.4)'
                  : 'rgba(255,255,255,0.15)',
              }}
            />
          </div>
        ))}
      </div>
      <div className="posts-week-labels">
        {postsData.map((d, i) => (
          <div key={i} className="posts-week-label">{d.week}</div>
        ))}
      </div>
    </div>
  )
}

export default function Instagram() {
  const [gapsOpen, setGapsOpen] = useState(false)
  const animFollowers = useCountUp(FOLLOWERS, 1400, 100)
  const critCount = criticalGaps.filter(g => g.dot === 'bn-crit').length
  const offset = CIRC_IG - (PCT / 100) * CIRC_IG

  return (
    <>
      {/* ── Hero: animated follower count + animated ring ── */}
      <div className="ig-hero-layout">
        <div>
          <div className="ig-big-num count-up-anim">{fmt(animFollowers)}</div>
          <div className="ig-big-label">Followers</div>
          <div className="ig-big-sub">@core.aivision · {TARGET / 1000}K goal</div>
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink3)', fontFamily: 'var(--hnd)' }}>
            Need <strong style={{ color: 'var(--ink2)' }}>+1,033/week</strong> to hit 50K in 12 weeks
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--hnd)', marginTop: 3 }}>
            Currently growing ~200–400/week
          </div>
        </div>
        <div className="ig-ring-block">
          <svg className="ig-ring-svg" viewBox="0 0 120 120">
            <circle className="ig-ring-bg" cx="60" cy="60" r="52" />
            <circle
              className="ig-ring-fill ig-ring-fill-anim"
              cx="60" cy="60" r="52"
              strokeDasharray={`${CIRC_IG} ${CIRC_IG}`}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="ig-ring-center">
            <div className="ig-ring-pct">{PCT}%</div>
            <div className="ig-ring-sub">to 50K</div>
          </div>
        </div>
      </div>

      {/* ── Follower growth line chart ── */}
      <GrowthChart />

      {/* ── Posts per week bar chart ── */}
      <PostsChart />

      {/* ── Content mix pills ── */}
      <div className="sec" style={{ marginTop: 4, marginBottom: 8 }}>Content Mix</div>
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
