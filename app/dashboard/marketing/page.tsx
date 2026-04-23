export default function Marketing() {
  return (
    <>
      <div className="grid2">
        <div className="metric"><div className="metric-label">Approach</div><div className="metric-val" style={{ fontSize: 18, marginTop: 6, fontWeight: 300 }}>Organic only</div><div className="metric-sub">No paid ads currently</div></div>
        <div className="metric metric-gold"><div className="metric-label">Content Calendar</div><div className="metric-val" style={{ fontSize: 18, marginTop: 6, fontWeight: 300 }}>Loosely defined</div><div className="metric-sub">⚠ Needs formalising</div></div>
      </div>
      <div className="sec">Marketing Objectives</div>
      <div className="card">
        <div className="goal-row"><div className="goal-num">01</div><div className="goal-text">Grow Core AI Vision Instagram to 50K followers</div><div className="goal-date" style={{ color: 'var(--green)' }}>3 months</div></div>
        <div className="goal-row"><div className="goal-num">02</div><div className="goal-text">Sign more brand deal clients — AI SaaS focus</div><div className="goal-date" style={{ color: 'var(--amber)' }}>Ongoing</div></div>
        <div className="goal-row"><div className="goal-num">03</div><div className="goal-text">Fill the AI Skool community at launch</div><div className="goal-date" style={{ color: 'var(--amber)' }}>Apr–May</div></div>
        <div className="goal-row"><div className="goal-num">04</div><div className="goal-text">Build Lyra&apos;s independent audience on Instagram</div><div className="goal-date" style={{ color: 'var(--blue)' }}>3 months</div></div>
      </div>
      <div className="sec">Content Pillars</div>
      <div className="tag-row">
        {['AI tutorials', 'Lyra avatar content', 'Platform promotions', 'Micro drama reels', 'Behind the scenes', 'AI tool demos'].map(t => <span key={t} className="tag">{t}</span>)}
      </div>
      <div className="sec">Marketing Rules</div>
      <div className="card">
        <div className="mktg-row"><div className="mktg-lbl">Hook format</div><div className="mktg-val">One sharp sentence. Lowercase. Max 6 words. No period.</div></div>
        <div className="mktg-row"><div className="mktg-lbl">Caption style</div><div className="mktg-val">Short, direct, lowercase. Comment trigger at the end (&ldquo;Comment AI&rdquo;).</div></div>
        <div className="mktg-row"><div className="mktg-lbl">Posting frequency</div><div className="mktg-val">Target: 1 post/day. Current: 1–2x/week. Gap: critical.</div></div>
        <div className="mktg-row"><div className="mktg-lbl">Visual language</div><div className="mktg-val">Cinematic. Black/white/gold palette. No neon. No gradients.</div></div>
      </div>
    </>
  )
}
