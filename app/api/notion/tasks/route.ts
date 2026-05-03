import { NextResponse } from 'next/server'

export interface NotionTask {
  id: string
  title: string
  status: string
  due_date: string | null
  type: string | null
  notes: string | null
  priority: string | null
  notion_url: string
  source: 'notion'
}

function mapStatus(notionStatus: string): string {
  const s = notionStatus.toLowerCase()
  if (s === 'done' || s === 'complete' || s === 'completed') return 'done'
  if (s === 'in progress' || s === 'in-progress') return 'in-progress'
  return 'todo'
}

function stripNamePrefix(title: string, name: string): string {
  // Handles "Niraj — Task title" (em dash) and "Niraj - Task title" (hyphen)
  const emDashIdx = title.indexOf(' — ')
  if (emDashIdx !== -1) return title.slice(emDashIdx + 3).trim()
  const hyphenPrefix = `${name} - `
  if (title.startsWith(hyphenPrefix)) return title.slice(hyphenPrefix.length).trim()
  return title
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const token = process.env.NOTION_TOKEN
  const dbId  = process.env.NOTION_TASKS_DB_ID

  if (!token || !dbId) {
    return NextResponse.json({ tasks: [], error: 'Notion not configured' })
  }

  const body = {
    filter: {
      or: [
        { property: 'Task', title: { starts_with: `${name} —` } },
        { property: 'Task', title: { starts_with: `${name} -` } },
        { property: 'Task', title: { contains: `${name} —` } },
        { property: 'Task', title: { starts_with: 'ALL CREATORS —' } },
        { property: 'Task', title: { starts_with: 'ALL CREATORS -' } },
      ],
    },
    sorts: [{ property: 'Due', direction: 'ascending' }],
    page_size: 100,
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ tasks: [], error: err })
  }

  const data = await res.json() as { results: Record<string, unknown>[] }

  const tasks: NotionTask[] = data.results
    .map((page) => {
      const props = page.properties as Record<string, Record<string, unknown>>
      const pageId = page.id as string

      const titleArr = (props['Task']?.title as Array<{ plain_text: string }>) ?? []
      const rawTitle = titleArr.map(t => t.plain_text).join('')
      const title = stripNamePrefix(rawTitle, name)

      const statusName = (props['Status']?.status as { name?: string } | null)?.name ?? 'Not started'
      const dueStart   = (props['Due']?.date as { start?: string } | null)?.start ?? null
      const typeName   = (props['Type']?.select as { name?: string } | null)?.name ?? null
      const priorityName = (props['Priority']?.select as { name?: string } | null)?.name ?? null
      const notesArr   = (props['Notes']?.rich_text as Array<{ plain_text: string }>) ?? []
      const notes      = notesArr.map(n => n.plain_text).join('').slice(0, 120) || null

      return {
        id: pageId,
        title: title || rawTitle,
        status: mapStatus(statusName),
        due_date: dueStart,
        type: typeName,
        notes,
        priority: priorityName,
        notion_url: `https://notion.so/${pageId.replace(/-/g, '')}`,
        source: 'notion' as const,
      }
    })
    .filter(t => t.status !== 'done')

  return NextResponse.json({ tasks })
}
