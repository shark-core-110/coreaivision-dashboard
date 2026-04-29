'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface SlackPayload {
  text: string
  channel?: string
  username?: string
}

export interface NotificationItem {
  id: string
  message: string
  type: NotificationType
  timestamp: Date
  read: boolean
}

interface NotificationContextValue {
  notify: (message: string, type: NotificationType, slackPayload?: SlackPayload) => void
  notifications: NotificationItem[]
  clearAll: () => void
  markRead: (id: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TOASTS = 3
const TOAST_DURATION_MS = 4000
const MAX_HISTORY = 20

const TYPE_ICON: Record<NotificationType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

// ─── Toast item ───────────────────────────────────────────────────────────────

interface ToastProps {
  item: NotificationItem
  onDismiss: (id: string) => void
}

function Toast({ item, onDismiss }: ToastProps) {
  return (
    <div className={`toast toast-${item.type}`} role="alert" aria-live="polite">
      <span className="toast-icon">{TYPE_ICON[item.type]}</span>
      <span className="toast-msg">{item.message}</span>
      <button
        className="toast-close"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [toasts, setToasts] = useState<NotificationItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const notify = useCallback((
    message: string,
    type: NotificationType,
    _slackPayload?: SlackPayload,
  ) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const item: NotificationItem = {
      id,
      message,
      type,
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => [item, ...prev].slice(0, MAX_HISTORY))

    setToasts(prev => {
      const next = [item, ...prev]
      // Evict oldest if over MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        const evicted = next.slice(MAX_TOASTS)
        evicted.forEach(e => {
          const t = timersRef.current.get(e.id)
          if (t !== undefined) {
            clearTimeout(t)
            timersRef.current.delete(e.id)
          }
        })
        return next.slice(0, MAX_TOASTS)
      }
      return next
    })

    const timer = setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
    timersRef.current.set(id, timer)
  }, [dismissToast])

  const clearAll = useCallback(() => {
    setNotifications([])
    setToasts([])
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current.clear()
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ notify, notifications, clearAll, markRead }}>
      {children}
      <div className="toast-container" aria-label="Notifications">
        {toasts.map(t => (
          <Toast key={t.id} item={t} onDismiss={dismissToast} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
