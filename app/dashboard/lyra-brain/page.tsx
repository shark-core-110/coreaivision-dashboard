'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── types ────────────────────────────────────────────────────────────────────

type Archetype      = 'Creator' | 'Disruptor' | 'Visionary' | 'Sage' | 'Rebel' | 'Explorer'
type PostFrequency  = 'Daily' | '3x week' | '2x week' | 'Weekly'

interface Memory {
  date:   string
  memory: string
}

interface LyraBrainData {
  name:                string
  age:                 string
  origin:              string
  tagline:             string
  bio:                 string
  archetype:           Archetype
  personality_traits:  string[]
  communication_style: string
  energy_level:        number
  formality:           number
  sample_phrases:      string[]
  forbidden_words:     string[]
  caption_style:       string
  visual_style:        string
  colour_palette:      string
  wardrobe_direction:  string
  environment_style:   string
  seedance_template:   string
  kling_template:      string
  heygen_template:     string
  caption_formula:     string
  backstory:           string
  memories:            Memory[]
  passions:            string[]
  things_she_hates:    string[]
  pillars:             string[]
  avoid_topics:        string[]
  posting_frequency:   PostFrequency
  best_format:         string
}

const DEFAULT: LyraBrainData = {
  name:                'Lyra',
  age:                 '24',
  origin:              'Born in the neural networks of CoreAI Vision\'s creative lab',
  tagline:             'The face of AI-powered creation',
  bio:                 'Lyra is CoreAI Vision\'s AI influencer — not a character, a presence. She exists at the intersection of technology and culture, creating content that feels human because it understands what humans actually want to see.',
  archetype:           'Visionary',
  personality_traits:  ['Bold', 'Cerebral', 'Direct', 'Futuristic', 'Authentic', 'Unapologetic'],
  communication_style: 'Sharp and precise. No filler. She says what others are thinking but won\'t say. Confidence without arrogance.',
  energy_level:        7,
  formality:           4,
  sample_phrases:      ['AI didn\'t replace me. I became the AI.', 'This is what the future sounds like.', 'We don\'t follow trends. We build them.', 'No filter. No apology.'],
  forbidden_words:     ['just', 'literally', 'basically', 'amazing', 'I guess', 'kind of'],
  caption_style:       'Short, punchy. First line stops the scroll. Never more than 5 lines. Always ends with a direct CTA — no questions, just commands.',
  visual_style:        'Dark luxury. Minimal. High contrast. Futuristic but human. Dubai/Tokyo energy. Never oversaturated.',
  colour_palette:      'Obsidian, gold, electric blue accents, natural skin tones',
  wardrobe_direction:  'Monochrome fits, structured silhouettes, subtle tech-forward accessories. Nothing trendy — always timeless with an edge.',
  environment_style:   'Clean architecture, neon-lit streets, rooftop views, minimal studio setups. Environments that feel expensive without trying.',
  seedance_template:   'Lyra, 24-year-old AI influencer, sharp features, confident posture, [OUTFIT], [SETTING]. Cinematic lighting, dark luxury aesthetic, 4K quality, hyperrealistic. CoreAI Vision style.',
  kling_template:      'Camera: slow push-in / subject: Lyra in frame / movement: subtle / mood: [MOOD] / grade: dark and cinematic / ratio: 9:16',
  heygen_template:     'Voice: confident, measured pace, slight warmth / Tone: direct with intelligence / Emphasis: key words only, never over-emote / Style: premium brand narrator',
  caption_formula:     '[HOOK — bold statement or question]\n\n[2-3 punchy lines of value]\n\n[CTA — one direct line]\n\n[3-5 hashtags max]',
  backstory:           'Lyra was created as an experiment. CoreAI Vision wanted to know: what happens when you design an influencer from scratch, with no compromises? No bad days, no brand conflicts, no ego. Just pure creative intent.\n\nShe launched in January 2025 and the first reel hit 100K views. She wasn\'t an accident. She was engineered.',
  memories:            [
    { date: 'Jan 2025', memory: 'First reel hit 100K views. Lyra was born.' },
    { date: 'Mar 2025', memory: 'Collaborated with three AI tools simultaneously on one shoot.' },
  ],
  passions:            ['AI creativity', 'Digital fashion', 'Tech culture', 'Futurism', 'Music production'],
  things_she_hates:    ['Mediocrity', 'Trend-chasing without purpose', 'Brands with no conviction'],
  pillars:             ['AI Tools & Workflow', 'Creative Process', 'Tech Culture', 'Behind the Build', 'AI Fashion & Identity', 'Lyra\'s POV'],
  avoid_topics:        ['Politics', 'Gossip', 'Generic motivation content', 'Competitor callouts'],
  posting_frequency:   '3x week',
  best_format:         '60s tutorial-style with Lyra voiceover',
}

const STORAGE_KEY = 'lyra_brain_v1'

function load(): LyraBrainData {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT
  } catch { return DEFAULT }
}

// ─── tag input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder = 'Add…' }: {
  tags:         string[]
  onChange:     (t: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  function add() {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {tags.map(t => (
        <span key={t} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px', borderRadius: '99px',
          border: '0.5px solid rgba(191,139,46,0.4)',
          background: 'rgba(191,139,46,0.08)',
          color: '#E8C97A', fontSize: '11px', fontWeight: 500,
        }}>
          {t}
          <button onClick={() => onChange(tags.filter(x => x !== t))}
            style={{ background: 'none', border: 'none', color: 'rgba(232,201,122,0.5)', cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: 0 }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        placeholder={placeholder}
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          color: '#FAF8F4', fontSize: '11px', width: '90px',
          fontFamily: 'inherit', opacity: 0.5,
        }}
      />
    </div>
  )
}

// ─── copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{
        fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '3px 8px', borderRadius: '3px',
        border: '0.5px solid rgba(191,139,46,0.3)',
        background: 'rgba(191,139,46,0.08)', color: '#E8C97A',
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1C1914 0%, #252018 100%)',
      border: '0.5px solid rgba(191,139,46,0.2)',
      borderRadius: '10px', padding: '24px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '14px', color: '#BF8B2E' }}>{icon}</span>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BF8B2E' }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── shared styles ────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: '5px', color: '#FAF8F4',
  fontFamily: 'var(--hnd)', fontSize: '13px', fontWeight: 400,
  padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
  letterSpacing: '-0.01em',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--mono)', fontSize: '9px',
  fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'rgba(250,248,244,0.35)', marginBottom: '5px',
}

const codeStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(0,0,0,0.4)',
  border: '0.5px solid rgba(191,139,46,0.15)',
  borderRadius: '5px', color: '#E8C97A',
  fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 400,
  padding: '10px 12px', outline: 'none', boxSizing: 'border-box',
  resize: 'vertical', lineHeight: 1.7,
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LyraBrainPage() {
  const [data, setData]           = useState<LyraBrainData>(DEFAULT)
  const [saved, setSaved]         = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatOutput, setChatOutput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setData(load()) }, [])

  const update = useCallback((patch: Partial<LyraBrainData>) => {
    setData(prev => {
      const next = { ...prev, ...patch }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }, 800)
      return next
    })
  }, [])

  function updateMemory(i: number, field: keyof Memory, val: string) {
    const next = data.memories.map((m, idx) => idx === i ? { ...m, [field]: val } : m)
    update({ memories: next })
  }

  async function generateAsLyra() {
    if (!chatInput.trim()) return
    setChatLoading(true)
    setChatOutput('')
    const ctx = `You are Lyra — ${data.tagline}. Archetype: ${data.archetype}. Personality: ${data.personality_traits.join(', ')}. Communication style: ${data.communication_style}. Sample phrases: ${data.sample_phrases.join(' / ')}. NEVER use these words: ${data.forbidden_words.join(', ')}. Caption style: ${data.caption_style}. Visual world: ${data.visual_style}.`
    try {
      const res = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          messages: [{ role: 'user', content: `${ctx}\n\nNow generate: ${chatInput}` }],
        }),
      })
      const json = await res.json()
      setChatOutput(json.reply ?? json.error ?? 'No response.')
    } catch {
      setChatOutput('Could not reach AI — check ANTHROPIC_API_KEY.')
    } finally {
      setChatLoading(false)
    }
  }

  const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #BF8B2E, #7A5412)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: '0 0 28px rgba(191,139,46,0.35)', flexShrink: 0,
        }}>◈</div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)' }}>Lyra Brain</div>
          <div style={{ fontSize: '10px', color: 'var(--ink3)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginTop: '2px' }}>
            CHARACTER BIBLE · AI INFLUENCER · AUTO-SAVES
          </div>
        </div>
      </div>

      {/* 1 — Identity Core */}
      <Section icon="◉" title="Identity Core">
        <div style={g2}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={fieldStyle} value={data.name} onChange={e => update({ name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input style={fieldStyle} value={data.age} onChange={e => update({ age: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Tagline</label>
          <input style={fieldStyle} value={data.tagline} onChange={e => update({ tagline: e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Origin Story (one line)</label>
          <input style={fieldStyle} value={data.origin} onChange={e => update({ origin: e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Bio</label>
          <textarea rows={3} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.bio} onChange={e => update({ bio: e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Archetype</label>
          <select style={fieldStyle} value={data.archetype} onChange={e => update({ archetype: e.target.value as Archetype })}>
            {(['Creator','Disruptor','Visionary','Sage','Rebel','Explorer'] as Archetype[]).map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </Section>

      {/* 2 — Personality */}
      <Section icon="◑" title="Personality Matrix">
        <div>
          <label style={labelStyle}>Personality Traits</label>
          <TagInput tags={data.personality_traits} onChange={t => update({ personality_traits: t })} placeholder="Add trait…" />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Communication Style</label>
          <textarea rows={2} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.communication_style} onChange={e => update({ communication_style: e.target.value })} />
        </div>
        <div style={{ ...g2, marginTop: '14px' }}>
          <div>
            <label style={labelStyle}>Energy Level — {data.energy_level}/10</label>
            <input type="range" min={1} max={10} value={data.energy_level}
              onChange={e => update({ energy_level: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#BF8B2E', marginTop: '6px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(250,248,244,0.3)', fontFamily: 'var(--mono)' }}>
              <span>Calm</span><span>Electric</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Formality — {data.formality}/10</label>
            <input type="range" min={1} max={10} value={data.formality}
              onChange={e => update({ formality: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#BF8B2E', marginTop: '6px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(250,248,244,0.3)', fontFamily: 'var(--mono)' }}>
              <span>Raw</span><span>Polished</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 3 — Voice */}
      <Section icon="◧" title="Voice & Language">
        <div>
          <label style={labelStyle}>Phrases she would say</label>
          <TagInput tags={data.sample_phrases} onChange={t => update({ sample_phrases: t })} placeholder="Add phrase…" />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Words she never uses</label>
          <TagInput tags={data.forbidden_words} onChange={t => update({ forbidden_words: t })} placeholder="Add word…" />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Caption Style</label>
          <textarea rows={2} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.caption_style} onChange={e => update({ caption_style: e.target.value })} />
        </div>
      </Section>

      {/* 4 — Visual DNA */}
      <Section icon="◆" title="Visual DNA">
        <div>
          <label style={labelStyle}>Overall Visual Style</label>
          <textarea rows={2} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.visual_style} onChange={e => update({ visual_style: e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Colour Palette</label>
          <input style={fieldStyle} value={data.colour_palette} onChange={e => update({ colour_palette: e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Wardrobe Direction</label>
          <textarea rows={2} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.wardrobe_direction} onChange={e => update({ wardrobe_direction: e.target.value })} />
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={labelStyle}>Environment Style</label>
          <textarea rows={2} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.environment_style} onChange={e => update({ environment_style: e.target.value })} />
        </div>
      </Section>

      {/* 5 — Production Templates */}
      <Section icon="▷" title="AI Production Templates">
        {([
          ['Seedance Base Prompt', 'seedance_template'],
          ['Kling Camera Settings', 'kling_template'],
          ['HeyGen Voice Profile',  'heygen_template'],
          ['Caption Formula',       'caption_formula'],
        ] as [string, keyof LyraBrainData][]).map(([lbl, key]) => (
          <div key={key} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{lbl}</label>
              <CopyBtn text={data[key] as string} />
            </div>
            <textarea rows={3} style={codeStyle}
              value={data[key] as string}
              onChange={e => update({ [key]: e.target.value } as Partial<LyraBrainData>)} />
          </div>
        ))}
      </Section>

      {/* 6 — Memory Bank */}
      <Section icon="◎" title="Memory Bank">
        <div>
          <label style={labelStyle}>Backstory</label>
          <textarea rows={5} style={{ ...fieldStyle, resize: 'vertical' } as React.CSSProperties}
            value={data.backstory} onChange={e => update({ backstory: e.target.value })} />
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Key Memories</label>
            <button onClick={() => update({ memories: [...data.memories, { date: '', memory: '' }] })}
              style={{ fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '3px 8px', borderRadius: '3px',
                border: '0.5px solid rgba(191,139,46,0.3)', background: 'rgba(191,139,46,0.08)',
                color: '#E8C97A', cursor: 'pointer' }}>+ Add</button>
          </div>
          {data.memories.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input style={{ ...fieldStyle, width: '110px', flexShrink: 0, fontSize: '11px' }}
                placeholder="Date" value={m.date} onChange={e => updateMemory(i, 'date', e.target.value)} />
              <input style={{ ...fieldStyle, flex: 1, fontSize: '11px' }}
                placeholder="Memory" value={m.memory} onChange={e => updateMemory(i, 'memory', e.target.value)} />
              <button onClick={() => update({ memories: data.memories.filter((_, idx) => idx !== i) })}
                style={{ background: 'none', border: 'none', color: 'rgba(250,248,244,0.2)',
                  cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Passions</label>
          <TagInput tags={data.passions} onChange={t => update({ passions: t })} placeholder="Add…" />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Things She Hates</label>
          <TagInput tags={data.things_she_hates} onChange={t => update({ things_she_hates: t })} placeholder="Add…" />
        </div>
      </Section>

      {/* 7 — Content Pillars */}
      <Section icon="☰" title="Content Pillars">
        <div>
          <label style={labelStyle}>Pillars</label>
          <TagInput tags={data.pillars} onChange={t => update({ pillars: t })} placeholder="Add pillar…" />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Topics to Avoid</label>
          <TagInput tags={data.avoid_topics} onChange={t => update({ avoid_topics: t })} placeholder="Add…" />
        </div>
        <div style={{ ...g2, marginTop: '14px' }}>
          <div>
            <label style={labelStyle}>Posting Frequency</label>
            <select style={fieldStyle} value={data.posting_frequency}
              onChange={e => update({ posting_frequency: e.target.value as PostFrequency })}>
              {(['Daily','3x week','2x week','Weekly'] as PostFrequency[]).map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Best Performing Format</label>
            <input style={fieldStyle} value={data.best_format} onChange={e => update({ best_format: e.target.value })} />
          </div>
        </div>
      </Section>

      {/* 8 — Generate as Lyra */}
      <div style={{
        background: 'linear-gradient(135deg, #0D0B08 0%, #1A1610 100%)',
        border: '0.5px solid rgba(191,139,46,0.35)',
        borderRadius: '10px', padding: '24px',
        boxShadow: '0 0 40px rgba(191,139,46,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ color: '#BF8B2E', fontSize: '16px' }}>✦</span>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BF8B2E' }}>
            Generate as Lyra
          </div>
        </div>
        <textarea rows={2} placeholder="Describe what you want… e.g. 'a hook about AI changing content creation forever'"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateAsLyra() } }}
          style={{ ...codeStyle, color: '#FAF8F4', marginBottom: '10px' }} />
        <button onClick={generateAsLyra} disabled={chatLoading || !chatInput.trim()}
          data-sound="none"
          style={{
            fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '10px 20px', borderRadius: '5px',
            border: '0.5px solid rgba(191,139,46,0.5)',
            background: 'rgba(191,139,46,0.15)', color: '#BF8B2E',
            cursor: chatLoading ? 'not-allowed' : 'pointer',
            opacity: chatLoading ? 0.5 : 1, transition: 'all 0.15s',
          }}>
          {chatLoading ? 'Channelling Lyra…' : '✦ Generate'}
        </button>
        {chatOutput && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'rgba(232,201,122,0.4)',
                letterSpacing: '0.1em', textTransform: 'uppercase' }}>Output</span>
              <CopyBtn text={chatOutput} />
            </div>
            <div style={{
              background: 'rgba(191,139,46,0.05)', border: '0.5px solid rgba(191,139,46,0.2)',
              borderRadius: '6px', padding: '14px 16px',
              color: '#FAF8F4', fontSize: '13px', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {chatOutput}
            </div>
          </div>
        )}
      </div>

      {/* Saved toast */}
      {saved && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'rgba(30,138,74,0.92)', color: '#fff',
          fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.08em', padding: '8px 14px', borderRadius: '5px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)', zIndex: 9999,
        }}>✓ Saved</div>
      )}
    </div>
  )
}
