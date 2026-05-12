'use client'

import { useState, type ReactNode } from 'react'

type Severity = 'crit' | 'normal' | 'muted'

interface CollapseChipProps {
  /** Count badge shown left of the label */
  count: number
  /** Chip label, e.g. "Critical Gaps" */
  label: string
  /** Visual treatment — critical adds red accent */
  severity?: Severity
  /** Default open state */
  defaultOpen?: boolean
  /** Body shown when expanded */
  children: ReactNode
}

/**
 * Count chip that toggles to reveal a body. Replaces the inline
 * useState + collapse-chip button pattern used in overview and instagram pages.
 */
export default function CollapseChip({
  count,
  label,
  severity = 'normal',
  defaultOpen = false,
  children,
}: CollapseChipProps) {
  const [open, setOpen] = useState(defaultOpen)
  const chipClass = severity === 'crit'
    ? 'collapse-chip collapse-chip-crit'
    : 'collapse-chip'

  return (
    <>
      <button
        type="button"
        className={chipClass}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="collapse-chip-count">{count}</span>
        <span>{label}</span>
        <span className={`collapse-chip-arrow${open ? ' open' : ''}`}>▼</span>
      </button>
      {open && <div className="collapse-body">{children}</div>}
    </>
  )
}
