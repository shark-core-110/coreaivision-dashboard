import type { ReactNode } from 'react'

interface SVGRingProps {
  /** 0-100 percent fill */
  pct: number
  /** Circle radius in SVG units */
  radius: number
  /** CSS class applied to background circle (controls stroke width/color) */
  bgClass: string
  /** CSS class applied to filled arc */
  fillClass: string
  /** Stroke padding outside the circle (default 4) — keeps stroke from clipping */
  pad?: number
  /** Centered content (avatar initials, percentage label, etc.) */
  children?: ReactNode
  /** Wrapper class for absolute-positioning the children */
  wrapperClass?: string
}

/**
 * Unified SVG progress ring. Replaces three near-identical inline
 * implementations in clients, ops, and instagram pages.
 *
 * Geometry: circumference = 2π × radius. stroke-dashoffset shrinks
 * proportionally to pct so the arc draws clockwise from 12 o'clock
 * (relies on parent CSS rotation, same as the original implementations).
 */
export default function SVGRing({
  pct,
  radius,
  bgClass,
  fillClass,
  pad = 4,
  children,
  wrapperClass,
}: SVGRingProps) {
  const size  = (radius + pad) * 2
  const circ  = 2 * Math.PI * radius
  const clamp = Math.max(0, Math.min(100, pct))
  const offset = circ - (clamp / 100) * circ

  return (
    <div className={wrapperClass} style={{ position: 'relative', display: 'inline-block' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ display: 'block' }}>
        <circle className={bgClass} cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className={fillClass}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
        />
      </svg>
      {children && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}
