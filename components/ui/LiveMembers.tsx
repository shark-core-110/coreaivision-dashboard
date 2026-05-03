'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceEntry {
  name: string
  online_at: string
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export default function LiveMembers() {
  const [members, setMembers] = useState<PresenceEntry[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('team-presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceEntry>()
        const active: PresenceEntry[] = Object.values(state)
          .flat()
          .map(p => ({ name: p.name, online_at: p.online_at }))
          .filter((p): p is PresenceEntry => !!p.name)
        setMembers(active)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: members.length > 0 ? 12 : 0,
      }}>
        <span style={{
          display: 'inline-block', width: 7, height: 7,
          borderRadius: '50%',
          background: members.length > 0 ? '#22c55e' : 'var(--ink4)',
          boxShadow: members.length > 0 ? '0 0 6px #22c55e88' : 'none',
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>
          {members.length === 0
            ? 'No team members active right now'
            : `${members.length} member${members.length !== 1 ? 's' : ''} active on their dashboard`
          }
        </span>
      </div>

      {members.map(m => (
        <div key={m.name} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 0',
          borderTop: '0.5px solid var(--b1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(26,112,173,.1)',
              border: '1px solid rgba(26,112,173,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'var(--blue)',
            }}>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{m.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 10,
              background: '#22c55e18', color: '#22c55e',
              border: '0.5px solid #22c55e40',
            }}>
              ● Live
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink4)' }}>
              {timeAgo(m.online_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
