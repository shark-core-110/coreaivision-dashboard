'use client'

import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import type { NotificationItem } from '@/contexts/NotificationContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)  return `${diffHr}h ago`
  return date.toLocaleDateString()
}

const TYPE_ICON: Record<NotificationItem['type'], string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { notifications, clearAll, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleOpen() {
    setOpen(prev => !prev)
    // Mark all as read when opening
    notifications.forEach(n => { if (!n.read) markRead(n.id) })
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        className="notif-bell"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        style={{
          background: 'none',
          border: 'none',
          padding: '6px',
          borderRadius: '5px',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: 'var(--ink2)',
          transition: 'color 0.15s',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notification history">
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '0.5px solid var(--b1)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink3)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '24px 14px',
                textAlign: 'center',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                color: 'var(--ink4)',
                letterSpacing: '0.04em',
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className="notif-item"
                  style={{ opacity: n.read ? 0.65 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      flexShrink: 0,
                      color: n.type === 'success' ? 'var(--green)'
                           : n.type === 'error'   ? 'var(--red)'
                           : n.type === 'warning' ? 'var(--amber)'
                           : 'var(--blue)',
                    }}>
                      {TYPE_ICON[n.type]}
                    </span>
                    <span style={{ flex: 1, fontSize: '12px', color: 'var(--ink)', lineHeight: 1.45 }}>
                      {n.message}
                    </span>
                  </div>
                  <div className="notif-time">{formatTime(n.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
