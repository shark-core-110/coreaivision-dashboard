export default function Clients() {
  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Strategy</div>
        <div className="focus-text">Lyra as the AI avatar face — demonstrates tools scroll-stopping, creative, audience-first. Core pitch: <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>&ldquo;See how to build AI avatars like this.&rdquo;</em> Target: 25–30 reels/month across all clients.</div>
      </div>
      <div className="grid3">
        <div className="metric metric-gold"><div className="metric-label">Monthly Reel Target</div><div className="metric-val">25–30</div><div className="metric-sub">Across all clients</div></div>
        <div className="metric"><div className="metric-label">Active Clients</div><div className="metric-val">5</div><div className="metric-sub">+ 1 prospecting</div></div>
        <div className="metric metric-green"><div className="metric-label">This Week Target</div><div className="metric-val">14</div><div className="metric-sub">Arcads 2 + TapNow 3 + Syntx 9</div></div>
      </div>
      <div className="sec">Client Pipeline</div>
      <div className="card">
        {[
          { name: 'Arcads AI',  type: 'AI SaaS — Ad creative generation',          reels: '2 reels',  done: 0, total: 2,  badge: 'b-active', label: 'Active' },
          { name: 'TapNow',     type: 'AI SaaS — Prompt engine & content libraries', reels: '3 reels',  done: 0, total: 3,  badge: 'b-active', label: 'Active' },
          { name: 'Vailo.AI',   type: 'AI SaaS — Video & avatar generation',         reels: null,       done: 0, total: 0,  badge: 'b-active', label: 'Active' },
          { name: 'Atlabs.ai',  type: 'AI SaaS — Studio & production tools',         reels: null,       done: 0, total: 0,  badge: 'b-active', label: 'Active' },
          { name: 'AI eCommerce SaaS', type: 'eCommerce + AI category',             reels: null,       done: 0, total: 0,  badge: 'b-pending', label: 'Prospecting' },
        ].map((c) => (
          <div className="client-row" key={c.name}>
            <div>
              <div className="client-name">{c.name}</div>
              <div className="client-type">{c.type}</div>
              {c.total > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Reels</span><span>{c.done} / {c.total}</span>
                  </div>
                  <div style={{ height: 1.5, background: 'var(--b2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--gold)', width: `${(c.done / c.total) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="client-right">
              {c.reels && <div className="reel-count">{c.reels}</div>}
              <span className={`badge ${c.badge}`}>{c.label}</span>
            </div>
          </div>
        ))}
        <div className="client-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div className="client-name">Syntx.ai</div>
              <div className="client-type">AI SaaS — All-in-one creative workspace</div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}><span>Reels</span><span>0 / 12</span></div>
                <div style={{ height: 1.5, background: 'var(--b2)' }}><div style={{ height: '100%', background: 'var(--gold)', width: '0%' }} /></div>
              </div>
            </div>
            <div className="client-right"><div className="reel-count">12 reels</div><span className="badge b-gold">Big Deal</span></div>
          </div>
          <div className="deal-expand">
            <div className="deal-stats">
              <div className="deal-stat"><div className="deal-stat-label">Total Deliverables</div><div className="deal-stat-val" style={{ color: 'var(--gold)' }}>12 reels</div><div className="deal-stat-sub">AI tutorials & showcases</div></div>
              <div className="deal-stat"><div className="deal-stat-label">Reach Guarantee</div><div className="deal-stat-val" style={{ color: 'var(--green)' }}>10K+</div><div className="deal-stat-sub">6 of 12 · within 7 days</div></div>
            </div>
            <div className="deal-term"><span className="deal-term-icon" style={{ color: 'var(--green)' }}>✓</span><span className="deal-term-text">12 reels — at least 6 guaranteed to hit 10K+ reach within 7 days</span></div>
            <div className="deal-term"><span className="deal-term-icon" style={{ color: 'var(--amber)' }}>↻</span><span className="deal-term-text">If reel misses 10K — re-upload, split, or replace to meet objective</span></div>
          </div>
        </div>
      </div>
      <div className="sec">Deal Formats</div>
      <div className="tag-row">
        {['Paid sponsorships', 'Affiliate deals', 'Product integrations', 'Co-created campaigns', 'Platform ambassador'].map(t => <span key={t} className="tag">{t}</span>)}
      </div>
    </>
  )
}
