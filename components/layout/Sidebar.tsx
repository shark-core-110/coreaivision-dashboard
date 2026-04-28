'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { section: 'Command', items: [
    { label: 'Overview',      href: '/dashboard',             icon: '◈', key: '1' },
    { label: "Today's Focus", href: '/dashboard/today',       icon: '◉', key: 'T' },
  ]},
  { section: 'Operations', items: [
    { label: 'Team & Ops',    href: '/dashboard/ops',         icon: '⚙', key: '2' },
    { label: 'Team Pages',    href: '/dashboard/team',        icon: '◎', key: 'P' },
    { label: 'Weekly Cadence',href: '/dashboard/cadence',     icon: '◑', key: 'W' },
    { label: 'Projects',      href: '/dashboard/projects',    icon: '◫', key: '3' },
    { label: 'Updates',       href: '/dashboard/updates',     icon: '◌', key: 'U' },
    { label: 'Scripts',       href: '/dashboard/scripts',     icon: '◧', key: 'S' },
    { label: 'Bottlenecks',   href: '/dashboard/bottlenecks', icon: '◉', key: '4' },
  ]},
  { section: 'Growth', items: [
    { label: 'Instagram',     href: '/dashboard/instagram',      icon: '◆', key: '5' },
    { label: 'Clients',       href: '/dashboard/clients',        icon: '◎', key: '6' },
    { label: 'Content Cal',   href: '/dashboard/calendar',       icon: '☰', key: '7' },
    { label: 'Marketing',     href: '/dashboard/marketing',      icon: '◐', key: '8' },
  ]},
  { section: 'Vision', items: [
    { label: 'Goals',         href: '/dashboard/goals',       icon: '◑', key: '9' },
    { label: 'Brand DNA',     href: '/dashboard/brand',       icon: '◈', key: '0' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="nav">
      {navItems.map((group) => (
        <div key={group.section}>
          <div className="nav-section">{group.section}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-tab ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-tab-icon">{item.icon}</span>
              {item.label}
              <span className="nav-tab-key">{item.key}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
