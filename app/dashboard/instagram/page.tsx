export default function Instagram() {
  return (
    <>
      <div className="ig-stats">
        <div className="ig-stat"><div className="ig-stat-val" style={{ color: 'var(--gold)' }}>18.9K</div><div className="ig-stat-label">Followers</div></div>
        <div className="ig-stat"><div className="ig-stat-val">75</div><div className="ig-stat-label">Total Posts</div></div>
        <div className="ig-stat"><div className="ig-stat-val" style={{ color: 'var(--amber)' }}>1–2x</div><div className="ig-stat-label">Posts / Week</div></div>
        <div className="ig-stat"><div className="ig-stat-val" style={{ color: 'var(--green)' }}>50K</div><div className="ig-stat-label">3-Month Target</div></div>
      </div>
      <div className="card">
        <div className="card-title">Progress to 50K — 37.8% there</div>
        <div className="prog-wrap">
          <div className="prog-row"><span>18.9K current</span><span style={{ color: 'var(--gold)' }}>37.8%</span><span>50K target</span></div>
          <div className="prog-track"><div className="prog-fill prog-gold" style={{ width: '37.8%' }} /></div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink3)' }}>Need +1,033/week to hit 50K in 12 weeks · Currently growing ~200–400/week</div>
      </div>
      <div className="grid2">
        <div>
          <div className="sec">Content Mix Status</div>
          <div className="card">
            <div className="task"><div className="tdot tdot-prog" /><div className="tname">AI tutorials — TimKoda / Wavy Boy style</div><span className="tbadge tb-prog">Building</span></div>
            <div className="task"><div className="tdot tdot-prog" /><div className="tname">Lyra AI avatar content</div><span className="tbadge tb-prog">In Progress</span></div>
            <div className="task"><div className="tdot tdot-done" /><div className="tname">Platform promotions (clients)</div><span className="tbadge tb-done">Active</span></div>
            <div className="task"><div className="tdot tdot-todo" /><div className="tname">Micro drama series — 1-min episodes</div><span className="tbadge tb-todo">Starting</span></div>
            <div className="task"><div className="tdot tdot-todo" /><div className="tname">Behind the scenes — workflow & team</div><span className="tbadge tb-todo">To Do</span></div>
          </div>
        </div>
        <div>
          <div className="sec">Critical Gaps</div>
          <div className="card">
            <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">No consistent daily posting schedule</div></div>
            <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">No SOP for AI tutorial production pipeline</div></div>
            <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">Frequency needs to reach daily to hit 50K</div></div>
          </div>
        </div>
      </div>
    </>
  )
}
