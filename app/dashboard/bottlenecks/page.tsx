export default function Bottlenecks() {
  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Your personal bottleneck</div>
        <div className="focus-text">Team coordination is eating your bandwidth. The fix: SOPs + async structure so the team moves without you in every loop. Every hour you spend unblocking is an hour not building.</div>
      </div>
      <div className="grid3" style={{ marginBottom: 20 }}>
        <div className="metric metric-red"><div className="metric-label">Critical Blocks</div><div className="metric-val">3</div><div className="metric-sub">Fix now</div></div>
        <div className="metric metric-gold"><div className="metric-label">Medium Priority</div><div className="metric-val">2</div><div className="metric-sub">Fix this month</div></div>
        <div className="metric metric-green"><div className="metric-label">Quick Wins</div><div className="metric-val">4</div><div className="metric-sub">Unblock this week</div></div>
      </div>
      <div className="sec">Critical — Fix Now</div>
      <div className="card">
        <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">No clear content workflow / SOPs — team doesn&apos;t know the process without Shark</div><div className="bn-owner">Shark</div></div>
        <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">Team not moving fast enough — no direction without daily briefing</div><div className="bn-owner">All</div></div>
        <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">Shark&apos;s time stuck in coordination vs. strategy and client work</div><div className="bn-owner">Shark</div></div>
      </div>
      <div className="sec">Medium — Fix This Month</div>
      <div className="card">
        <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">No consistent posting schedule — content coming out irregularly, hurting algorithm</div><div className="bn-owner">Social team</div></div>
        <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">AI Skool community not built — key revenue stream blocked</div><div className="bn-owner">Shark</div></div>
      </div>
      <div className="sec">Quick Wins — Unblock This Week</div>
      <div className="tag-row">
        {['Draft reel production SOP', 'Lock weekly content schedule', 'Brief team on this week\'s targets', 'Top up Claude API credits', 'Niraj onboarding flow', 'Decide on Inc42 partnership'].map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </>
  )
}
