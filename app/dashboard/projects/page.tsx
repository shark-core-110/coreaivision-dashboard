'use client'

import { useState } from 'react'

type Task = { id: number; label: string; date: string; status: 'todo' | 'prog' | 'done' }

const initialTasks: Task[] = [
  { id: 1,  label: 'Arcads AI — Reel 1',                      date: 'Apr 28', status: 'todo' },
  { id: 2,  label: 'Arcads AI — Reel 2',                      date: 'Apr 28', status: 'todo' },
  { id: 3,  label: 'TapNow — Reel 1',                         date: 'Apr 28', status: 'todo' },
  { id: 4,  label: 'TapNow — Reel 2',                         date: 'Apr 28', status: 'todo' },
  { id: 5,  label: 'TapNow — Reel 3',                         date: 'Apr 28', status: 'todo' },
  { id: 6,  label: 'Syntx.ai — Reels 1–9 (Week 1 batch)',     date: 'Apr 28', status: 'todo' },
  { id: 7,  label: 'Series concept & episode structure',       date: 'Apr 28', status: 'prog' },
  { id: 8,  label: 'Episode 1 script & shot list',            date: 'Apr 28', status: 'todo' },
  { id: 9,  label: 'First episode production',                date: 'Apr 28', status: 'todo' },
  { id: 10, label: 'Community structure & curriculum outline', date: 'Apr 30', status: 'prog' },
  { id: 11, label: 'Landing page & waitlist',                  date: 'Apr 30', status: 'todo' },
  { id: 12, label: 'Founding member offer',                   date: 'Apr 30', status: 'todo' },
  { id: 13, label: 'Lyra avatar content series',              date: 'Ongoing', status: 'prog' },
  { id: 14, label: 'Lyra Instagram account setup',            date: 'May',    status: 'todo' },
]

const badgeLabel = { todo: 'To Do', prog: 'In Progress', done: 'Done' }
const badgeCls   = { todo: 'tb-todo', prog: 'tb-prog', done: 'tb-done' }
const dotCls     = { todo: 'tdot-todo', prog: 'tdot-prog', done: 'tdot-done' }

export default function Projects() {
  const [tasks, setTasks] = useState(initialTasks)

  const toggle = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return { ...t, status: (t.status === 'done' ? 'todo' : 'done') as Task['status'] }
    }))
  }

  const done = tasks.filter(t => t.status === 'done').length
  const total = tasks.length
  const pct = Math.round((done / total) * 100)

  const clientTasks = tasks.slice(0, 6)
  const dramaTasks  = tasks.slice(6, 9)
  const skoolTasks  = tasks.slice(9, 12)
  const lyraTasks   = tasks.slice(12)

  const TaskRow = ({ t }: { t: Task }) => (
    <div className="task" onClick={() => toggle(t.id)}>
      <div className={`tdot ${dotCls[t.status]}`} />
      <div className={`tname ${t.status === 'done' ? 'done' : ''}`}>{t.label}</div>
      <div className="tdate">{t.date}</div>
      <span className={`tbadge ${badgeCls[t.status]}`}>{badgeLabel[t.status]}</span>
    </div>
  )

  return (
    <>
      <div className="metric" style={{ marginBottom: 16 }}>
        <div className="metric-label">Weekly Output Progress — Apr 22–28</div>
        <div className="prog-wrap">
          <div className="prog-row"><span>0</span><span style={{ color: 'var(--gold)' }}>{done} / {total} tasks done</span><span>{total}</span></div>
          <div className="prog-track"><div className="prog-fill prog-gold" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className="grid2">
        <div>
          <div className="sec">Client Deliverables — This Week</div>
          <div className="card">{clientTasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
          <div className="sec">Syntx.ai Deal Progress</div>
          <div className="card">
            <div className="deal-stats">
              <div className="deal-stat"><div className="deal-stat-label">Total Deliverables</div><div className="deal-stat-val" style={{ color: 'var(--gold)' }}>12 reels</div><div className="deal-stat-sub">AI tutorials & showcases</div></div>
              <div className="deal-stat"><div className="deal-stat-label">Reach Guarantee</div><div className="deal-stat-val" style={{ color: 'var(--green)' }}>10K+</div><div className="deal-stat-sub">6 of 12 reels · 7 days</div></div>
            </div>
            <div><div className="prog-row"><span>Reels delivered</span><span style={{ color: 'var(--gold)' }}>0 / 12</span></div><div className="prog-track"><div className="prog-fill prog-gold" style={{ width: '0%' }} /></div></div>
          </div>
        </div>
        <div>
          <div className="sec">Micro Drama Series</div>
          <div className="card">{dramaTasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
          <div className="sec">AI Skool Community</div>
          <div className="card">{skoolTasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
          <div className="sec">Lyra AI Character</div>
          <div className="card">{lyraTasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
        </div>
      </div>
    </>
  )
}
