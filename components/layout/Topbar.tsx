'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Topbar({ pageTitle }: { pageTitle: string }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setTime(`${h}:${m}:${s}`)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      setDate(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-pulse" />
        <div className="brand-name">Core AI Vision</div>
      </div>
      <div className="topbar-center">{pageTitle}</div>
      <div className="topbar-right">
        <a className="top-btn" href="https://www.notion.so/34a7fe3e7f3d81f996b0cde17f7bbd35" target="_blank" rel="noreferrer">
          ◈ Notion HQ
        </a>
        <a className="top-btn top-btn-drive" href="https://drive.google.com/drive/folders/1kVzNHwpDZOXpGzlzbOaaK-iTWMcDaaQ9" target="_blank" rel="noreferrer">
          ◫ Drive
        </a>
        <div>
          <div className="live-time">{time}</div>
          <div className="live-date-small">{date}</div>
        </div>
      </div>
    </div>
  )
}
