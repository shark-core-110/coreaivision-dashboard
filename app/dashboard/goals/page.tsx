const goals = [
  { status: 'prog', title: 'Hit consistent 20–25 reels/month output',         desc: 'Production pipeline running smoothly across all clients. SOP in place.',             date: 'May 2026' },
  { status: 'todo', title: 'Launch & sell out the AI Skool community',         desc: 'Landing page live, waitlist built, founding member offer launched.',                 date: 'May 2026' },
  { status: 'prog', title: 'Launch Lyra as standalone monetized AI character', desc: "Lyra's own Instagram account, content series, and revenue model.",                   date: 'Jun 2026' },
  { status: 'todo', title: 'Hit 50K followers on @core.aivision',              desc: 'Daily posting cadence maintained. 30K+ growth from current 18.9K.',                 date: 'Jul 2026' },
  { status: 'todo', title: 'Build full production house operation',             desc: '10+ team, SOPs for every role, clients fully served without founder in execution.', date: 'Jul 2026' },
]

const BRAND_WORDS    = ['Cinematic', 'Understated', 'Precise', 'Scroll-stopping', 'AI-native', 'Fashion-forward', 'Confident']
const CONTENT_PILLARS = ['AI tutorials', 'Lyra avatar content', 'Platform promotions', 'Micro drama reels', 'Behind the scenes', 'AI tool demos']

export default function Vision() {
  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Vision</strong>
        &nbsp;&middot;&nbsp; Company direction and brand identity for 2026
        &nbsp;&middot;&nbsp; Not a to-do list &mdash; this is why we build
        &nbsp;&middot;&nbsp; Reference before pitching, hiring, or creating content
      </div>
      {/* ── Goals ── */}
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

      <div className="div" />

      {/* ── Brand DNA ── */}
      <div className="focus-block" style={{ borderLeftColor: 'var(--gold)', marginBottom: 20 }}>
        <div className="focus-label">Brand DNA</div>
        <div className="focus-text" style={{ fontSize: 18, letterSpacing: '-.03em', color: 'var(--gold)', fontStyle: 'italic' }}>
          &ldquo;AI with personality. Content that doesn&apos;t bore.&rdquo;
        </div>
      </div>

      <div className="tag-row" style={{ marginBottom: 24 }}>
        {BRAND_WORDS.map(t => <span key={t} className="tag">{t}</span>)}
      </div>

      <div className="grid2">
        <div>
          <div className="sec">Typography — Helvetica Neue Display</div>
          <div className="card">
            <div style={{ paddingBottom: 14, borderBottom: '0.5px solid var(--b1)', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 8, letterSpacing: '.04em' }}>Display / Hero — weight 300, -0.05em tracking</div>
              <div style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-.05em', color: 'var(--ink)' }}>Core AI Vision</div>
            </div>
            <div style={{ paddingBottom: 14, borderBottom: '0.5px solid var(--b1)', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 8, letterSpacing: '.04em' }}>Section Title — weight 300, -0.03em</div>
              <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-.03em', color: 'var(--ink)' }}>Operations Dashboard</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 8, letterSpacing: '.04em' }}>Label — DM Mono, +0.12em</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold2)' }}>Status · Active · Live</div>
            </div>
          </div>

          <div className="sec">Tone of Voice</div>
          <div className="card">
            <div className="da-grid">
              <div className="da-card da-do"><div className="da-label">DO</div><div className="da-item">Cinematic<br />Understated<br />Confident silence<br />Precise language<br />Not the loudest</div></div>
              <div className="da-card da-avoid"><div className="da-label">AVOID</div><div className="da-item">Hype / exclamation<br />Bold/black fonts<br />Neon gradients<br />Busy layouts<br />Lowercase everywhere</div></div>
            </div>
          </div>

          <div className="sec">Content Pillars</div>
          <div className="tag-row">
            {CONTENT_PILLARS.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div>
          <div className="sec">Color Palette</div>
          <div className="card">
            <div className="swatch-row">
              <div className="swatch" style={{ background: '#0A0A0A' }}><div className="swatch-name" style={{ color: '#F0EDE8' }}>Void Black</div><div className="swatch-hex" style={{ color: '#F0EDE8' }}>#0A0A0A</div></div>
              <div className="swatch" style={{ background: '#D4A84B' }}><div className="swatch-name">Warm Gold</div><div className="swatch-hex">#D4A84B</div></div>
              <div className="swatch" style={{ background: '#FFFFFF', borderColor: 'rgba(0,0,0,.1)' }}><div className="swatch-name" style={{ color: '#0A0A0A' }}>Pure White</div><div className="swatch-hex" style={{ color: '#0A0A0A' }}>#FFFFFF</div></div>
            </div>
            <div className="swatch-row">
              <div className="swatch" style={{ background: '#1C1C1C' }}><div className="swatch-name" style={{ color: '#F0EDE8' }}>Deep Charcoal</div><div className="swatch-hex" style={{ color: '#F0EDE8' }}>#1C1C1C</div></div>
              <div className="swatch" style={{ background: '#E63946' }}><div className="swatch-name">Accent Red</div><div className="swatch-hex">#E63946</div></div>
              <div className="swatch" style={{ background: '#888888' }}><div className="swatch-name">Mid Grey</div><div className="swatch-hex">#888888</div></div>
            </div>
          </div>

          <div className="sec">Visual Rules</div>
          <div className="card">
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">Never use font-weight 700+ — max is Medium 500</div></div>
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">No neon, gradient, or rainbow colors</div></div>
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">No cluttered layouts — space is intentional</div></div>
            <div className="never-item"><div className="never-x" style={{ color: 'var(--green)' }}>✓</div><div className="never-text" style={{ color: 'var(--green)' }}>Gold accents are the only pop of color on void black</div></div>
            <div className="never-item"><div className="never-x" style={{ color: 'var(--green)' }}>✓</div><div className="never-text" style={{ color: 'var(--green)' }}>Every frame should feel like a still from a film</div></div>
          </div>
        </div>
      </div>
    </>
  )
}
