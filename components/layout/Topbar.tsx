'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/ui/NotificationBell'
import { SoundToggle } from '@/components/SoundManager'

export default function Topbar({ pageTitle }: { pageTitle: string }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const pathname = usePathname()
  const onMyDashboard = pathname === '/dashboard/my'

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

  const toggleMobileNav = () => {
    document.body.classList.toggle('nav-open')
  }

  return (
    <div className="topbar">
      {/* Hamburger — mobile only, hidden on desktop via CSS */}
      <button className="hamburger-btn" onClick={toggleMobileNav} aria-label="Toggle navigation">
        <span /><span /><span />
      </button>

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

        {/* My Dashboard button — visible on every page except /dashboard/my itself */}
        {!onMyDashboard && (
          <Link
            href="/dashboard/my"
            className="top-btn top-btn-nav"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
            }}
          >
            ◈ My Dashboard
          </Link>
        )}

        {/* Back to main — visible only on /dashboard/my */}
        {onMyDashboard && (
          <Link
            href="/dashboard"
            className="top-btn top-btn-nav"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            ← Main
          </Link>
        )}

        <SoundToggle />
        <NotificationBell />
        <div>
          <div className="live-time">{time}</div>
          <div className="live-date-small">{date}</div>
        </div>
      </div>
    </div>
  )
}
