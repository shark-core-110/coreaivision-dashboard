const team = [
  { initials: 'PK', name: 'Pushkar',   role: 'AI Video Creator — Seedance, Lyra visuals',            badge: 'b-active',   label: 'Active' },
  { initials: 'KR', name: 'Krishanu',  role: 'AI Visual Artist — Nano Banana, Kling',                badge: 'b-active',   label: 'Active' },
  { initials: 'YA', name: 'Yash',      role: 'Strategy · Claude Ops · HeyGen production',            badge: 'b-active',   label: 'Active' },
  { initials: 'AK', name: 'Akib',      role: 'In-House Video Editor — briefs, folder structure',     badge: 'b-active',   label: 'Active' },
  { initials: 'PA', name: 'Padmanav',  role: 'Cinematic Video Editor — remote',                      badge: 'b-active',   label: 'Active' },
  { initials: 'NI', name: 'Niraj',     role: 'AI Vibe Coder',                                        badge: 'b-active',   label: 'Active' },
  { initials: 'SJ', name: 'Sanjukta',  role: 'AI Influencer Visuals & Marketing — Lyra Page',        badge: 'b-active',   label: 'Active' },
  { initials: 'JO', name: 'Joyeeta',   role: 'LinkedIn Strategist — Independent Contractor',         badge: 'b-blue',     label: 'Contractor' },
  { initials: 'SM', name: 'Smit',      role: 'AI Creator — Inactive until June',                     badge: 'b-inactive', label: 'Inactive', dim: true },
]

const tasks = [
  { initials: 'KR', name: 'Krishanu',  desc: 'Lyra visuals (Nano Banana Pro 2K) · Kling 4s videos · 5 daily · Lipsync' },
  { initials: 'PK', name: 'Pushkar',   desc: 'Seedance 2.0 videos (1/day) · Lyra visuals daily' },
  { initials: 'YA', name: 'Yash',      desc: 'Instagram strategy in Claude · Skills folders · HeyGen talking videos' },
  { initials: 'AK', name: 'Akib',      desc: 'Brief video edits · Home folder structure for Core AI Vision' },
  { initials: 'PA', name: 'Padmanav',  desc: 'Cinematic video edits — remote' },
  { initials: 'NI', name: 'Niraj',     desc: 'AI Vibe Coding projects' },
  { initials: 'SJ', name: 'Sanjukta',  desc: 'AI influencer visuals & marketing — Lyra Page' },
  { initials: 'JO', name: 'Joyeeta',   desc: 'LinkedIn strategy & content — contractor' },
]

export default function Ops() {
  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Team &amp; Ops</strong>
        &nbsp;&middot;&nbsp; Full roster with roles and active status
        &nbsp;&middot;&nbsp; Capacity bars show workstream load
        &nbsp;&middot;&nbsp; Update who&apos;s blocked or maxed so the team can rebalance
      </div>
      <div className="focus-block">
        <div className="focus-label">Operations Status</div>
        <div className="focus-text">9 members across AI creation, video editing, strategy, and LinkedIn. Smit inactive until June. SOPs being formalised to reduce founder bottleneck.</div>
      </div>

      <div className="grid3">
        <div className="metric"><div className="metric-label">Team Size</div><div className="metric-val">9</div><div className="metric-sub">active + Smit returns June</div></div>
        <div className="metric"><div className="metric-label">Active Workstreams</div><div className="metric-val">5</div><div className="metric-sub">Running in parallel</div></div>
        <div className="metric metric-gold"><div className="metric-label">Open Roles</div><div className="metric-val">1</div><div className="metric-sub">Content Creator / Editor</div></div>
      </div>

      <div className="sec">Team</div>
      <div className="team-grid">
        {team.map((m) => (
          <a
            key={m.name}
            className="team-card"
            href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35"
            target="_blank"
            rel="noreferrer"
            style={m.dim ? { opacity: 0.4, pointerEvents: 'none' } : {}}
          >
            <div className={`tc-status ${m.badge === 'b-inactive' ? 'inactive' : ''}`} style={m.badge === 'b-blue' ? { background: 'var(--blue)' } : {}} />
            <div className="tc-avatar" style={m.badge === 'b-blue' ? { color: 'var(--blue)' } : {}}>{m.initials}</div>
            <div className="tc-name" style={m.dim ? { color: 'var(--ink3)' } : {}}>{m.name}</div>
            <div className="tc-role">{m.role.split(' — ')[0]}</div>
          </a>
        ))}
      </div>

      <div className="div" />

      <div className="sec">Team Capacity</div>
      <div className="card">
        {[
          { label: 'AI Creators (Krishanu, Pushkar)',           detail: '2 active', pct: 80,  cls: 'prog-gold'  },
          { label: 'Video Editors (Akib, Padmanav)',            detail: '2 active', pct: 100, cls: 'prog-blue'  },
          { label: 'Marketing & LinkedIn (Sanjukta, Joyeeta)', detail: '2 active', pct: 100, cls: 'prog-blue'  },
          { label: 'Strategy & Ops (Yash, Niraj)',              detail: '2 active', pct: 100, cls: 'prog-green' },
        ].map((row) => (
          <div key={row.label} style={{ marginBottom: 12 }}>
            <div className="prog-row"><span>{row.label}</span><span>{row.detail}</span></div>
            <div className="prog-track"><div className={`prog-fill ${row.cls}`} style={{ width: `${row.pct}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="sec">Current Assignments</div>
      <div className="card">
        {tasks.map((m) => (
          <div className="row" key={m.name}>
            <div className="row-left">
              <div className="avatar">{m.initials}</div>
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
