import type { ReactNode } from 'react'

interface HeroStatBlockProps {
  /** Big number or short value shown at top */
  value: ReactNode
  /** Label rendered under the value */
  label: string
  /** Optional trend or context line (e.g. "+14 this week") */
  trend?: ReactNode
  /** Optional class override for the value (e.g. to change color/font) */
  valueClass?: string
  /** Optional ID for analytics/test hooks */
  id?: string
}

/**
 * Single-stat block for hero rows. Wraps the .hero-stat-block CSS pattern
 * duplicated across overview, goals, clients, instagram, ops pages.
 */
export default function HeroStatBlock({
  value,
  label,
  trend,
  valueClass = 'hero-num',
  id,
}: HeroStatBlockProps) {
  return (
    <div className="hero-stat-block" id={id}>
      <div className={valueClass}>{value}</div>
      <div className="hero-label">{label}</div>
      {trend && <div className="hero-trend">{trend}</div>}
    </div>
  )
}
