const team = [
  { initials: 'PK', name: 'Pushkar',   role: 'AI Video Creator — Seedance, Lyra visuals',          badge: 'b-active',   label: 'Active' },
  { initials: 'KR', name: 'Krishanu',  role: 'AI Visual Artist — Nano Banana, Kling',               badge: 'b-active',   label: 'Active' },
  { initials: 'YA', name: 'Yash',      role: 'Strategy · Claude Ops · HeyGen production',           badge: 'b-active',   label: 'Active' },
  { initials: 'AK', name: 'Akib',      role: 'In-House Video Editor — briefs, folder structure',    badge: 'b-active',   label: 'Active' },
  { initials: 'PA', name: 'Padmanav',  role: 'Cinematic Video Editor — remote',                     badge: 'b-active',   label: 'Active' },
  { initials: 'NI', name: 'Niraj',     role: 'AI Vibe Coder',                                       badge: 'b-active',   label: 'Active' },
  { initials: 'SJ', name: 'Sanjukta',  role: 'AI Influencer Visuals & Marketing — Lyra Page',       badge: 'b-active',   label: 'Active' },
  { initials: 'JO', name: 'Joyeeta',   role: 'LinkedIn Strategist — Independent Contractor',        badge: 'b-blue',     label: 'Contractor' },
  { initials: 'SM', name: 'Smit',      role: 'AI Creator — Inactive until June',                    badge: 'b-inactive', label: 'Inactive', dim: true },
]

export default function Ops() {
  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Operations Status</div>
        <div className="focus-text">9 active members across AI creation, video editing, strategy, and LinkedIn. Smit inactive until June. SOPs being formalised to reduce founder bottleneck.</div>
      </div>
      <div className="grid3">
        <div className="metric"><div className="metric-label">Team Size</div><div className="metric-val">9</div><div className="metric-sub">active + Smit returns June</div></div>
        <div className="metric"><div className="metric-label">Active Workstreams</div><div className="metric-val">5</div><div className="metric-sub">Running in parallel</div></div>
        <div className="metric metric-gold"><div className="metric-label">Open Roles</div><div className="metric-val">1</div><div className="metric-sub">Content Creator / Editor</div></div>
      </div>
      <div className="sec">Team Roster</div>
      <div className="card">
        {team.map((m) => (
          <div className="row" key={m.name} style={m.dim ? { opacity: 0.45 } : {}}>
            <div className="row-left">
              <div className="avatar">{m.initials}</div>
              <div>
                <div className="row-name">{m.name}</div>
                <div className="row-role">{m.role}</div>
              </div>
            </div>
            <span className={`badge ${m.badge}`}>{m.label}</span>
          </div>
        ))}
      </div>
      <div className="sec">Team Capacity</div>
      <div className="card">
        {[
          { label: 'AI Creators (Krishanu, Pushkar)', detail: '2 active', pct: 80, cls: 'prog-gold' },
          { label: 'Video Editors (Akib, Padmanav)',  detail: '2 active', pct: 100, cls: 'prog-blue' },
          { label: 'Marketing & LinkedIn (Sanjukta, Joyeeta)', detail: '2 active', pct: 100, cls: 'prog-blue' },
          { label: 'Strategy & Ops (Yash, Niraj)',   detail: '2 active', pct: 100, cls: 'prog-green' },
        ].map((row) => (
          <div key={row.label} style={{ marginBottom: 12 }}>
            <div className="prog-row"><span>{row.label}</span><span>{row.detail}</span></div>
            <div className="prog-track"><div className={`prog-fill ${row.cls}`} style={{ width: `${row.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </>
  )
}
