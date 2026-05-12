'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const adminNavItems = [
  { section: 'Command', items: [
    { label: 'Overview',      href: '/dashboard',             icon: '◈', key: '1' },
    { label: "Today's Focus", href: '/dashboard/today',       icon: '◉', key: 'T' },
  ]},
  { section: 'Operations', items: [
    { label: 'Team & Ops',    href: '/dashboard/ops',         icon: '⚙', key: '2' },
    { label: 'Team Pages',    href: '/dashboard/team',        icon: '◎', key: 'P' },
    { label: 'Assign Tasks',  href: '/dashboard/assign-tasks',icon: '✦', key: 'A' },
    { label: 'Weekly Cadence',href: '/dashboard/cadence',     icon: '◑', key: 'W' },
    { label: 'Projects',      href: '/dashboard/projects',    icon: '◫', key: '3' },
    { label: 'Updates',       href: '/dashboard/updates',     icon: '◌', key: 'U' },
    { label: 'Scripts',       href: '/dashboard/scripts',     icon: '◧', key: 'S' },
    { label: 'Repurpose',     href: '/dashboard/repurpose',   icon: '↻', key: 'R' },
    { label: 'Pipeline',      href: '/dashboard/pipeline',    icon: '▷', key: 'L' },
    { label: 'Content Cal',   href: '/dashboard/calendar',    icon: '☰', key: '7' },
    { label: 'Bottlenecks',   href: '/dashboard/bottlenecks', icon: '◉', key: '4' },
  ]},
  { section: 'AI Studio', items: [
    { label: 'Lyra Brain',    href: '/dashboard/lyra-brain',  icon: '◈', key: 'B' },
    { label: 'Lyra Deals',    href: '/dashboard/lyra',        icon: '◉', key: 'D' },
  ]},
  { section: 'Growth', items: [
    { label: 'Instagram',     href: '/dashboard/instagram',   icon: '◆', key: '5' },
    { label: 'Clients',       href: '/dashboard/clients',     icon: '◎', key: '6' },
    { label: 'Marketing',     href: '/dashboard/marketing',   icon: '◐', key: '8' },
  ]},
  { section: 'Vision', items: [
    { label: 'Goals',         href: '/dashboard/goals',       icon: '◑', key: '9' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, loading } = useCurrentUser()

  const closeNav = () => document.body.classList.remove('nav-open')

  // Team member view — minimal nav
  if (!loading && user && !user.isAdmin) {
    return (
      <>
        <div className="nav-backdrop" onClick={closeNav} />
        <nav className="nav">
          <button className="nav-close-btn" onClick={closeNav} aria-label="Close navigation">✕</button>
          <div>
            <div className="nav-section">My Workspace</div>
            <Link
              href="/dashboard/my"
              className={`nav-tab ${pathname === '/dashboard/my' ? 'active' : ''}`}
              onClick={closeNav}
            >
              <span className="nav-tab-icon">◈</span>
              My Dashboard
            </Link>
          </div>

          <div style={{ marginTop: 'auto', padding: '16px 0 8px' }}>
            <div style={{
              margin: '0 8px',
              padding: '10px 12px',
              background: 'var(--s2)',
              border: '0.5px solid var(--b1)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--ink3)',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--ink2)', marginBottom: 3 }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{user.email}</div>
            </div>
          </div>
        </nav>
      </>
    )
  }

  // Admin (Shark) view — full nav
  return (
    <>
      <div className="nav-backdrop" onClick={closeNav} />
      <nav className="nav">
        <button className="nav-close-btn" onClick={closeNav} aria-label="Close navigation">✕</button>
        {adminNavItems.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-tab ${pathname === item.href ? 'active' : ''}`}
                onClick={closeNav}
              >
                <span className="nav-tab-icon">{item.icon}</span>
                {item.label}
                <span className="nav-tab-key">{item.key}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </>
  )
}
