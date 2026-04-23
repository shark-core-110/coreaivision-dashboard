'use client'

import { useEffect, useState } from 'react'

const days = [
  {
    id: 'mon', label: 'Monday', title: 'Plan & Align',
    items: ['Open Notion HQ, review last week', 'Update team tasks for the week', "Set This Week's Focus (3 priorities)", 'Check client deliverables due', 'Post Monday brief in Slack'],
  },
  {
    id: 'wed', label: 'Wednesday', title: 'Review & Adjust',
    items: ['Mid-week standup in Notion', 'Update task statuses (Done / In Progress)', 'Review content performance', 'Address blockers, reassign if needed', 'Check in on Lyra generation pipeline'],
  },
  {
    id: 'fri', label: 'Friday', title: 'Wrap & Reflect',
    items: ['Complete weekly review in Notion', 'Mark tasks complete or carry forward', 'Log weekly wins + learnings', 'Archive daily log entries', 'Set rough priorities for next week'],
  },
]

export default function Cadence() {
  const [todayId, setTodayId] = useState('')

  useEffect(() => {
    const d = new Date().getDay()
    if (d === 1) setTodayId('mon')
    else if (d === 3) setTodayId('wed')
    else if (d === 5) setTodayId('fri')
  }, [])

  return (
    <>
      <div className="focus-block">
        <div className="focus-label">Operating Rhythm — Mon · Wed · Fri</div>
        <div className="focus-text">Three check-ins per week keep the team aligned without over-meeting. Each session is 15 minutes max in Notion.</div>
      </div>
      <div className="cadence-grid">
        {days.map((day) => (
          <div key={day.id} className={`cadence-card ${todayId === day.id ? 'today-card' : ''}`}>
            <div className="cadence-day">{day.label}</div>
            <div className="cadence-title">{day.title}</div>
            <ul className="cadence-items">
              {day.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="div" />
      <div className="sec">Quick Jump</div>
      <div className="qa-row">
        <a className="qa-btn" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">📋 Open Standup in Notion</a>
        <a className="qa-btn" href="https://app.slack.com" target="_blank" rel="noreferrer">💬 Post in Slack</a>
        <a className="qa-btn" href="https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9" target="_blank" rel="noreferrer">📁 Open Drive</a>
      </div>
    </>
  )
}
