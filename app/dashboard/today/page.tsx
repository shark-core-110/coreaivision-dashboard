'use client'

import { useEffect, useState } from 'react'

export default function TodayFocus() {
  const [date, setDate] = useState('')
  const [priorities, setPriorities] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const now = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    setDate(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`)
    setPriorities(localStorage.getItem('cav-priorities') ?? '')
    setNotes(localStorage.getItem('cav-notes') ?? '')
  }, [])

  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Today — {date}</div>
        <div className="focus-text">Top 3 priorities that must happen today. Notes and blockers below.</div>
      </div>
      <div className="focus-grid">
        <div className="focus-card">
          <div className="fc-label">Top 3 Priorities</div>
          <div className="fc-title">What must happen today?</div>
          <textarea
            className="fc-textarea"
            placeholder={'1. \n2. \n3. '}
            value={priorities}
            onChange={(e) => { setPriorities(e.target.value); localStorage.setItem('cav-priorities', e.target.value) }}
          />
        </div>
        <div className="focus-card">
          <div className="fc-label">Quick Notes</div>
          <div className="fc-title">Thoughts & blockers</div>
          <textarea
            className="fc-textarea"
            placeholder="Add notes here…"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); localStorage.setItem('cav-notes', e.target.value) }}
          />
        </div>
      </div>
      <div className="div" />
      <div className="sec">Quick Launch</div>
      <div className="qa-row">
        <a className="qa-btn" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">📋 New Standup</a>
        <a className="qa-btn" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">✅ Add Task</a>
        <a className="qa-btn" href="https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9" target="_blank" rel="noreferrer">📁 Drive</a>
        <a className="qa-btn" href="https://claude.ai" target="_blank" rel="noreferrer">🤖 Claude</a>
        <a className="qa-btn" href="https://app.slack.com" target="_blank" rel="noreferrer">💬 Slack</a>
        <a className="qa-btn" href="https://kling.ai" target="_blank" rel="noreferrer">🎬 Kling</a>
        <a className="qa-btn" href="https://www.instagram.com/core.aivision" target="_blank" rel="noreferrer">📸 Instagram</a>
      </div>
    </>
  )
}
