export default function BrandDNA() {
  return (
    <>
      <div className="focus-block" style={{ borderLeftColor: 'var(--gold)', marginBottom: 20 }}>
        <div className="focus-label">Brand in one line</div>
        <div className="focus-text" style={{ fontSize: 18, letterSpacing: '-.03em', color: 'var(--gold)', fontStyle: 'italic' }}>
          &ldquo;AI with personality. Content that doesn&apos;t bore.&rdquo;
        </div>
      </div>
      <div className="tag-row" style={{ marginBottom: 24 }}>
        {['Cinematic', 'Understated', 'Precise', 'Scroll-stopping', 'AI-native', 'Fashion-forward', 'Confident'].map(t => <span key={t} className="tag">{t}</span>)}
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
            <div style={{ paddingBottom: 14, borderBottom: '0.5px solid var(--b1)', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink3)', marginBottom: 8, letterSpacing: '.04em' }}>Body — weight 300, -0.01em</div>
              <div style={{ fontSize: 14, fontWeight: 300, letterSpacing: '-.01em', color: 'var(--ink2)' }}>AI with personality. Content that doesn&apos;t bore.</div>
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
            <div className="never-item"><div className="never-x">✕</div><div className="never-text">Never use font-weight 700+ (Bold, Black) — max is Medium 500</div></div>
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
