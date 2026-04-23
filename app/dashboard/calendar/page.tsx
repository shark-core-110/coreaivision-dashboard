const week = [
  { day: 'Wed 22', items: [{ label: 'Arcads AI — Reel 1', cls: 'cal-item-client' }, { label: 'Lyra teaser clip', cls: 'cal-item-lyra' }] },
  { day: 'Thu 23', items: [{ label: 'TapNow — Reel 1', cls: 'cal-item-client' }, { label: 'AI tutorial concept', cls: 'cal-item-tutorial' }] },
  { day: 'Fri 24', items: [{ label: 'Syntx.ai — Reel 1', cls: 'cal-item-client' }, { label: 'Syntx.ai — Reel 2', cls: 'cal-item-client' }] },
  { day: 'Sat 25', items: [{ label: 'Lyra story arc', cls: 'cal-item-lyra' }, { label: 'TapNow — Reel 2', cls: 'cal-item-client' }] },
  { day: 'Sun 26', items: [{ label: 'BTS — team workflow', cls: 'cal-item-bts' }, { label: 'Syntx.ai — Reel 3', cls: 'cal-item-client' }] },
  { day: 'Mon 27', items: [{ label: 'Arcads AI — Reel 2', cls: 'cal-item-client' }, { label: 'Syntx.ai — Reel 4', cls: 'cal-item-client' }] },
  { day: 'Tue 28', items: [{ label: 'TapNow — Reel 3', cls: 'cal-item-client' }, { label: 'Drama — Ep 1 prep', cls: 'cal-item-drama' }, { label: 'Syntx.ai — Reel 5', cls: 'cal-item-client' }] },
]

export default function Calendar() {
  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Week of April 22–28, 2026</div>
        <div className="focus-text">Target: daily posting. Mix client reels with organic Lyra content and AI tutorials. Social team (Yash) owns scheduling — AI Creators own generation.</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className="pill pill-gold" style={{ cursor: 'default' }}>■ Client Reel</span>
        <span className="pill pill-blue" style={{ cursor: 'default' }}>■ Lyra</span>
        <span className="pill pill-green" style={{ cursor: 'default' }}>■ AI Tutorial</span>
        <span className="pill" style={{ background: 'rgba(167,139,250,.06)', color: '#A78BFA', borderColor: 'rgba(167,139,250,.2)', cursor: 'default' }}>■ Micro Drama</span>
        <span className="pill pill-amber" style={{ cursor: 'default' }}>■ BTS</span>
      </div>
      <div className="cal-grid">
        {week.map((d) => (
          <div key={d.day} className="cal-day">
            <div className="cal-day-label">{d.day}</div>
            {d.items.map((item) => (
              <div key={item.label} className={`cal-item ${item.cls}`}>{item.label}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
