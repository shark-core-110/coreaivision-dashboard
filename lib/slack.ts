// ─── Slack client-side helper ─────────────────────────────────────────────────
// Fire-and-forget — never throws, never blocks the UI.

export async function postToSlack(text: string): Promise<void> {
  try {
    await fetch('/api/slack/notify', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ text }),
    })
  } catch {
    // Silently ignore — Slack is non-critical
  }
}
