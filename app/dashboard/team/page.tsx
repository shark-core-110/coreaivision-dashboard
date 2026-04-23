const members = [
  { initials: 'KR', name: 'Krishanu',  role: 'AI Visual Artist',           active: true },
  { initials: 'PK', name: 'Pushkar',   role: 'AI Video Creator',           active: true },
  { initials: 'YA', name: 'Yash',      role: 'Strategy · Claude Ops',      active: true },
  { initials: 'AK', name: 'Akib',      role: 'In-House Editor',            active: true },
  { initials: 'PA', name: 'Padmanav',  role: 'Cinematic Editor',           active: true },
  { initials: 'NI', name: 'Niraj',     role: 'AI Vibe Coder',              active: true },
  { initials: 'SJ', name: 'Sanjukta',  role: 'AI Influencer Visuals · Lyra', active: true },
  { initials: 'JO', name: 'Joyeeta',   role: 'LinkedIn Strategist · IC',   active: true, blue: true },
  { initials: 'SM', name: 'Smit',      role: 'Inactive · Returns June',    active: false },
]

const tasks = [
  { initials: 'KR', name: 'Krishanu',  desc: 'Lyra visuals (Nano Banana Pro 2K) · Kling 4s videos · 5 daily · Lipsync' },
  { initials: 'PK', name: 'Pushkar',   desc: 'Seedance 2.0 videos (1/day) · Lyra visuals daily' },
  { initials: 'YA', name: 'Yash',      desc: 'Instagram strategy in Claude · Skills folders · HeyGen talking videos' },
  { initials: 'AK', name: 'Akib',      desc: 'Brief video edits · Home folder structure for Core AI Vision' },
  { initials: 'PA', name: 'Padmanav',  desc: 'Cinematic video edits — remote' },
  { initials: 'NI', name: 'Niraj',     desc: 'AI Vibe Coding projects' },
  { initials: 'SJ', name: 'Sanjukta',  desc: 'AI influencer visuals & marketing — Lyra Page' },
  { initials: 'JO', name: 'Joyeeta',   desc: 'LinkedIn strategy & content — contractor' },
]

export default function TeamPages() {
  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Individual Pages — Notion HQ</div>
        <div className="focus-text">Each team member has their own page in Notion with tasks, responsibilities, and weekly targets.</div>
      </div>
      <div className="team-grid">
        {members.map((m) => (
          <a
            key={m.name}
            className="team-card"
            href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35"
            target="_blank"
            rel="noreferrer"
            style={!m.active ? { opacity: 0.4, pointerEvents: 'none' } : {}}
          >
            <div className={`tc-status ${!m.active ? 'inactive' : ''}`} style={m.blue ? { background: 'var(--blue)' } : {}} />
            <div className="tc-avatar" style={m.blue ? { color: 'var(--blue)' } : {}}>{m.initials}</div>
            <div className="tc-name" style={!m.active ? { color: 'var(--ink3)' } : {}}>{m.name}</div>
            <div className="tc-role">{m.role}</div>
          </a>
        ))}
      </div>
      <div className="div" />
      <div className="sec">Task Summary Per Member</div>
      <div className="card">
        {tasks.map((m) => (
          <div className="row" key={m.name}>
            <div className="row-left">
              <div className="avatar">{m.initials}</div>
              <div>
                <div className="row-name">{m.name}</div>
                <div className="row-role">{m.desc}</div>
              </div>
            </div>
            <span className="badge b-active">Active</span>
          </div>
        ))}
      </div>
    </>
  )
}
