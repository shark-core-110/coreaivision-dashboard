// ─── Sound FX utility ─────────────────────────────────────────────────────────
// Uses Web Audio API — no audio files required.
// All functions are SSR-safe and fail silently on unsupported browsers.

export type SoundType =
  | 'success'
  | 'error'
  | 'pop'
  | 'send'
  | 'nav'
  | 'click'
  | 'focus'
  | 'open'
  | 'close'
  | 'drag'
  | 'drop'
  | 'toggle'
  | 'hover'

// ─── Sound preference ─────────────────────────────────────────────────────────

const SOUND_PREF_KEY = 'coreai_sound'

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(SOUND_PREF_KEY)
  return stored === null ? true : stored === 'true'
}

export function setSoundEnabled(val: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_PREF_KEY, String(val))
}

// ─── Audio context ────────────────────────────────────────────────────────────

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    return new AudioContext()
  } catch {
    return null
  }
}

// ─── Tone primitives ──────────────────────────────────────────────────────────

interface Tone {
  startFreq: number
  endFreq?: number       // if set, linear ramp from startFreq → endFreq
  duration: number
  type: OscillatorType
  gain: number
  startTime: number
}

function playTones(tones: Tone[]): void {
  if (!getSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    tones.forEach(({ startFreq, endFreq, duration, type, gain, startTime }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.type = type
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime + startTime)
      if (endFreq !== undefined) {
        osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + startTime + duration)
      }

      gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

      osc.start(ctx.currentTime + startTime)
      osc.stop(ctx.currentTime + startTime + duration)
    })
  } catch {
    // Silently ignore — some browsers block AudioContext
  }
}

// ─── Sound definitions ────────────────────────────────────────────────────────

const SOUNDS: Record<SoundType, Tone[]> = {
  // Short ascending two-tone chime: 220hz → 440hz, 0.15s each, sine
  success: [
    { startFreq: 220, duration: 0.15, type: 'sine', gain: 0.18, startTime: 0 },
    { startFreq: 440, duration: 0.15, type: 'sine', gain: 0.18, startTime: 0.15 },
  ],

  // Descending tone: 440hz → 220hz, 0.2s, sawtooth
  error: [
    { startFreq: 440, duration: 0.1,  type: 'sawtooth', gain: 0.18, startTime: 0 },
    { startFreq: 220, duration: 0.15, type: 'sawtooth', gain: 0.18, startTime: 0.1 },
  ],

  // Single short pop: 800hz, 0.08s, sine
  pop: [
    { startFreq: 800, duration: 0.08, type: 'sine', gain: 0.18, startTime: 0 },
  ],

  // Quick ascending three-step: 300→500→700hz, 0.08s each, sine
  send: [
    { startFreq: 300, duration: 0.08, type: 'sine', gain: 0.18, startTime: 0 },
    { startFreq: 500, duration: 0.08, type: 'sine', gain: 0.18, startTime: 0.08 },
    { startFreq: 700, duration: 0.08, type: 'sine', gain: 0.18, startTime: 0.16 },
  ],

  // Soft nav click: barely-there, 220hz, 0.05s, sine
  nav: [
    { startFreq: 220, duration: 0.05, type: 'sine', gain: 0.08, startTime: 0 },
  ],

  // General click: crisp, 680hz, 0.06s, sine
  click: [
    { startFreq: 680, duration: 0.06, type: 'sine', gain: 0.12, startTime: 0 },
  ],

  // Input focus: very subtle, 1400hz, 0.035s, sine
  focus: [
    { startFreq: 1400, duration: 0.035, type: 'sine', gain: 0.04, startTime: 0 },
  ],

  // Panel/modal open: frequency glide 280→520hz over 0.14s, sine
  open: [
    { startFreq: 280, endFreq: 520, duration: 0.14, type: 'sine', gain: 0.1, startTime: 0 },
  ],

  // Panel/modal close: frequency glide 520→280hz over 0.1s, sine
  close: [
    { startFreq: 520, endFreq: 280, duration: 0.1, type: 'sine', gain: 0.08, startTime: 0 },
  ],

  // Drag start: quick upward sweep 200→400hz, 0.08s, sine
  drag: [
    { startFreq: 200, endFreq: 400, duration: 0.08, type: 'sine', gain: 0.08, startTime: 0 },
  ],

  // Drop complete: punchy 180hz, 0.12s, sine
  drop: [
    { startFreq: 180, duration: 0.12, type: 'sine', gain: 0.15, startTime: 0 },
  ],

  // Toggle/checkbox: two-tone 900→1300hz, 0.04s each, sine
  toggle: [
    { startFreq: 900,  duration: 0.04, type: 'sine', gain: 0.1, startTime: 0 },
    { startFreq: 1300, duration: 0.04, type: 'sine', gain: 0.1, startTime: 0.04 },
  ],

  // Subtle hover: barely audible, 1800hz, 0.02s, sine
  hover: [
    { startFreq: 1800, duration: 0.02, type: 'sine', gain: 0.03, startTime: 0 },
  ],
}

export function playSound(type: SoundType): void {
  playTones(SOUNDS[type])
}
