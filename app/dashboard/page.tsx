import Link from 'next/link'

export default function Overview() {
  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Overview</strong>
        &nbsp;&middot;&nbsp; Numbers update live from Supabase
        &nbsp;&middot;&nbsp; Click tasks to mark done
        &nbsp;&middot;&nbsp; Check bottlenecks daily &mdash; these are the things blocking output
      </div>
      <div className="hero-cta-bar">
        <a className="hero-btn hero-btn-notion" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">
          ◈ Open Notion HQ
        </a>
        <a className="hero-btn hero-btn-drive" href="https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9" target="_blank" rel="noreferrer">
          ◫ Google Drive
        </a>
      </div>

      <div className="btn-grid-6" style={{ marginBottom: 20 }}>
        <a className="card-btn featured" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">
          <span className="cb-icon">🗂</span>
          <div><div className="cb-title">Notion HQ</div><div className="cb-desc">All ops</div></div>
        </a>
        <a className="card-btn" href="https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9" target="_blank" rel="noreferrer">
          <span className="cb-icon">📁</span>
          <div><div className="cb-title">Google Drive</div><div className="cb-desc">Assets · Media</div></div>
        </a>
        <a className="card-btn" href="https://claude.ai" target="_blank" rel="noreferrer">
          <span className="cb-icon">🤖</span>
          <div><div className="cb-title">Claude</div><div className="cb-desc">AI workspace</div></div>
        </a>
        <a className="card-btn" href="https://app.slack.com" target="_blank" rel="noreferrer">
          <span className="cb-icon">💬</span>
          <div><div className="cb-title">Slack</div><div className="cb-desc">Team chat</div></div>
        </a>
        <a className="card-btn" href="https://kling.ai" target="_blank" rel="noreferrer">
          <span className="cb-icon">🎬</span>
          <div><div className="cb-title">Kling</div><div className="cb-desc">Video gen</div></div>
        </a>
        <a className="card-btn" href="https://www.instagram.com/core.aivision" target="_blank" rel="noreferrer">
          <span className="cb-icon">📸</span>
          <div><div className="cb-title">Instagram</div><div className="cb-desc">@core.aivision</div></div>
        </a>
      </div>

      <div className="focus-block">
        <div className="focus-label">This week&apos;s focus — Apr 22–28, 2026</div>
        <div className="focus-text">End-to-end video production pipeline — AI tutorials, platform promotions (Higgsfield, Arcads), Lyra avatar content, and micro drama series launch (1-min episodes, 10–50 ep arc).</div>
      </div>

      <div className="kpi-strip">
        <div className="kpi kpi-gold">
          <div className="kpi-label">Instagram</div>
          <div className="kpi-val">18.9K</div>
          <div className="kpi-sub">@core.aivision</div>
          <div className="kpi-bar"><div className="kpi-bar-fill prog-gold" style={{ width: '37.8%' }} /></div>
        </div>
        <div className="kpi kpi-gold">
          <div className="kpi-label">50K Progress</div>
          <div className="kpi-val">37.8%</div>
          <div className="kpi-sub">31.1K to go</div>
          <div className="kpi-bar"><div className="kpi-bar-fill prog-gold" style={{ width: '37.8%' }} /></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Team Size</div>
          <div className="kpi-val">8</div>
          <div className="kpi-sub">+ 1 open slot</div>
          <div className="kpi-bar"><div className="kpi-bar-fill prog-blue" style={{ width: '88%' }} /></div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-label">Active Clients</div>
          <div className="kpi-val">5</div>
          <div className="kpi-sub">Arcads · TapNow · Syntx · Vailo · Atlabs</div>
          <div className="kpi-bar"><div className="kpi-bar-fill prog-green" style={{ width: '62.5%' }} /></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Posts</div>
          <div className="kpi-val">75</div>
          <div className="kpi-sub">Reels + Carousels</div>
          <div className="kpi-bar"><div className="kpi-bar-fill prog-gold" style={{ width: '45%' }} /></div>
        </div>
      </div>

      <div className="sec">Quick Actions</div>
      <div className="actions">
        <Link className="action-btn" href="/dashboard/projects">View Projects →</Link>
        <Link className="action-btn" href="/dashboard/bottlenecks">Check Bottlenecks →</Link>
        <Link className="action-btn" href="/dashboard/clients">Client Pipeline →</Link>
        <Link className="action-btn" href="/dashboard/calendar">Content Calendar →</Link>
        <Link className="action-btn" href="/dashboard/goals">Goals Timeline →</Link>
        <Link className="action-btn" href="/dashboard/today">Today&apos;s Focus →</Link>
      </div>

      <div className="grid2">
        <div>
          <div className="sec">Critical This Week</div>
          <div className="card">
            <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">Syntx.ai Week 1 batch — 9 reels due</div><div className="bn-owner">Team</div></div>
            <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">Arcads AI — 2 reels due</div><div className="bn-owner">AI Creators</div></div>
            <div className="bn-row"><div className="bn-dot bn-crit" /><div className="bn-text">TapNow — 3 reels due</div><div className="bn-owner">AI Creators</div></div>
            <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">Micro drama series — episode concept</div><div className="bn-owner">Shark</div></div>
            <div className="bn-row"><div className="bn-dot bn-med" /><div className="bn-text">Niraj onboarding — AI Vibe Coder setup</div><div className="bn-owner">Shark</div></div>
          </div>
        </div>
        <div>
          <div className="sec">Active Workstreams</div>
          <div className="card">
            <div className="row"><div className="row-left"><span>🎬</span><span className="row-name">Content creation</span></div><span className="badge b-active">Active</span></div>
            <div className="row"><div className="row-left"><span>✦</span><span className="row-name">Lyra AI character</span></div><span className="badge b-blue">Building</span></div>
            <div className="row"><div className="row-left"><span>◈</span><span className="row-name">LinkedIn / personal brand</span></div><span className="badge b-active">Active</span></div>
            <div className="row"><div className="row-left"><span>◉</span><span className="row-name">AI Skool community</span></div><span className="badge b-pending">Planning</span></div>
            <div className="row"><div className="row-left"><span>◆</span><span className="row-name">Micro drama production</span></div><span className="badge b-pending">Starting</span></div>
          </div>
        </div>
      </div>
    </>
  )
}
