// ─── Sound FX utility ─────────────────────────────────────────────────────────
// Uses Web Audio API — no audio files required.
// All functions are SSR-safe and fail silently on unsupported browsers.

export type SoundType = 'success' | 'error' | 'pop' | 'send'

interface Tone {
  frequency: number
  duration: number
  type: OscillatorType
  startTime: number
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    return new AudioContext()
  } catch {
    return null
  }
}

function playTones(tones: Tone[]): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    tones.forEach(({ frequency, duration, type, startTime }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = type
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime)

      gain.gain.setValueAtTime(0.18, ctx.currentTime + startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

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
    { frequency: 220, duration: 0.15, type: 'sine', startTime: 0 },
    { frequency: 440, duration: 0.15, type: 'sine', startTime: 0.15 },
  ],

  // Descending tone: 440hz → 220hz, 0.2s, sawtooth
  error: [
    { frequency: 440, duration: 0.1,  type: 'sawtooth', startTime: 0 },
    { frequency: 220, duration: 0.15, type: 'sawtooth', startTime: 0.1 },
  ],

  // Single short pop: 800hz, 0.08s, sine
  pop: [
    { frequency: 800, duration: 0.08, type: 'sine', startTime: 0 },
  ],

  // Quick ascending three-step: 300→500→700hz, 0.08s each, sine
  send: [
    { frequency: 300, duration: 0.08, type: 'sine', startTime: 0 },
    { frequency: 500, duration: 0.08, type: 'sine', startTime: 0.08 },
    { frequency: 700, duration: 0.08, type: 'sine', startTime: 0.16 },
  ],
}

export function playSound(type: SoundType): void {
  playTones(SOUNDS[type])
}
