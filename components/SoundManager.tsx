'use client'

import { useEffect, useState } from 'react'
import { playSound, getSoundEnabled, setSoundEnabled, type SoundType } from '@/lib/sound'

// ─── SoundManager ─────────────────────────────────────────────────────────────
// Attaches global event listeners to document and plays sounds based on
// what the user interacts with. Renders nothing — pure behaviour component.

export default function SoundManager() {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Element

      // Skip elements that manage their own sounds
      const selfManaged = target.closest('[data-sound="none"]')
      if (selfManaged) return

      // Priority order — first match wins
      const dataSound = target.closest<HTMLElement>('[data-sound]')
      if (dataSound?.dataset.sound && dataSound.dataset.sound !== 'none') {
        playSound(dataSound.dataset.sound as SoundType)
        return
      }

      if (target.closest('.nav-tab')) {
        playSound('nav')
        return
      }

      if (target.closest('[data-modal-trigger]')) {
        playSound('open')
        return
      }

      if (target.closest('button, [role="button"]')) {
        playSound('click')
        return
      }
    }

    function onFocusIn(e: FocusEvent) {
      const target = e.target as Element
      if (target.matches('input, textarea, select')) {
        playSound('focus')
      }
    }

    function onChange(e: Event) {
      const target = e.target as HTMLInputElement
      if (target.matches('input[type="checkbox"], input[type="radio"]')) {
        playSound('toggle')
      } else if (target.matches('select')) {
        playSound('click')
      }
    }

    function onDragStart() {
      playSound('drag')
    }

    function onDragEnd() {
      playSound('drop')
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('change', onChange)
    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('dragend', onDragEnd)

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('change', onChange)
      document.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('dragend', onDragEnd)
    }
  }, [])

  return null
}

// ─── SoundToggle ──────────────────────────────────────────────────────────────
// Small button to toggle sound on/off. Matches .top-btn aesthetic.

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(getSoundEnabled())
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
  }

  return (
    <button
      onClick={toggle}
      title={enabled ? 'Sound on — click to mute' : 'Sound off — click to enable'}
      data-sound="none"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        letterSpacing: '.04em',
        color: enabled ? 'var(--gold)' : 'var(--ink4)',
        background: 'transparent',
        border: '0.5px solid ' + (enabled ? 'var(--gold-line)' : 'var(--b2)'),
        padding: '3px 8px',
        cursor: 'pointer',
        transition: 'color .15s, border-color .15s',
        lineHeight: 1,
      }}
    >
      {enabled ? '◉' : '◎'}
    </button>
  )
}
