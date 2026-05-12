import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cached at the edge for 60s — activity feed doesn't need sub-second freshness
export const revalidate = 60

export interface ActivityItem {
  id:        string
  source:    'activity_log' | 'update'
  actor:     string
  actorType: string
  verb:      string
  object:    string
  entityType?: string
  entityId?:   string
  at:        string  // ISO 8601
}

type RangeKey = 'today' | '7d' | '30d'

function rangeToCutoff(range: RangeKey): string {
  const now = new Date()
  if (range === 'today') {
    // Start of today in UTC — accurate enough for an activity feed
    now.setUTCHours(0, 0, 0, 0)
    return now.toISOString()
  }
  const days = range === '7d' ? 7 : 30
  now.setUTCDate(now.getUTCDate() - days)
  return now.toISOString()
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const rangeParam = (searchParams.get('range') ?? '7d') as RangeKey
  const range: RangeKey = ['today', '7d', '30d'].includes(rangeParam) ? rangeParam : '7d'

  const cutoff = rangeToCutoff(range)
  const supabase = await createClient()

  // Pull both sources in parallel — activity_log captures task/script mutations,
  // updates captures daily notes written by humans or AI
  const [logRes, updRes] = await Promise.all([
    supabase
      .from('activity_log')
      .select('id, entity_type, entity_id, action, description, changed_by, changed_by_type, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('updates')
      .select('id, content, author, author_type, update_type, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (logRes.error && updRes.error) {
    return NextResponse.json(
      { error: logRes.error.message },
      { status: 500 }
    )
  }

  const fromLog: ActivityItem[] = (logRes.data ?? []).map((row) => ({
    id:         `log-${row.id}`,
    source:     'activity_log',
    actor:      row.changed_by ?? 'System',
    actorType:  row.changed_by_type ?? 'system',
    verb:       row.action ?? 'changed',
    object:     row.description ?? '',
    entityType: row.entity_type ?? undefined,
    entityId:   row.entity_id ?? undefined,
    at:         row.created_at,
  }))

  const fromUpdates: ActivityItem[] = (updRes.data ?? []).map((row) => ({
    id:         `upd-${row.id}`,
    source:     'update',
    actor:      row.author ?? 'Unknown',
    actorType:  row.author_type ?? 'human',
    verb:       row.update_type === 'weekly' ? 'posted weekly note' : 'posted update',
    object:     row.content ?? '',
    at:         row.created_at,
  }))

  // Merge and sort descending by timestamp
  const merged = [...fromLog, ...fromUpdates].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )

  return NextResponse.json({
    range,
    count: merged.length,
    items: merged,
  })
}
