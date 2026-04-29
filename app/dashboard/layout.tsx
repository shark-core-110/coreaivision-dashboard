'use client'

import { usePathname } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import StatusBar from '@/components/layout/StatusBar'
import { NotificationProvider } from '@/contexts/NotificationContext'

const pageTitles: Record<string, string> = {
  '/dashboard':              'Overview',
  '/dashboard/today':        "Today's Focus",
  '/dashboard/ops':          'Team & Ops',
  '/dashboard/team':         'Team Pages',
  '/dashboard/cadence':      'Weekly Cadence',
  '/dashboard/projects':     'Projects',
  '/dashboard/updates':      'Updates & Activity',
  '/dashboard/scripts':      'Script Pipeline',
  '/dashboard/repurpose':    'Reel Repurposer',
  '/dashboard/pipeline':     'Production Pipeline',
  '/dashboard/bottlenecks':  'Bottlenecks',
  '/dashboard/instagram':    'Instagram',
  '/dashboard/clients':      'Clients',
  '/dashboard/calendar':     'Content Calendar',
  '/dashboard/marketing':     'Marketing',
  '/dashboard/goals':        'Goals',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Command Center'

  return (
    <NotificationProvider>
      <Topbar pageTitle={title} />
      <StatusBar />
      <Sidebar />
      <main className="main">{children}</main>
    </NotificationProvider>
  )
}
