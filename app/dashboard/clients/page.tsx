import SVGRing from '@/components/ui/SVGRing'

function ClientRing({ done, total }: { done: number; total: number }) {
  const pct     = total > 0 ? (done / total) * 100 : 0
  const hasDone = done > 0

  return (
    <SVGRing
      pct={pct}
      radius={27}
      bgClass="client-ring-bg"
      fillClass={`client-ring-fill${hasDone ? ' ring-done' : ' ring-empty'}`}
      wrapperClass="client-ring-wrap"
    >
      <div className="client-ring-label">
        {total > 0
          ? <>{done}<br /><span style={{ fontSize: 8, opacity: 0.5 }}>/{total}</span></>
          : '—'}
      </div>
    </SVGRing>
  )
}

const activeClients = [
  { name: 'Syntx.ai',  type: 'All-in-one AI workspace',  done: 0, total: 12, badge: 'b-gold',   label: 'Big Deal', bigDeal: true  },
  { name: 'Arcads AI', type: 'AI ad creative generation', done: 0, total: 2,  badge: 'b-active', label: 'Active',   bigDeal: false },
  { name: 'TapNow',    type: 'AI prompt engine',          done: 0, total: 3,  badge: 'b-active', label: 'Active',   bigDeal: false },
  { name: 'Vailo.AI',  type: 'AI video & avatars',        done: 0, total: 0,  badge: 'b-active', label: 'Active',   bigDeal: false },
  { name: 'Atlabs.ai', type: 'AI studio & production',    done: 0, total: 0,  badge: 'b-active', label: 'Active',   bigDeal: false },
]

export default function Clients() {
  return (
    <>
      {/* ── Headline stats ── */}
      <div className="hero-stat-row" style={{ marginBottom: 20 }}>
        <div className="hero-stat-block">
          <div className="hero-num">5</div>
          <div className="hero-label">Active Clients</div>
          <div className="hero-trend">+ 1 prospecting</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">25–30</div>
          <div className="hero-label">Monthly Reels</div>
          <div className="hero-trend">Target across all clients</div>
        </div>
        <div className="hero-stat-block">
          <div className="hero-num">14</div>
          <div className="hero-label">This Week</div>
          <div className="hero-trend hero-trend-warn">Arcads 2 · TapNow 3 · Syntx 9</div>
        </div>
      </div>

      {/* ── Client card grid with SVG rings ── */}
      <div className="sec" style={{ marginTop: 0, marginBottom: 8 }}>Client Pipeline</div>
      <div className="client-card-grid">
        {activeClients.map((c) => (
          <div key={c.name} className={`client-card${c.bigDeal ? ' big-deal' : ''}`}>
            <ClientRing done={c.done} total={c.total} />
            <div className="client-card-name">{c.name}</div>
            <div className="client-card-type">{c.type}</div>
            <span className={`badge ${c.badge}`}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Prospecting ── */}
      <div className="sec" style={{ marginBottom: 8 }}>Prospecting</div>
      <div className="prospecting-row">
        <div className="prospecting-icon">◉</div>
        <div>
          <div className="prospecting-name">AI eCommerce SaaS</div>
          <div className="prospecting-type">eCommerce + AI category — in conversation</div>
        </div>
        <span className="badge b-pending" style={{ marginLeft: 'auto' }}>Prospecting</span>
      </div>

      {/* ── Deal formats ── */}
      <div className="sec" style={{ marginBottom: 8 }}>Deal Formats</div>
      <div className="tag-row">
        {['Paid sponsorships', 'Affiliate deals', 'Product integrations', 'Co-created campaigns', 'Platform ambassador'].map(t => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

      {/* ── Syntx deal terms ── */}
      <div className="sec" style={{ marginBottom: 8 }}>Syntx.ai — Big Deal Terms</div>
      <div className="card">
        <div className="deal-stats">
          <div className="deal-stat">
            <div className="deal-stat-label">Total Deliverables</div>
            <div className="deal-stat-val" style={{ color: 'var(--ink)' }}>12 reels</div>
            <div className="deal-stat-sub">AI tutorials &amp; showcases</div>
          </div>
          <div className="deal-stat">
            <div className="deal-stat-label">Reach Guarantee</div>
            <div className="deal-stat-val" style={{ color: 'var(--green)' }}>10K+</div>
            <div className="deal-stat-sub">6 of 12 · within 7 days</div>
          </div>
        </div>
        <div className="deal-term">
          <span className="deal-term-icon" style={{ color: 'var(--green)' }}>✓</span>
          <span className="deal-term-text">12 reels — at least 6 guaranteed to hit 10K+ reach within 7 days</span>
        </div>
        <div className="deal-term">
          <span className="deal-term-icon" style={{ color: 'var(--ink3)' }}>↻</span>
          <span className="deal-term-text">If reel misses 10K — re-upload, split, or replace to meet objective</span>
        </div>
      </div>
    </>
  )
}
