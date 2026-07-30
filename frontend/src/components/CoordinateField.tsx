import { useMemo } from "react"

// Tiny deterministic PRNG (mulberry32) so the star field is stable across renders
// instead of jumping around every time React re-draws.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The signature element: a scatter of faint "anime" points in taste-space.
// Points near the center (the origin, where your picks sit) glow a little warmer.
export function CoordinateField() {
  const dots = useMemo(() => {
    const rand = mulberry32(7)
    return Array.from({ length: 90 }, () => {
      const x = rand() * 100
      const y = rand() * 100
      // distance from center (50,50), normalized 0..1
      const d = Math.hypot(x - 50, y - 50) / 70
      return {
        x,
        y,
        r: 0.4 + rand() * 1.3,
        // fade out toward the edges; a few near the center pick up the amber signal
        opacity: Math.max(0, 0.35 - d * 0.3) + rand() * 0.05,
        warm: d < 0.28 && rand() > 0.6,
      }
    })
  }, [])

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={d.warm ? "var(--signal)" : "var(--muted-foreground)"}
          opacity={d.opacity}
        />
      ))}
    </svg>
  )
}
