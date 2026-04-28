'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type TaskStatus = 'todo' | 'prog' | 'done'

interface Task {
  id: string
  title: string
  project_name: string
  section: string
  status: TaskStatus
  due_date: string | null
  assigned_to: string | null
  updated_by: string | null
}

const BADGE_LABEL: Record<TaskStatus, string> = { todo: 'To Do', prog: 'In Progress', done: 'Done' }
const BADGE_CLS: Record<TaskStatus, string>   = { todo: 'tb-todo', prog: 'tb-prog', done: 'tb-done' }
const DOT_CLS: Record<TaskStatus, string>     = { todo: 'tdot-todo', prog: 'tdot-prog', done: 'tdot-done' }

const SECTION_ORDER = [
  'Client Deliverables',
  'Micro Drama Series',
  'AI Skool Community',
  'Lyra AI Character',
]

function groupBySectionOrdered(tasks: Task[]) {
  const knownSet = new Set(SECTION_ORDER)
  const known = SECTION_ORDER
    .map(name => ({ name, tasks: tasks.filter(t => t.section === name) }))
    .filter(g => g.tasks.length > 0)
  const extra = [...new Set(tasks.filter(t => !knownSet.has(t.section)).map(t => t.section))]
    .map(name => ({ name, tasks: tasks.filter(t => t.section === name) }))
  return [...known, ...extra]
}

export default function Projects() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      setFetchError(error.message)
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const toggle = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'

    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t))

    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: nextStatus, updated_by: 'User', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: task.status } : t))
      return
    }

    await supabase.from('activity_log').insert({
      entity_type: 'task',
      entity_id: id,
      action: 'status_change',
      description: `"${task.title}" marked ${nextStatus}`,
      changed_by: 'User',
      changed_by_type: 'human',
    })
  }

  const done  = tasks.filter(t => t.status === 'done').length
  const total = tasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const sections = groupBySectionOrdered(tasks)
  const left  = sections.slice(0, Math.ceil(sections.length / 2))
  const right = sections.slice(Math.ceil(sections.length / 2))

  const TaskRow = ({ t }: { t: Task }) => (
    <div className="task" onClick={() => toggle(t.id)} style={{ cursor: 'pointer' }}>
      <div className={`tdot ${DOT_CLS[t.status]}`} />
      <div className={`tname ${t.status === 'done' ? 'done' : ''}`}>{t.title}</div>
      <div className="tdate">{t.due_date ?? ''}</div>
      <span className={`tbadge ${BADGE_CLS[t.status]}`}>{BADGE_LABEL[t.status]}</span>
    </div>
  )

  if (loading) {
    return <div className="metric-label" style={{ padding: '40px 0', textAlign: 'center' }}>Loading tasks…</div>
  }

  if (fetchError) {
    return <div className="metric-label" style={{ padding: '40px 0', color: 'var(--red)' }}>Error: {fetchError}</div>
  }

  return (
    <>
      <div style={{
        background: 'rgba(26,112,173,.06)', border: '0.5px solid rgba(26,112,173,.2)',
        borderRadius: 8, padding: '10px 16px', marginBottom: 20,
        fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--blue)' }}>Projects</strong>
        &nbsp;&middot;&nbsp; Click any task to toggle between To Do and Done
        &nbsp;&middot;&nbsp; Tasks are grouped by deliverable type
        &nbsp;&middot;&nbsp; Due dates turn red when overdue
      </div>
      <div className="metric" style={{ marginBottom: 16 }}>
        <div className="metric-label">Weekly Output Progress</div>
        <div className="prog-wrap">
          <div className="prog-row">
            <span>0</span>
            <span style={{ color: 'var(--gold)' }}>{done} / {total} tasks done · {pct}%</span>
            <span>{total}</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill prog-gold" style={{ width: `${pct}%`, transition: 'width .4s ease' }} />
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="metric-label" style={{ padding: '40px 0', textAlign: 'center' }}>
          No tasks yet — run the SQL schema in Supabase to seed data.
        </div>
      ) : (
        <div className="grid2">
          <div>{left.map(sec => (
            <div key={sec.name}>
              <div className="sec">{sec.name}</div>
              <div className="card">{sec.tasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
            </div>
          ))}</div>
          <div>{right.map(sec => (
            <div key={sec.name}>
              <div className="sec">{sec.name}</div>
              <div className="card">{sec.tasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
            </div>
          ))}</div>
        </div>
      )}
    </>
  )
}
