'use client'

// SVG ring circumference for r=24: 2π×24 ≈ 150.8
const CIRC = 150.8

const NOTION_URL = 'https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35'

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

const members = [
  {
    init: 'KR', name: 'Krishanu',  role: 'AI Visual Artist',              short: 'AI Creator',    pct: 80,  contractor: false, inactive: false,
    chips: ['Kling', 'Lipsync'],
    desc: 'Lyra visuals (Nano Banana Pro 2K) · Kling 4s videos · 5 daily · Lipsync',
  },
  {
    init: 'PK', name: 'Pushkar',   role: 'AI Video Creator',              short: 'AI Creator',    pct: 80,  contractor: false, inactive: false,
    chips: ['Seedance', 'Lyra'],
    desc: 'Seedance 2.0 videos (1/day) · Lyra visuals daily',
  },
  {
    init: 'AK', name: 'Akib',      role: 'In-House Editor',               short: 'Video Editor',  pct: 100, contractor: false, inactive: false,
    chips: ['Briefs', 'Folders'],
    desc: 'Brief video edits · Home folder structure for Core AI Vision',
  },
  {
    init: 'PA', name: 'Padmanav',  role: 'Cinematic Editor',              short: 'Editor Remote', pct: 100, contractor: false, inactive: false,
    chips: ['Cinematic'],
    desc: 'Cinematic video edits — remote',
  },
  {
    init: 'NI', name: 'Niraj',     role: 'AI Vibe Coder',                 short: 'AI Coder',      pct: 100, contractor: false, inactive: false,
    chips: ['Vibe Code'],
    desc: 'AI Vibe Coding projects',
  },
  {
    init: 'SJ', name: 'Sanjukta',  role: 'AI Influencer Visuals · Lyra',  short: 'Marketing',     pct: 100, contractor: false, inactive: false,
    chips: ['Lyra Page'],
    desc: 'AI influencer visuals & marketing — Lyra Page',
  },
  {
    init: 'JO', name: 'Joyeeta',   role: 'LinkedIn Strategist · IC',      short: 'LinkedIn',      pct: 100, contractor: true,  inactive: false,
    chips: ['Strategy'],
    desc: 'LinkedIn strategy & content — contractor',
    blue: true,
  },
  {
    init: 'SM', name: 'Smit',      role: 'Inactive · Returns June',       short: '← June',        pct: 0,   contractor: false, inactive: true,
    chips: [],
    desc: '',
  },
]

const capacitySummary = [
  { label: 'AI Creators',    pct: 80  },
  { label: 'Video Editors',  pct: 100 },
  { label: 'Marketing',      pct: 100 },
  { label: 'Strategy & Ops', pct: 100 },
]

export default function Ops() {
  return (
    <>
      {/* ── Headline stats ── */}
      <div className="hero-stat-row" style={{ marginBottom: 20 }}>
        <div className="hero-stat-block">
          <div className="hero-num">8</div>
          <div className="hero-label">Team Members</div>
          <div className="hero-trend">Smit returns June</div>
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
          const rc = ringClass(m.pct, m.contractor, m.inactive)
          return (
            <div key={m.init} className={`member-card${m.inactive ? ' dim-card' : ''}`}>
              <div className="member-ring-wrap">
                <svg className="member-ring-svg" viewBox="0 0 56 56">
                  <circle className="member-ring-bg" cx="28" cy="28" r="24" />
                  <circle
                    className={`member-ring-fill ${rc}`}
                    cx="28" cy="28" r="24"
                    strokeDasharray={`${CIRC} ${CIRC}`}
                    strokeDashoffset={ringOffset(m.pct)}
                  />
                </svg>
                <div className="member-avatar">{m.init}</div>
              </div>
              <div className="member-name">{m.name}</div>
              <div className="member-role-short">{m.short}</div>
              <CapDots pct={m.pct} full={m.pct >= 100 && !m.contractor} />
              {m.chips.map((c) => (
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
            key={m.name}
            className="team-card"
            href={NOTION_URL}
            target="_blank"
            rel="noreferrer"
            style={m.inactive ? { opacity: 0.4, pointerEvents: 'none' } : {}}
          >
            <div className={`tc-status${m.inactive ? ' inactive' : ''}`} style={m.blue ? { background: 'var(--blue)' } : {}} />
            <div className="tc-avatar" style={m.blue ? { color: 'var(--blue)' } : {}}>{m.init}</div>
            <div className="tc-name" style={m.inactive ? { color: 'var(--ink3)' } : {}}>{m.name}</div>
            <div className="tc-role">{m.role}</div>
          </a>
        ))}
      </div>

      {/* ── Task summary ── */}
      <div className="sec" style={{ marginTop: 20, marginBottom: 8 }}>Task Summary</div>
      <div className="card">
        {members.filter(m => !m.inactive && m.desc).map((m) => (
          <div className="row" key={m.name}>
            <div className="row-left">
              <div className="avatar">{m.init}</div>
              <div>
                <div className="row-name">{m.name}</div>
                <div className="row-role">{m.desc}</div>
              </div>
            </div>
            <span className="badge b-active">Active</span>
          </div>
        ))}
      </div>
    </>
  )
}
