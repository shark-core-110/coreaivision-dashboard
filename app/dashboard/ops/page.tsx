// SVG ring circumference for r=24: 2π×24 ≈ 150.8
const CIRC = 150.8

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
  { init: 'KR', name: 'Krishanu',  short: 'AI Creator',    pct: 80,  contractor: false, inactive: false, chips: ['Kling', 'Lipsync'] },
  { init: 'PK', name: 'Pushkar',   short: 'AI Creator',    pct: 80,  contractor: false, inactive: false, chips: ['Seedance', 'Lyra'] },
  { init: 'AK', name: 'Akib',      short: 'Video Editor',  pct: 100, contractor: false, inactive: false, chips: ['Briefs', 'Folders'] },
  { init: 'PA', name: 'Padmanav',  short: 'Editor Remote', pct: 100, contractor: false, inactive: false, chips: ['Cinematic'] },
  { init: 'NI', name: 'Niraj',     short: 'AI Coder',      pct: 100, contractor: false, inactive: false, chips: ['Vibe Code'] },
  { init: 'SJ', name: 'Sanjukta',  short: 'Marketing',     pct: 100, contractor: false, inactive: false, chips: ['Lyra Page'] },
  { init: 'JO', name: 'Joyeeta',   short: 'LinkedIn',      pct: 100, contractor: true,  inactive: false, chips: ['Strategy'] },
  { init: 'SM', name: 'Smit',      short: '← June',        pct: 0,   contractor: false, inactive: true,  chips: [] },
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

      {/* ── Focus note ── */}
      <div className="focus-block">
        <div className="focus-label">Operations Note</div>
        <div className="focus-text">
          All active members at or near full capacity. SOPs being formalised to reduce founder bottleneck.
          1 open role for Content Creator / Editor.
        </div>
      </div>
    </>
  )
}
