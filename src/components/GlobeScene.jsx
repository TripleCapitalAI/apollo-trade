import { useEffect, useRef } from 'react'

/* Canvas 2D wireframe globe — matches ai-triple.com aesthetic */
export default function GlobeScene({ size = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, start = null

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width  = rect.width  * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw(ts) {
      if (!start) start = ts
      const t = ts - start

      const W = canvas.getBoundingClientRect().width
      const H = canvas.getBoundingClientRect().height
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H / 2
      const R  = Math.min(W, H) * 0.29 * size
      const rotY = t * 0.00022

      /* ── Latitude rings ── */
      const LAT = 11
      for (let i = 1; i < LAT; i++) {
        const phi = (i / LAT) * Math.PI
        const y   = cy - R * Math.cos(phi)
        const rx  = R  * Math.sin(phi)
        const a   = 0.05 + 0.04 * Math.sin(phi * 2)
        ctx.beginPath()
        ctx.ellipse(cx, y, rx, rx * 0.24, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(180,255,243,${a})`
        ctx.lineWidth   = 0.55
        ctx.stroke()
      }

      /* ── Longitude arcs ── */
      const LNG = 16
      for (let i = 0; i < LNG; i++) {
        const lng = (i / LNG) * Math.PI + rotY
        const vis = Math.abs(Math.cos(lng % Math.PI))
        const a   = 0.025 + 0.11 * vis * 0.65

        ctx.beginPath()
        const STEPS = 90
        for (let j = 0; j <= STEPS; j++) {
          const phi  = (j / STEPS) * Math.PI
          const sinP = Math.sin(phi)
          const cosP = Math.cos(phi)
          const x3   = R * sinP * Math.cos(lng)
          const y3   = R * cosP
          const z3   = R * sinP * Math.sin(lng)
          const px   = cx + x3
          const py   = cy - y3 * 0.95 + z3 * 0.07
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.strokeStyle = `rgba(180,255,243,${a})`
        ctx.lineWidth   = 0.5
        ctx.stroke()
      }

      /* ── Equator highlight ── */
      ctx.beginPath()
      ctx.ellipse(cx, cy, R, R * 0.24, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(136,153,255,0.14)'
      ctx.lineWidth   = 1
      ctx.stroke()

      /* ── Orbital rings + orbiting dots ── */
      const orbits = [
        { a: R * 1.68, b: R * 0.40, tilt: -0.38, phase: 0,   speed:  1.9e-4, dr: 3.8, col: [255,255,255] },
        { a: R * 2.05, b: R * 0.54, tilt:  0.58, phase: 2.1, speed: -1.4e-4, dr: 3.2, col: [180,255,243] },
        { a: R * 1.38, b: R * 0.33, tilt:  1.20, phase: 4.4, speed:  2.3e-4, dr: 2.6, col: [255,255,255] },
        { a: R * 2.40, b: R * 0.30, tilt: -1.00, phase: 1.0, speed: -0.9e-4, dr: 2.2, col: [136,153,255] },
      ]

      for (const o of orbits) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(o.tilt)

        /* ring */
        ctx.beginPath()
        ctx.ellipse(0, 0, o.a, o.b, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.09)'
        ctx.lineWidth   = 0.75
        ctx.stroke()

        /* dot position */
        const ang = t * o.speed + o.phase
        const dx  = o.a * Math.cos(ang)
        const dy  = o.b * Math.sin(ang)

        /* glow halo */
        const grd = ctx.createRadialGradient(dx, dy, 0, dx, dy, o.dr * 4)
        grd.addColorStop(0, `rgba(${o.col},0.65)`)
        grd.addColorStop(1, `rgba(${o.col},0)`)
        ctx.beginPath()
        ctx.arc(dx, dy, o.dr * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        /* dot core */
        ctx.beginPath()
        ctx.arc(dx, dy, o.dr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${o.col},0.92)`
        ctx.fill()

        ctx.restore()
      }

      /* ── Subtle globe glow ── */
      const glowR = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.35)
      glowR.addColorStop(0, 'rgba(136,153,255,0.04)')
      glowR.addColorStop(1, 'rgba(136,153,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2)
      ctx.fillStyle = glowR
      ctx.fill()

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
