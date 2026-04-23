const goals = [
  { status: 'prog', title: 'Hit consistent 20–25 reels/month output', desc: 'Production pipeline running smoothly across all clients. SOP in place.', date: 'May 2026' },
  { status: 'todo', title: 'Launch & sell out the AI Skool community', desc: 'Landing page live, waitlist built, founding member offer launched.', date: 'May 2026' },
  { status: 'prog', title: 'Launch Lyra as standalone monetized AI character', desc: "Lyra's own Instagram account, content series, and revenue model.", date: 'Jun 2026' },
  { status: 'todo', title: 'Hit 50K followers on @core.aivision', desc: 'Daily posting cadence maintained. 30K+ growth from current 18.9K.', date: 'Jul 2026' },
  { status: 'todo', title: 'Build full production house operation', desc: '10+ team, SOPs for every role, clients fully served without founder in execution.', date: 'Jul 2026' },
]

export default function Goals() {
  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Horizon — Q2 2026</div>
        <div className="focus-text">Early momentum into operating machine. The goal is not to be busy. The goal is to be inevitable.</div>
      </div>
      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="metric"><div className="metric-label">Goals Set</div><div className="metric-val">5</div><div className="metric-sub">3-month horizon</div></div>
        <div className="metric metric-gold"><div className="metric-label">In Progress</div><div className="metric-val">2</div><div className="metric-sub">Reels + Lyra</div></div>
        <div className="metric metric-red"><div className="metric-label">Not Started</div><div className="metric-val">3</div><div className="metric-sub">Skool · 50K · Prod house</div></div>
      </div>
      <div className="sec">Goals Timeline</div>
      <div className="timeline">
        {goals.map((g) => (
          <div key={g.title} className="tl-item">
            <div className={`tl-dot tl-dot-${g.status}`} />
            <div className="tl-title">{g.title}</div>
            <div className="tl-desc">{g.desc}</div>
            <div className="tl-date">{g.date}</div>
          </div>
        ))}
      </div>
    </>
  )
}
