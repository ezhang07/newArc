import { useEffect, useRef } from "react"

// Tiny deterministic PRNG (mulberry32) so the cloud is the same every load
// instead of reshuffling on each mount.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NUM_POINTS = 170
const FOCAL = 2.4 // perspective "camera distance"; larger = flatter
const EDGE_DIST = 0.42 // 3D distance under which two points get a connecting line
const WARM_RADIUS = 0.7 // points this close to the origin glow amber (the "taste core")

type P3 = { x: number; y: number; z: number; warm: boolean }

// The signature element: a 3D scatter of "anime" points in taste-space.
// The cloud drifts on its own and rotates toward the cursor, so moving the
// mouse feels like shifting your viewpoint through the vector space.
export function CoordinateField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // pointer target (tx,ty) vs smoothed current (x,y), each in [-1, 1]
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas: HTMLCanvasElement = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return
    // Give ctx a non-null *declared* type so the closures below (render/resize)
    // don't lose the narrowing — TS drops control-flow narrowing across nested fns.
    const ctx: CanvasRenderingContext2D = context

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    // --- Build the point cloud once, in a centered cube [-1, 1]^3 ---
    const rand = mulberry32(42)
    const points: P3[] = Array.from({ length: NUM_POINTS }, () => {
      const x = rand() * 2 - 1
      const y = rand() * 2 - 1
      const z = rand() * 2 - 1
      const radius = Math.hypot(x, y, z)
      return { x, y, z, warm: radius < WARM_RADIUS }
    })

    // Precompute which point-pairs are close enough in 3D to draw an edge.
    // O(n^2) but runs ONCE, not per frame.
    const edges: [number, number][] = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i]
        const b = points[j]
        const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
        if (d < EDGE_DIST) edges.push([i, j])
      }
    }

    // --- Canvas sizing (handle high-DPI screens so points stay crisp) ---
    let dpr = 1
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // --- Cursor tracking (listen on the window so it works everywhere) ---
    function onPointerMove(e: PointerEvent) {
      pointer.current.tx = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.current.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (!reduceMotion) window.addEventListener("pointermove", onPointerMove)

    // reusable projection buffer
    const proj = points.map(() => ({ sx: 0, sy: 0, nd: 0 }))

    function render(t: number) {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      // ease the smoothed pointer toward its target for lag-free-but-fluid motion
      const p = pointer.current
      p.x += (p.tx - p.x) * 0.05
      p.y += (p.ty - p.y) * 0.05

      // rotation = slow auto-drift + cursor influence
      const ry = t * 0.00008 + p.x * 0.7 // yaw (left/right)
      const rx = -p.y * 0.5 // pitch (up/down)
      const cosY = Math.cos(ry)
      const sinY = Math.sin(ry)
      const cosX = Math.cos(rx)
      const sinX = Math.sin(rx)

      const cx = w / 2
      const cy = h / 2
      // Scale X by width and Y by height (anisotropic) so the cloud fills the
      // whole viewport rectangle — otherwise a symmetric cube sits in a
      // centered square and the left/right thirds of a wide screen stay empty.
      // Overscan (>0.5) pushes the outermost points off-screen for a full bleed.
      const scaleX = w * 0.62
      const scaleY = h * 0.62

      // project every point: rotate (Y then X) -> perspective divide -> screen
      for (let i = 0; i < points.length; i++) {
        const pt = points[i]
        const x1 = pt.x * cosY - pt.z * sinY
        const z1 = pt.x * sinY + pt.z * cosY
        const y1 = pt.y * cosX - z1 * sinX
        const z2 = pt.y * sinX + z1 * cosX
        const persp = FOCAL / (FOCAL + z2)
        // normalized depth 0 (far) .. 1 (near), for size + opacity
        const nd = (persp - 0.706) / (1.71 - 0.706)
        proj[i].sx = cx + x1 * scaleX * persp
        proj[i].sy = cy + y1 * scaleY * persp
        proj[i].nd = Math.max(0, Math.min(1, nd))
      }

      // faint connective web (drawn first, under the points)
      for (const [i, j] of edges) {
        const a = proj[i]
        const b = proj[j]
        const alpha = 0.2 * Math.min(a.nd, b.nd)
        if (alpha < 0.008) continue
        ctx.strokeStyle = `rgba(150, 165, 195, ${alpha})`
        ctx.lineWidth = 0.9
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }

      // points, back-to-front so near ones sit on top
      const order = proj
        .map((_, i) => i)
        .sort((a, b) => proj[a].nd - proj[b].nd)
      for (const i of order) {
        const { sx, sy, nd } = proj[i]
        const r = 1.3 + nd * 2.2
        const alpha = 0.28 + nd * 0.52
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = points[i].warm
          ? `rgba(231, 177, 90, ${alpha})` // amber signal near the core
          : `rgba(150, 165, 195, ${alpha * 0.75})` // cool grey outskirts
        ctx.fill()
      }

      ctx.restore()
    }

    let raf = 0
    if (reduceMotion) {
      // static single frame, no animation loop
      render(0)
    } else {
      const loop = (t: number) => {
        render(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
