'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ResultItem {
  id:        string
  label:     string
  sublabel?: string
  href:      string
  category:  string
}

const NAV_ITEMS: ResultItem[] = [
  { id: 'nav-overview',    label: 'Overview',         sublabel: 'Dashboard home',           href: '/dashboard',                    category: 'Pages' },
  { id: 'nav-today',       label: "Today's Focus",    sublabel: 'Daily priorities & notes', href: '/dashboard/today',              category: 'Pages' },
  { id: 'nav-ops',         label: 'Team & Ops',       sublabel: 'Capacity, members',        href: '/dashboard/ops',                category: 'Pages' },
  { id: 'nav-projects',    label: 'Projects',         sublabel: 'All projects + tasks',     href: '/dashboard/projects',           category: 'Pages' },
  { id: 'nav-updates',     label: 'Updates',          sublabel: 'Activity feed',            href: '/dashboard/updates',            category: 'Pages' },
  { id: 'nav-activity',    label: 'Activity',         sublabel: 'Unified timeline',         href: '/dashboard/activity',           category: 'Pages' },
  { id: 'nav-pipeline',    label: 'Pipeline',         sublabel: 'Production stages',        href: '/dashboard/pipeline',           category: 'Pages' },
  { id: 'nav-calendar',    label: 'Content Calendar', sublabel: 'Scheduled content',        href: '/dashboard/calendar',           category: 'Pages' },
  { id: 'nav-bottlenecks', label: 'Bottlenecks',      sublabel: 'Blocks & friction',        href: '/dashboard/bottlenecks',        category: 'Pages' },
  { id: 'nav-instagram',   label: 'Instagram',        sublabel: 'Growth & analytics',       href: '/dashboard/instagram',          category: 'Pages' },
  { id: 'nav-clients',     label: 'Clients',          sublabel: 'Client health',            href: '/dashboard/clients',            category: 'Pages' },
  { id: 'nav-goals',       label: 'Goals',            sublabel: 'Strategic vision',         href: '/dashboard/goals',              category: 'Pages' },
  { id: 'nav-scripts',     label: 'Scripts',          sublabel: 'Script pipeline',          href: '/dashboard/scripts',            category: 'Pages' },
  { id: 'nav-repurpose',   label: 'Repurpose',        sublabel: 'Reel repurposer AI',       href: '/dashboard/repurpose',          category: 'Pages' },
  { id: 'nav-lyra',        label: 'Lyra Brain',       sublabel: 'Lyra AI character',        href: '/dashboard/lyra-brain',         category: 'Pages' },
  { id: 'nav-assign',      label: 'Assign Tasks',     sublabel: 'Task assignment',          href: '/dashboard/assign-tasks',       category: 'Pages' },
  { id: 'nav-marketing',   label: 'Marketing',        sublabel: 'Marketing hub',            href: '/dashboard/marketing',          category: 'Pages' },
  { id: 'adm-bottlenecks', label: 'Edit Bottlenecks', sublabel: 'Admin CRUD',               href: '/dashboard/admin/bottlenecks',  category: 'Admin' },
  { id: 'adm-workstreams', label: 'Edit Workstreams', sublabel: 'Admin CRUD',               href: '/dashboard/admin/workstreams',  category: 'Admin' },
  { id: 'adm-goals',       label: 'Edit Goals',       sublabel: 'Admin CRUD',               href: '/dashboard/admin/goals',        category: 'Admin' },
  { id: 'adm-team',        label: 'Edit Team',        sublabel: 'Admin CRUD',               href: '/dashboard/admin/team',         category: 'Admin' },
]

const STATIC_CLIENTS: ResultItem[] = [
  { id: 'client-syntx',  label: 'Syntx.ai',  sublabel: 'All-in-one AI workspace',   href: '/dashboard/clients', category: 'Clients' },
  { id: 'client-arcads', label: 'Arcads AI', sublabel: 'AI ad creative generation', href: '/dashboard/clients', category: 'Clients' },
  { id: 'client-tapnow', label: 'TapNow',    sublabel: 'AI prompt engine',          href: '/dashboard/clients', category: 'Clients' },
  { id: 'client-vailo',  label: 'Vailo.AI',  sublabel: 'AI video & avatars',        href: '/dashboard/clients', category: 'Clients' },
  { id: 'client-atlabs', label: 'Atlabs.ai', sublabel: 'AI studio & production',    href: '/dashboard/clients', category: 'Clients' },
]

function categoryIcon(cat: string) {
  if (cat === 'Pages')    return '◈'
  if (cat === 'Admin')    return '⚙'
  if (cat === 'Tasks')    return '✦'
  if (cat === 'Calendar') return '☰'
  if (cat === 'Team')     return '◉'
  return '◎'
}

export default function CommandPalette() {
  const [open,      setOpen]      = useState(false)
  const [query,     setQuery]     = useState('')
  const [allItems,  setAllItems]  = useState<ResultItem[]>([...NAV_ITEMS, ...STATIC_CLIENTS])
  const [loaded,    setLoaded]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)
  const router   = useRouter()

  // ── Global ⌘K / Ctrl+K trigger ──────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Custom event from Topbar search button ───────────────────────────────
  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener('open-command-palette', onOpen)
    return () => window.removeEventListener('open-command-palette', onOpen)
  }, [])

  // ── Focus / reset on open/close ──────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40)
    } else {
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  // ── Lazy-load live data on first open ────────────────────────────────────
  const loadData = useCallback(async () => {
    if (loaded || loading) return
    setLoading(true)
    try {
      const sb = createClient()
      const [tasksRes, calRes, teamRes] = await Promise.all([
        sb.from('tasks')
          .select('id, title, assigned_to, status')
          .neq('status', 'done')
          .order('updated_at', { ascending: false })
          .limit(60),
        sb.from('content_calendar')
          .select('id, title, date, prod_status')
          .order('date', { ascending: true })
          .limit(40),
        sb.from('dashboard_team')
          .select('id, name, role')
          .eq('inactive', false),
      ])

      const taskItems: ResultItem[] = (tasksRes.data ?? []).map(t => ({
        id:       `task-${t.id as string}`,
        label:    t.title as string,
        sublabel: `${(t.assigned_to as string | null) ?? 'unassigned'} · ${t.status as string}`,
        href:     '/dashboard/projects',
        category: 'Tasks',
      }))

      const calItems: ResultItem[] = (calRes.data ?? []).map(c => ({
        id:       `cal-${c.id as string}`,
        label:    c.title as string,
        sublabel: `${c.date as string} · ${c.prod_status as string}`,
        href:     '/dashboard/calendar',
        category: 'Calendar',
      }))

      const teamItems: ResultItem[] = (teamRes.data ?? []).map(m => ({
        id:       `team-${m.id as string}`,
        label:    m.name as string,
        sublabel: m.role as string,
        href:     '/dashboard/ops',
        category: 'Team',
      }))

      setAllItems([...NAV_ITEMS, ...STATIC_CLIENTS, ...taskItems, ...calItems, ...teamItems])
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [loaded, loading])

  useEffect(() => {
    if (open && !loaded) loadData()
  }, [open, loaded, loadData])

  // ── Filtered + grouped results ───────────────────────────────────────────
  const filtered: ResultItem[] = query.trim() === ''
    ? allItems.filter(i => i.category === 'Pages' || i.category === 'Admin')
    : allItems.filter(i => {
        const q = query.toLowerCase()
        return (
          i.label.toLowerCase().includes(q) ||
          (i.sublabel ?? '').toLowerCase().includes(q)
        )
      })

  const groups: Record<string, ResultItem[]> = {}
  filtered.forEach(item => {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  })

  const flatList = Object.values(groups).flat()

  useEffect(() => { setActiveIdx(0) }, [query])

  // Scroll active row into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  function navigate(item: ResultItem) {
    router.push(item.href)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatList.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flatList[activeIdx]) navigate(flatList[activeIdx])
  }

  if (!open) return null

  let globalIdx = 0

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'clamp(60px, 12vh, 130px)',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          background: '#111',
          border: '0.5px solid rgba(255,255,255,.14)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 72px rgba(0,0,0,.7)',
        }}
      >
        {/* ── Input row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,.07)',
        }}>
          <span style={{ fontSize: 16, color: 'var(--ink4)', flexShrink: 0 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tasks, calendar, team…"
            autoComplete="off"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--ink1)', fontFamily: 'inherit',
            }}
          />
          {loading && (
            <span style={{ fontSize: 11, color: 'var(--ink4)', flexShrink: 0 }}>loading…</span>
          )}
          <kbd style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
            border: '0.5px solid rgba(255,255,255,.15)', color: 'var(--ink4)',
            background: 'rgba(255,255,255,.04)', fontFamily: 'inherit',
          }}>
            ESC
          </kbd>
        </div>

        {/* ── Results list ── */}
        <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto' }}>
          {flatList.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groups).map(([cat, catItems]) => (
              <div key={cat}>
                <div style={{
                  padding: '8px 16px 3px',
                  fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
                  color: 'var(--ink4)', textTransform: 'uppercase',
                }}>
                  {categoryIcon(cat)} {cat}
                </div>
                {catItems.map(item => {
                  const idx = globalIdx++
                  const isActive = activeIdx === idx
                  return (
                    <div
                      key={item.id}
                      data-idx={idx}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      style={{
                        padding: '9px 16px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: isActive ? 'rgba(255,255,255,.07)' : 'transparent',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          color: isActive ? 'var(--ink)' : 'var(--ink1)',
                          fontWeight: isActive ? 500 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {item.label}
                        </div>
                        {item.sublabel && (
                          <div style={{
                            fontSize: 11, color: 'var(--ink4)', marginTop: 1,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <kbd style={{
                          fontSize: 10, padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                          border: '0.5px solid rgba(255,255,255,.15)', color: 'var(--ink4)',
                          background: 'rgba(255,255,255,.04)', fontFamily: 'inherit',
                        }}>
                          ↵
                        </kbd>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '7px 16px',
          borderTop: '0.5px solid rgba(255,255,255,.05)',
          display: 'flex', gap: 16,
          fontSize: 11, color: 'var(--ink4)',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>ESC close</span>
          <span style={{ marginLeft: 'auto', opacity: 0.5 }}>⌘K</span>
        </div>
      </div>
    </div>
  )
}
